#!/bin/bash
set -e

echo "🗑️  Rebuilding database from scratch..."

# Navigate to backend directory
cd "$(dirname "$0")/../backend/Qivr.Api"

echo "📦 Removing all existing migrations..."
rm -rf ../Qivr.Infrastructure/Migrations/*

echo "🔨 Creating fresh initial migration with IF NOT EXISTS..."
dotnet ef migrations add InitialCreate --project ../Qivr.Infrastructure --startup-project .

echo "✅ Fresh migration created!"

# Modify the migration to use IF NOT EXISTS
echo "🔧 Updating migration to handle existing tables..."
sed -i '' 's/CREATE TABLE /CREATE TABLE IF NOT EXISTS /g' ../Qivr.Infrastructure/Migrations/*_InitialCreate.cs
sed -i '' 's/CREATE INDEX /CREATE INDEX IF NOT EXISTS /g' ../Qivr.Infrastructure/Migrations/*_InitialCreate.cs
sed -i '' 's/CREATE UNIQUE INDEX /CREATE UNIQUE INDEX IF NOT EXISTS /g' ../Qivr.Infrastructure/Migrations/*_InitialCreate.cs

echo "🚀 Now deploying to production..."

# Deploy to production where ECS can connect to RDS
cd "$(dirname "$0")/.."
npm run deploy:backend

echo "✅ Database rebuilt and deployed successfully!"
