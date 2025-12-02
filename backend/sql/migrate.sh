#!/bin/bash
set -euo pipefail

# Qivr SQL Migration Runner
# Usage: ./migrate.sh [up|down|status|new] [migration_name]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# Load environment variables
if [ -f "$SCRIPT_DIR/../.env" ]; then
    source "$SCRIPT_DIR/../.env"
fi

# Database connection (override with environment variables)
DB_HOST="${DB_HOST:-qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-qivr}"
DB_USER="${DB_USER:-qivr_user}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [ -z "$DB_PASSWORD" ]; then
    echo "Error: DB_PASSWORD not set. Export it or add to .env"
    exit 1
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

run_sql() {
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"
}

run_sql_file() {
    local file="$1"
    echo -e "${YELLOW}Running: $(basename "$file")${NC}"
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 -f "$file"
}

get_applied_migrations() {
    run_sql -t -A -c "SELECT version FROM qivr.schema_migrations ORDER BY version" 2>/dev/null || echo ""
}

init_tracking() {
    echo -e "${YELLOW}Initializing migration tracking...${NC}"
    run_sql_file "$MIGRATIONS_DIR/000_init_tracking.sql"
    echo -e "${GREEN}Migration tracking initialized${NC}"
}

status() {
    echo -e "${YELLOW}Migration Status${NC}"
    echo "================"

    # Check if tracking table exists
    local tracking_exists=$(run_sql -t -A -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='qivr' AND table_name='schema_migrations')" 2>/dev/null || echo "f")

    if [ "$tracking_exists" != "t" ]; then
        echo -e "${RED}Migration tracking not initialized. Run: ./migrate.sh init${NC}"
        return 1
    fi

    local applied=$(get_applied_migrations)
    local pending_count=0

    for file in "$MIGRATIONS_DIR"/*.sql; do
        [ -f "$file" ] || continue
        local basename=$(basename "$file")
        local version=$(echo "$basename" | cut -d'_' -f1)

        if echo "$applied" | grep -q "^${version}$"; then
            echo -e "${GREEN}[APPLIED]${NC} $basename"
        else
            echo -e "${YELLOW}[PENDING]${NC} $basename"
            ((pending_count++))
        fi
    done

    echo ""
    echo "Pending migrations: $pending_count"
}

migrate_up() {
    local target="${1:-all}"

    # Ensure tracking exists
    local tracking_exists=$(run_sql -t -A -c "SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema='qivr' AND table_name='schema_migrations')" 2>/dev/null || echo "f")

    if [ "$tracking_exists" != "t" ]; then
        init_tracking
    fi

    local applied=$(get_applied_migrations)
    local applied_count=0

    for file in "$MIGRATIONS_DIR"/*.sql; do
        [ -f "$file" ] || continue
        local basename=$(basename "$file")
        local version=$(echo "$basename" | cut -d'_' -f1)
        local name=$(echo "$basename" | sed 's/^[0-9]*_//' | sed 's/\.sql$//')

        # Skip tracking init
        if [ "$version" = "000" ]; then
            continue
        fi

        if echo "$applied" | grep -q "^${version}$"; then
            continue
        fi

        echo -e "${YELLOW}Applying: $basename${NC}"

        # Run in transaction
        run_sql <<EOF
BEGIN;

-- Run migration
\i $file

-- Record migration
INSERT INTO qivr.schema_migrations (version, name, checksum)
VALUES ('$version', '$name', '$(sha256sum "$file" | cut -d' ' -f1)');

COMMIT;
EOF

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Applied: $basename${NC}"
            ((applied_count++))
        else
            echo -e "${RED}Failed: $basename${NC}"
            exit 1
        fi

        if [ "$target" != "all" ] && [ "$applied_count" -ge "$target" ]; then
            break
        fi
    done

    if [ "$applied_count" -eq 0 ]; then
        echo -e "${GREEN}No pending migrations${NC}"
    else
        echo -e "${GREEN}Applied $applied_count migration(s)${NC}"
    fi
}

new_migration() {
    local name="${1:-unnamed}"
    local timestamp=$(date +%Y%m%d%H%M%S)
    local filename="${timestamp}_${name}.sql"
    local filepath="$MIGRATIONS_DIR/$filename"

    cat > "$filepath" << 'EOF'
-- Migration: NAME
-- Created: TIMESTAMP
--
-- Description:
--   <What does this migration do?>
--
-- Rollback:
--   <Include rollback SQL as comments>

BEGIN;

-- Your migration SQL here

COMMIT;
EOF

    sed -i '' "s/NAME/$name/g" "$filepath"
    sed -i '' "s/TIMESTAMP/$(date -u +%Y-%m-%dT%H:%M:%SZ)/g" "$filepath"

    echo -e "${GREEN}Created: $filepath${NC}"
    echo "Edit this file, then run: ./migrate.sh up"
}

mark_applied() {
    local version="$1"
    echo -e "${YELLOW}Marking $version as applied (without running)${NC}"

    local file=$(ls "$MIGRATIONS_DIR"/${version}_*.sql 2>/dev/null | head -1)
    if [ -z "$file" ]; then
        echo -e "${RED}Migration file not found for version $version${NC}"
        exit 1
    fi

    local basename=$(basename "$file")
    local name=$(echo "$basename" | sed 's/^[0-9]*_//' | sed 's/\.sql$//')

    run_sql -c "INSERT INTO qivr.schema_migrations (version, name, checksum) VALUES ('$version', '$name', 'manual-mark') ON CONFLICT (version) DO NOTHING"
    echo -e "${GREEN}Marked $version as applied${NC}"
}

case "${1:-status}" in
    init)
        init_tracking
        ;;
    up)
        migrate_up "${2:-all}"
        ;;
    status)
        status
        ;;
    new)
        if [ -z "${2:-}" ]; then
            echo "Usage: ./migrate.sh new <migration_name>"
            exit 1
        fi
        new_migration "$2"
        ;;
    mark)
        if [ -z "${2:-}" ]; then
            echo "Usage: ./migrate.sh mark <version>"
            exit 1
        fi
        mark_applied "$2"
        ;;
    *)
        echo "Qivr SQL Migration Runner"
        echo ""
        echo "Usage: ./migrate.sh <command> [args]"
        echo ""
        echo "Commands:"
        echo "  init              Initialize migration tracking table"
        echo "  status            Show migration status"
        echo "  up [count]        Apply pending migrations (default: all)"
        echo "  new <name>        Create a new migration file"
        echo "  mark <version>    Mark a migration as applied without running it"
        echo ""
        echo "Environment variables:"
        echo "  DB_HOST           Database host"
        echo "  DB_PORT           Database port (default: 5432)"
        echo "  DB_NAME           Database name (default: qivr)"
        echo "  DB_USER           Database user"
        echo "  DB_PASSWORD       Database password (required)"
        ;;
esac
