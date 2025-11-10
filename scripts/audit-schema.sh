#!/bin/bash

# Database Schema Audit
# Compares EF Core entity models with actual PostgreSQL schema

set -e

REGION="ap-southeast-2"
SECRET_ID="qivr/production/database"

echo "🔍 Database Schema Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get database credentials
echo "📡 Fetching database credentials..."
DB_CREDS=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ID" --region $REGION --query SecretString --output text)
DB_HOST=$(echo $DB_CREDS | jq -r '.host')
DB_NAME=$(echo $DB_CREDS | jq -r '.database')
DB_USER=$(echo $DB_CREDS | jq -r '.username')
DB_PASS=$(echo $DB_CREDS | jq -r '.password')

echo "✅ Connected to: $DB_HOST"
echo ""

# Function to query database via ECS exec
query_db() {
    local query="$1"
    
    # Get running task
    TASK_ARN=$(aws ecs list-tasks \
        --cluster qivr_cluster \
        --service-name qivr-api \
        --region $REGION \
        --query 'taskArns[0]' \
        --output text)
    
    if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
        echo "❌ No running ECS tasks found"
        return 1
    fi
    
    TASK_ID=$(echo $TASK_ARN | cut -d'/' -f3)
    
    # Execute query via ECS exec
    aws ecs execute-command \
        --cluster qivr_cluster \
        --task $TASK_ID \
        --container qivr-api \
        --region $REGION \
        --interactive \
        --command "PGPASSWORD='$DB_PASS' psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c \"$query\""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Key Tables Schema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check tenants table
echo "🏢 TENANTS Table:"
echo "SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
ORDER BY ordinal_position;" | PGPASSWORD="$DB_PASS" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t

echo ""
echo "👤 USERS Table:"
echo "SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;" | PGPASSWORD="$DB_PASS" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Entity vs Database Comparison"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Expected columns from entity models
echo "Expected TENANT columns (from entity):"
echo "  - id, slug, name, settings"
echo "  - created_at, updated_at"
echo ""

echo "Expected USER columns (from entity):"
echo "  - id, cognito_id, email, phone"
echo "  - first_name, last_name, role, metadata"
echo "  - created_at, updated_at, tenant_id"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  Potential Issues"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for common mismatches
echo "Checking for missing columns..."
echo ""

# Check if cognito pool columns exist in tenants
COGNITO_COLS=$(echo "SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN ('cognito_user_pool_id', 'cognito_user_pool_client_id', 'cognito_user_pool_domain');" \
| PGPASSWORD="$DB_PASS" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t | tr -d ' ')

if [ "$COGNITO_COLS" -gt 0 ]; then
    echo "✅ Cognito columns exist in tenants table"
else
    echo "⚠️  Cognito columns NOT in tenants table (should be .Ignore() in DbContext)"
fi

# Check if users has role column
ROLE_COL=$(echo "SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'role';" \
| PGPASSWORD="$DB_PASS" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t | tr -d ' ')

if [ "$ROLE_COL" -eq 1 ]; then
    echo "✅ Users table has 'role' column"
else
    echo "❌ Users table missing 'role' column"
fi

# Check if users has metadata column
METADATA_COL=$(echo "SELECT COUNT(*) FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'metadata';" \
| PGPASSWORD="$DB_PASS" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t | tr -d ' ')

if [ "$METADATA_COL" -eq 1 ]; then
    echo "✅ Users table has 'metadata' column"
else
    echo "❌ Users table missing 'metadata' column"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 All Tables in Database"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;" | PGPASSWORD="$DB_PASS" psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Audit Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Next Steps:"
echo "   1. Review mismatches above"
echo "   2. Add .Ignore() for entity properties not in DB"
echo "   3. Create migration for missing DB columns"
echo "   4. Update entity models to match DB schema"
