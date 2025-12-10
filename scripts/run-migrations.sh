#!/bin/bash
# Database Migration Runner
# Runs all pending SQL migrations in order against the target database
#
# Usage:
#   ./scripts/run-migrations.sh [environment]
#
# Environments: local, staging, production
# Requires: psql, AWS CLI (for non-local)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$PROJECT_ROOT/database/migrations"
MIGRATIONS_TABLE="qivr.schema_migrations"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Get environment (default: local)
ENVIRONMENT="${1:-local}"

case "$ENVIRONMENT" in
  local)
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-qivr}"
    DB_USER="${DB_USER:-qivr_user}"
    DB_PASSWORD="${DB_PASSWORD:-dev_password}"
    ;;
  staging)
    # Fetch from AWS Secrets Manager
    log_info "Fetching staging database credentials from AWS Secrets Manager..."
    DB_HOST=$(aws secretsmanager get-secret-value --secret-id qivr/staging/db-host --query SecretString --output text)
    DB_PORT="5432"
    DB_NAME="qivr"
    DB_USER=$(aws secretsmanager get-secret-value --secret-id qivr/staging/db-user --query SecretString --output text)
    DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id qivr/staging/db-password --query SecretString --output text)
    ;;
  production)
    log_warn "Running migrations against PRODUCTION database!"
    read -p "Are you sure? (yes/no): " confirm
    if [[ "$confirm" != "yes" ]]; then
      log_info "Aborted."
      exit 0
    fi
    DB_HOST=$(aws secretsmanager get-secret-value --secret-id qivr/production/db-host --query SecretString --output text)
    DB_PORT="5432"
    DB_NAME="qivr"
    DB_USER=$(aws secretsmanager get-secret-value --secret-id qivr/production/db-user --query SecretString --output text)
    DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id qivr/production/db-password --query SecretString --output text)
    ;;
  *)
    log_error "Unknown environment: $ENVIRONMENT"
    log_info "Valid environments: local, staging, production"
    exit 1
    ;;
esac

export PGPASSWORD="$DB_PASSWORD"
PSQL_CMD="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -v ON_ERROR_STOP=1"

log_info "Connecting to $ENVIRONMENT database at $DB_HOST..."

# Create migrations tracking table if it doesn't exist
log_info "Ensuring migrations tracking table exists..."
$PSQL_CMD <<EOF
CREATE TABLE IF NOT EXISTS $MIGRATIONS_TABLE (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum VARCHAR(64)
);
EOF

# Get list of applied migrations
APPLIED_MIGRATIONS=$($PSQL_CMD -t -A -c "SELECT filename FROM $MIGRATIONS_TABLE ORDER BY filename;")

# Get list of migration files
MIGRATION_FILES=$(ls -1 "$MIGRATIONS_DIR"/*.sql 2>/dev/null | sort || true)

if [[ -z "$MIGRATION_FILES" ]]; then
  log_info "No migration files found in $MIGRATIONS_DIR"
  exit 0
fi

# Track counts
APPLIED_COUNT=0
SKIPPED_COUNT=0
FAILED_COUNT=0

log_info "Checking migrations..."
echo ""

for MIGRATION_FILE in $MIGRATION_FILES; do
  FILENAME=$(basename "$MIGRATION_FILE")
  CHECKSUM=$(sha256sum "$MIGRATION_FILE" | cut -d' ' -f1)

  # Check if already applied
  if echo "$APPLIED_MIGRATIONS" | grep -q "^${FILENAME}$"; then
    log_info "  ✓ $FILENAME (already applied)"
    ((SKIPPED_COUNT++))
    continue
  fi

  # Apply migration
  log_info "  → Applying: $FILENAME"

  if $PSQL_CMD -f "$MIGRATION_FILE"; then
    # Record successful migration
    $PSQL_CMD -c "INSERT INTO $MIGRATIONS_TABLE (filename, checksum) VALUES ('$FILENAME', '$CHECKSUM');"
    log_info "    ✓ Applied successfully"
    ((APPLIED_COUNT++))
  else
    log_error "    ✗ Failed to apply migration: $FILENAME"
    ((FAILED_COUNT++))
    exit 1
  fi
done

echo ""
log_info "Migration Summary:"
log_info "  Applied: $APPLIED_COUNT"
log_info "  Skipped: $SKIPPED_COUNT"
log_info "  Failed:  $FAILED_COUNT"

if [[ $FAILED_COUNT -gt 0 ]]; then
  exit 1
fi

log_info "All migrations completed successfully!"
