#!/bin/bash
set -e

echo "🗑️  FRESH DATABASE START"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  WARNING: This will DELETE ALL DATA in the database!"
echo ""
read -p "Are you sure? Type 'yes' to continue: " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Aborted"
    exit 1
fi

echo ""
echo "📋 Step 1: Get database credentials from AWS Secrets Manager..."
DB_SECRET=$(aws secretsmanager get-secret-value \
    --secret-id qivr/production/database \
    --region ap-southeast-2 \
    --query SecretString \
    --output text)

DB_HOST=$(echo $DB_SECRET | jq -r '.host')
DB_PORT=$(echo $DB_SECRET | jq -r '.port')
DB_NAME=$(echo $DB_SECRET | jq -r '.database')
DB_USER=$(echo $DB_SECRET | jq -r '.username')
DB_PASS=$(echo $DB_SECRET | jq -r '.password')

echo "✅ Connected to: $DB_HOST:$DB_PORT/$DB_NAME"
echo ""

echo "📋 Step 2: Drop all tables..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/reset-database.sql

echo "✅ All tables dropped"
echo ""

echo "📋 Step 3: Delete old migrations..."
rm -rf backend/Qivr.Api/Migrations/*
echo "✅ Old migrations deleted"
echo ""

echo "📋 Step 4: Create fresh migration..."
cd backend/Qivr.Api
dotnet ef migrations add InitialCleanMigration
echo "✅ Fresh migration created"
echo ""

echo "📋 Step 5: Apply migration to database..."
dotnet ef database update
echo "✅ Migration applied"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 FRESH START COMPLETE!"
echo ""
echo "✅ Database reset"
echo "✅ Clean migration history"
echo "✅ Schema matches current models"
echo "✅ Ready for development"
echo ""
echo "Next: Run E2E tests to verify everything works!"
echo "  node scripts/tests/test-live-system.mjs"
