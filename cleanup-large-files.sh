#!/bin/bash

# Clean up large build artifacts and dependencies
# Run this to reduce project size by ~900MB

echo "🧹 Cleaning large files..."

# Backend build artifacts (217MB)
echo "Removing backend build artifacts..."
find backend -type d -name "bin" -o -name "obj" | xargs rm -rf

# Node modules (719MB) - can be restored with npm install
echo "Removing node_modules..."
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf sandbox/node_modules

# Frontend build outputs (small but unnecessary)
echo "Removing dist folders..."
rm -rf apps/*/dist

echo "✅ Cleaned ~900MB"
echo ""
echo "To restore:"
echo "  npm install                    # Root dependencies"
echo "  cd apps/clinic-dashboard && npm install"
echo "  cd apps/patient-portal && npm install"
echo "  dotnet build backend/Qivr.sln  # Backend"
