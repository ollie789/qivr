#!/bin/bash
set -e

echo "🌱 Seeding clinic data..."

# Get DB credentials from ECS task definition secrets
DB_HOST="qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com"
DB_PORT="5432"
DB_NAME="qivr"
DB_USER="qivr_user"
DB_PASS="Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY="

echo "📊 Running seed-clinic-data.sql..."
PGPASSWORD="$DB_PASS" psql \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -f /Users/oliver/Projects/qivr/database/seeds/seed-clinic-data.sql

echo "✅ Clinic data seeded successfully!"
echo ""
echo "Clinic ID: b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
echo "Tenant ID: b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
echo "Test User: test.doctor@clinic.com"
