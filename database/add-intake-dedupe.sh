#!/bin/bash
set -e

echo "🔧 ADDING MISSING INTAKE_DEDUPE TABLE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

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

echo "📋 Step 2: Apply intake_dedupe table patch..."
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/patches/add-intake-dedupe-table.sql

echo "✅ intake_dedupe table added successfully"
echo ""
echo "🎉 PATCH COMPLETE!"
