#!/bin/bash

# Database Migration Runner for Qivr Platform
# This script runs all migrations in sequence

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ../.env ]; then
    export $(cat ../.env | grep -v '^#' | xargs)
fi

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-qivr}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-postgres}"

echo -e "${GREEN}===========================================
    Qivr Database Migration Runner
===========================================${NC}"

echo -e "${YELLOW}Database Configuration:${NC}"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"
echo ""

# Create migrations tracking table if it doesn't exist
echo -e "${YELLOW}Setting up migrations table...${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    executed_at TIMESTAMPTZ DEFAULT NOW(),
    checksum VARCHAR(64),
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT
);
EOF

# Get list of migration files
MIGRATION_DIR="$(dirname "$0")/migrations"
MIGRATION_FILES=$(ls $MIGRATION_DIR/*.sql 2>/dev/null | sort)

if [ -z "$MIGRATION_FILES" ]; then
    echo -e "${RED}No migration files found in $MIGRATION_DIR${NC}"
    exit 1
fi

echo -e "${YELLOW}Found migration files:${NC}"
for file in $MIGRATION_FILES; do
    basename "$file"
done
echo ""

# Function to calculate file checksum
calculate_checksum() {
    if command -v sha256sum > /dev/null; then
        sha256sum "$1" | cut -d' ' -f1
    elif command -v shasum > /dev/null; then
        shasum -a 256 "$1" | cut -d' ' -f1
    else
        echo "NO_CHECKSUM"
    fi
}

# Run each migration
for migration_file in $MIGRATION_FILES; do
    filename=$(basename "$migration_file")
    checksum=$(calculate_checksum "$migration_file")
    
    echo -e "${YELLOW}Processing: $filename${NC}"
    
    # Check if migration has already been executed
    ALREADY_RUN=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM migrations WHERE filename = '$filename'")
    
    if [ "$ALREADY_RUN" -gt 0 ]; then
        echo -e "  ${GREEN}✓ Already executed${NC}"
        
        # Verify checksum hasn't changed
        STORED_CHECKSUM=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -t -c "SELECT checksum FROM migrations WHERE filename = '$filename'" | tr -d ' ')
        if [ "$checksum" != "$STORED_CHECKSUM" ] && [ "$STORED_CHECKSUM" != "NO_CHECKSUM" ] && [ "$checksum" != "NO_CHECKSUM" ]; then
            echo -e "  ${RED}⚠ Warning: File has been modified since last execution${NC}"
        fi
    else
        echo -e "  Executing migration..."
        
        # Record start time
        START_TIME=$(date +%s%3N)
        
        # Execute migration
        if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$migration_file" > /tmp/migration_output.log 2>&1; then
            # Calculate execution time
            END_TIME=$(date +%s%3N)
            EXEC_TIME=$((END_TIME - START_TIME))
            
            # Record successful migration
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
INSERT INTO migrations (filename, checksum, execution_time_ms, success)
VALUES ('$filename', '$checksum', $EXEC_TIME, true);
EOF
            
            echo -e "  ${GREEN}✓ Success (${EXEC_TIME}ms)${NC}"
        else
            # Migration failed
            ERROR_MSG=$(cat /tmp/migration_output.log | tr '\n' ' ' | sed "s/'/''/g")
            
            # Record failed migration
            PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
INSERT INTO migrations (filename, checksum, success, error_message)
VALUES ('$filename', '$checksum', false, '$ERROR_MSG');
EOF
            
            echo -e "  ${RED}✗ Failed${NC}"
            echo -e "${RED}Error details:${NC}"
            cat /tmp/migration_output.log
            exit 1
        fi
    fi
done

echo ""
echo -e "${GREEN}===========================================
    All migrations completed successfully!
===========================================${NC}"

# Show migration summary
echo -e "${YELLOW}Migration Summary:${NC}"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME <<EOF
SELECT 
    filename,
    TO_CHAR(executed_at, 'YYYY-MM-DD HH24:MI:SS') as executed_at,
    CASE 
        WHEN execution_time_ms < 1000 THEN execution_time_ms || 'ms'
        ELSE ROUND(execution_time_ms::numeric / 1000, 2) || 's'
    END as execution_time,
    CASE success 
        WHEN true THEN '✓' 
        ELSE '✗' 
    END as status
FROM migrations
ORDER BY executed_at DESC
LIMIT 10;
EOF

# Clean up
rm -f /tmp/migration_output.log

echo ""
echo -e "${GREEN}Database is ready!${NC}"
