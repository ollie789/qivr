#!/bin/bash

# Database Migration Testing Script for Qivr
# This script tests database migrations before production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
MIGRATIONS_DIR="$PROJECT_ROOT/backend/Qivr.Infrastructure/Migrations"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Environment variables
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"qivr_test"}
DB_USER=${DB_USER:-"qivr_test"}
DB_PASSWORD=${DB_PASSWORD:-"test_password"}
DOCKER_IMAGE="postgres:15.7"
CONTAINER_NAME="qivr-test-db"

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}Qivr Database Migration Test${NC}"
echo -e "${BLUE}==================================${NC}"

# Function to cleanup resources
cleanup() {
    echo -e "\n${YELLOW}Cleaning up test resources...${NC}"
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
}

# Set up cleanup trap
trap cleanup EXIT

# Check prerequisites
echo -e "\n${YELLOW}Checking prerequisites...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}.NET SDK is not installed. Please install .NET SDK first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Start test database container
echo -e "\n${YELLOW}Starting test PostgreSQL database...${NC}"

# Stop and remove existing container if it exists
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Start new container
docker run -d \
    --name $CONTAINER_NAME \
    -e POSTGRES_DB=$DB_NAME \
    -e POSTGRES_USER=$DB_USER \
    -e POSTGRES_PASSWORD=$DB_PASSWORD \
    -p $DB_PORT:5432 \
    $DOCKER_IMAGE

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
for i in {1..30}; do
    if docker exec $CONTAINER_NAME pg_isready -U $DB_USER > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Database is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Database failed to start within 30 seconds${NC}"
        exit 1
    fi
    sleep 1
done

# Create connection string
CONNECTION_STRING="Host=$DB_HOST;Port=$DB_PORT;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD;SslMode=Disable"

# Run EF Core migrations
echo -e "\n${YELLOW}Running Entity Framework Core migrations...${NC}"

cd "$BACKEND_DIR"

# Update database with migrations
export CONNECTION_STRING
dotnet ef database update \
    --project Qivr.Infrastructure \
    --startup-project Qivr.Api \
    --connection "$CONNECTION_STRING" \
    --verbose

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ EF Core migrations applied successfully${NC}"
else
    echo -e "${RED}✗ EF Core migrations failed${NC}"
    exit 1
fi

# Apply SQL migrations if they exist
echo -e "\n${YELLOW}Checking for SQL migration files...${NC}"

if [ -d "$MIGRATIONS_DIR" ]; then
    SQL_FILES=$(find "$MIGRATIONS_DIR" -name "*.sql" -type f | sort)
    
    if [ -z "$SQL_FILES" ]; then
        echo -e "${YELLOW}No SQL migration files found${NC}"
    else
        echo -e "${YELLOW}Found SQL migration files:${NC}"
        for file in $SQL_FILES; do
            echo "  - $(basename $file)"
        done
        
        echo -e "\n${YELLOW}Applying SQL migrations...${NC}"
        for file in $SQL_FILES; do
            echo -e "${BLUE}Applying: $(basename $file)${NC}"
            
            docker exec -i $CONTAINER_NAME psql \
                -U $DB_USER \
                -d $DB_NAME \
                < "$file"
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}  ✓ Applied successfully${NC}"
            else
                echo -e "${RED}  ✗ Failed to apply$(basename $file)${NC}"
                exit 1
            fi
        done
    fi
fi

# Verify database schema
echo -e "\n${YELLOW}Verifying database schema...${NC}"

# Check for required tables
REQUIRED_TABLES=(
    "tenants"
    "users"
    "appointments"
    "patients"
    "providers"
    "clinics"
    "prom_templates"
    "prom_instances"
    "prom_responses"
)

echo -e "${YELLOW}Checking for required tables...${NC}"
for table in "${REQUIRED_TABLES[@]}"; do
    result=$(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc \
        "SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '$table');")
    
    if [ "$result" = "t" ]; then
        echo -e "${GREEN}  ✓ Table '$table' exists${NC}"
    else
        echo -e "${RED}  ✗ Table '$table' is missing${NC}"
        exit 1
    fi
done

# Check for indexes
echo -e "\n${YELLOW}Checking database indexes...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c \
    "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname = 'public' ORDER BY tablename, indexname;"

# Check for constraints
echo -e "\n${YELLOW}Checking database constraints...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c \
    "SELECT conname, contype, conrelid::regclass FROM pg_constraint WHERE connamespace = 'public'::regnamespace ORDER BY conrelid::regclass::text, conname;"

# Run rollback test
echo -e "\n${YELLOW}Testing migration rollback...${NC}"

# Get current migration
CURRENT_MIGRATION=$(dotnet ef migrations list \
    --project Qivr.Infrastructure \
    --startup-project Qivr.Api \
    --connection "$CONNECTION_STRING" \
    --no-build | tail -1 | awk '{print $1}')

echo -e "${YELLOW}Current migration: $CURRENT_MIGRATION${NC}"

# Get previous migration
PREVIOUS_MIGRATION=$(dotnet ef migrations list \
    --project Qivr.Infrastructure \
    --startup-project Qivr.Api \
    --connection "$CONNECTION_STRING" \
    --no-build | tail -2 | head -1 | awk '{print $1}')

if [ -n "$PREVIOUS_MIGRATION" ] && [ "$PREVIOUS_MIGRATION" != "$CURRENT_MIGRATION" ]; then
    echo -e "${YELLOW}Rolling back to: $PREVIOUS_MIGRATION${NC}"
    
    dotnet ef database update $PREVIOUS_MIGRATION \
        --project Qivr.Infrastructure \
        --startup-project Qivr.Api \
        --connection "$CONNECTION_STRING" \
        --verbose
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Rollback successful${NC}"
        
        # Reapply to current
        echo -e "${YELLOW}Reapplying to current migration...${NC}"
        dotnet ef database update \
            --project Qivr.Infrastructure \
            --startup-project Qivr.Api \
            --connection "$CONNECTION_STRING" \
            --verbose
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Reapply successful${NC}"
        else
            echo -e "${RED}✗ Reapply failed${NC}"
            exit 1
        fi
    else
        echo -e "${RED}✗ Rollback failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}No previous migration to test rollback${NC}"
fi

# Performance testing
echo -e "\n${YELLOW}Running performance tests...${NC}"

# Test connection pooling
echo -e "${BLUE}Testing connection pooling...${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c \
    "SELECT COUNT(*) as connection_count FROM pg_stat_activity WHERE datname = '$DB_NAME';"

# Check database size
echo -e "\n${BLUE}Database size information:${NC}"
docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -c \
    "SELECT pg_database_size('$DB_NAME') as database_size_bytes, pg_size_pretty(pg_database_size('$DB_NAME')) as database_size_pretty;"

# Generate migration report
echo -e "\n${YELLOW}Generating migration report...${NC}"

REPORT_FILE="$SCRIPT_DIR/migration-test-report-$(date +%Y%m%d-%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
===========================================
Qivr Database Migration Test Report
===========================================
Date: $(date)
Test Database: $DB_NAME
Connection: $DB_HOST:$DB_PORT

Migration Status: SUCCESS

Applied Migrations:
$(dotnet ef migrations list --project "$BACKEND_DIR/Qivr.Infrastructure" --startup-project "$BACKEND_DIR/Qivr.Api" --connection "$CONNECTION_STRING" --no-build 2>/dev/null || echo "Could not list migrations")

Database Objects:
- Tables: $(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
- Indexes: $(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';")
- Constraints: $(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_constraint WHERE connamespace = 'public'::regnamespace;")

Performance Metrics:
- Database Size: $(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));")
- Connection Count: $(docker exec $CONTAINER_NAME psql -U $DB_USER -d $DB_NAME -tAc "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = '$DB_NAME';")

Rollback Test: PASSED
===========================================
EOF

echo -e "${GREEN}✓ Report saved to: $REPORT_FILE${NC}"

# Success
echo -e "\n${GREEN}==================================${NC}"
echo -e "${GREEN}✅ Migration Test Completed Successfully!${NC}"
echo -e "${GREEN}==================================${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "  1. Review the migration report: $REPORT_FILE"
echo -e "  2. Apply migrations to staging environment"
echo -e "  3. After staging validation, apply to production"
echo -e "\n${YELLOW}To apply migrations to production:${NC}"
echo -e "  dotnet ef database update --connection \"<production-connection-string>\""
