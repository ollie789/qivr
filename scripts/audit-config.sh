#!/bin/bash

echo "=== QIVR CONFIGURATION AUDIT ==="
echo "Date: $(date)"
echo ""

# Frontend API calls audit
echo "1. FRONTEND API CALLS AUDIT"
echo "----------------------------"
echo "Checking for API calls without /api prefix..."
grep -r "api\.get\|api\.post\|api\.put\|api\.delete\|api\.patch" ~/Projects/qivr/frontend/src --include="*.ts" --include="*.tsx" | grep -v "/api/" | grep -v "node_modules" | head -20
echo ""

# CloudFront routing check
echo "2. CLOUDFRONT ROUTING CONFIG"
echo "----------------------------"
if [ -f ~/Projects/qivr/infrastructure/cloudfront.tf ]; then
  echo "Checking CloudFront origin configurations..."
  grep -A 10 "origin {" ~/Projects/qivr/infrastructure/cloudfront.tf
else
  echo "CloudFront config not found in expected location"
fi
echo ""

# Backend CORS check
echo "3. BACKEND CORS CONFIGURATION"
echo "----------------------------"
if [ -f ~/Projects/qivr/backend/Program.cs ]; then
  echo "Checking CORS policy..."
  grep -A 15 "AddCors" ~/Projects/qivr/backend/Program.cs
else
  echo "Program.cs not found"
fi
echo ""

# Environment variables check
echo "4. ENVIRONMENT VARIABLES"
echo "----------------------------"
echo "Backend .env exists: $([ -f ~/Projects/qivr/backend/.env ] && echo 'YES' || echo 'NO')"
echo "Frontend .env exists: $([ -f ~/Projects/qivr/frontend/.env ] && echo 'YES' || echo 'NO')"
echo "Root .env exists: $([ -f ~/Projects/qivr/.env ] && echo 'YES' || echo 'NO')"
echo ""

# Docker build config
echo "5. DOCKER BUILD CONFIGURATION"
echo "----------------------------"
if [ -f ~/Projects/qivr/buildspec.yml ]; then
  echo "Checking buildspec.yml for syntax issues..."
  grep -n "docker buildx\|docker build" ~/Projects/qivr/buildspec.yml
else
  echo "buildspec.yml not found"
fi
echo ""

# Backend compilation issues
echo "6. BACKEND COMPILATION CHECK"
echo "----------------------------"
echo "Running dotnet build..."
cd ~/Projects/qivr/backend && dotnet build 2>&1 | grep -E "error|warning" | head -10
echo ""

# Database seeding issues
echo "7. DATABASE SEEDER AUDIT"
echo "----------------------------"
if [ -f ~/Projects/qivr/backend/Data/DataSeeder.cs ]; then
  echo "Checking for common issues in DataSeeder..."
  grep -n "IsActive\|TenantId = null\|Preferences" ~/Projects/qivr/backend/Data/DataSeeder.cs | head -10
else
  echo "DataSeeder.cs not found"
fi
echo ""

# Service registrations
echo "8. SERVICE REGISTRATION CHECK"
echo "----------------------------"
if [ -f ~/Projects/qivr/backend/Extensions/ServiceCollectionExtensions.cs ]; then
  echo "Checking for broken service registrations..."
  grep "AddScoped\|AddTransient\|AddSingleton" ~/Projects/qivr/backend/Extensions/ServiceCollectionExtensions.cs
else
  echo "ServiceCollectionExtensions.cs not found"
fi
echo ""

# ECS task definition
echo "9. ECS TASK DEFINITION"
echo "----------------------------"
echo "Latest task definition template:"
if [ -f ~/Projects/qivr/task-definition-template.json ]; then
  jq '.containerDefinitions[0].image' ~/Projects/qivr/task-definition-template.json 2>/dev/null || echo "Invalid JSON"
else
  echo "task-definition-template.json not found"
fi
echo ""

# Frontend build output
echo "10. FRONTEND BUILD CHECK"
echo "----------------------------"
echo "Frontend dist exists: $([ -d ~/Projects/qivr/frontend/dist ] && echo 'YES' || echo 'NO')"
if [ -f ~/Projects/qivr/frontend/dist/index.html ]; then
  echo "Checking API base URL in built files..."
  grep -o "https://[^\"]*" ~/Projects/qivr/frontend/dist/index.html | head -5
fi
echo ""

echo "=== AUDIT COMPLETE ==="
