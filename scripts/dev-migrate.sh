#!/bin/bash

# Development Migration Helper for QIVR
# Makes it easy to create and apply migrations during development

set -e

BACKEND_DIR="/Users/oliver/Projects/qivr/backend"
DB_STATUS_SCRIPT="/Users/oliver/Projects/qivr/scripts/manage-dev-db.sh"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

cd "$BACKEND_DIR"

case "$1" in
    create)
        if [ -z "$2" ]; then
            echo -e "${RED}Error: Migration name required${NC}"
            echo "Usage: $0 create MigrationName"
            exit 1
        fi
        
        echo -e "${YELLOW}Creating migration: $2${NC}"
        dotnet ef migrations add "$2" \
            --project Qivr.Infrastructure \
            --startup-project Qivr.Api \
            --context QivrDbContext
        
        echo -e "${GREEN}✅ Migration created successfully${NC}"
        echo "Review the migration in: Qivr.Infrastructure/Migrations/"
        echo "To apply, run: $0 apply"
        ;;
    
    apply)
        echo -e "${YELLOW}Checking database status...${NC}"
        
        # Check if using AWS RDS
        if [ -f "$BACKEND_DIR/.env.aws-dev" ]; then
            # Check RDS status
            STATUS=$($DB_STATUS_SCRIPT status 2>&1 | grep "Status:" | cut -d' ' -f2)
            if [ "$STATUS" != "available" ]; then
                echo -e "${YELLOW}Starting AWS RDS instance...${NC}"
                $DB_STATUS_SCRIPT start
            fi
        fi
        
        echo -e "${YELLOW}Applying migrations to database...${NC}"
        dotnet ef database update \
            --project Qivr.Infrastructure \
            --startup-project Qivr.Api \
            --context QivrDbContext
        
        echo -e "${GREEN}✅ Migrations applied successfully${NC}"
        ;;
    
    list)
        echo -e "${YELLOW}Current migrations:${NC}"
        dotnet ef migrations list \
            --project Qivr.Infrastructure \
            --startup-project Qivr.Api \
            --context QivrDbContext
        ;;
    
    remove)
        echo -e "${YELLOW}Removing last migration (if not applied)...${NC}"
        dotnet ef migrations remove \
            --project Qivr.Infrastructure \
            --startup-project Qivr.Api \
            --context QivrDbContext
        
        echo -e "${GREEN}✅ Last migration removed${NC}"
        ;;
    
    reset)
        echo -e "${RED}⚠️  WARNING: This will drop and recreate the database!${NC}"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo -e "${YELLOW}Dropping database...${NC}"
            dotnet ef database drop \
                --project Qivr.Infrastructure \
                --startup-project Qivr.Api \
                --context QivrDbContext \
                --force
            
            echo -e "${YELLOW}Recreating database with all migrations...${NC}"
            dotnet ef database update \
                --project Qivr.Infrastructure \
                --startup-project Qivr.Api \
                --context QivrDbContext
            
            echo -e "${YELLOW}Reseeding database...${NC}"
            dotnet run --project Qivr.Tools -- seed
            
            echo -e "${GREEN}✅ Database reset complete${NC}"
        else
            echo "Cancelled"
        fi
        ;;
    
    status)
        echo -e "${YELLOW}Pending migrations:${NC}"
        dotnet ef migrations list \
            --project Qivr.Infrastructure \
            --startup-project Qivr.Api \
            --context QivrDbContext | grep "(Pending)" || echo "All migrations are applied"
        ;;
    
    script)
        if [ -z "$2" ]; then
            echo -e "${YELLOW}Generating SQL script for all migrations...${NC}"
            OUTPUT_FILE="migrations_$(date +%Y%m%d_%H%M%S).sql"
        else
            echo -e "${YELLOW}Generating SQL script from migration $2...${NC}"
            OUTPUT_FILE="migration_$2_$(date +%Y%m%d_%H%M%S).sql"
        fi
        
        dotnet ef migrations script $2 \
            --project Qivr.Infrastructure \
            --startup-project Qivr.Api \
            --context QivrDbContext \
            --output "$OUTPUT_FILE"
        
        echo -e "${GREEN}✅ SQL script saved to: $OUTPUT_FILE${NC}"
        ;;
    
    *)
        echo "QIVR Development Migration Helper"
        echo ""
        echo "Usage: $0 {create|apply|list|remove|reset|status|script}"
        echo ""
        echo "Commands:"
        echo "  create NAME  - Create a new migration with the given name"
        echo "  apply        - Apply pending migrations to database"
        echo "  list         - List all migrations and their status"
        echo "  remove       - Remove the last migration (if not applied)"
        echo "  reset        - Drop and recreate database with all migrations"
        echo "  status       - Show pending migrations"
        echo "  script [FROM]- Generate SQL script for migrations"
        echo ""
        echo "Examples:"
        echo "  $0 create AddPROMFields"
        echo "  $0 apply"
        echo "  $0 status"
        exit 1
        ;;
esac