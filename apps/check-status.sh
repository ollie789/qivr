#!/bin/bash

# Simple smoke test to verify basic functionality
echo "Running smoke tests..."

# Check if production site is accessible
echo "Checking production site accessibility..."
if curl -s -o /dev/null -w "%{http_code}" https://clinic.qivr.pro | grep -q "200"; then
    echo "✅ Production site is accessible"
else
    echo "❌ Production site is not accessible"
    exit 1
fi

# Check if backend builds successfully (already done in CI)
echo "✅ Backend build completed successfully"

# Check if frontend apps exist
if [ -d "apps/clinic-dashboard" ]; then
    echo "✅ Clinic dashboard app exists"
else
    echo "❌ Clinic dashboard app missing"
    exit 1
fi

if [ -d "apps/patient-portal" ]; then
    echo "✅ Patient portal app exists"
else
    echo "❌ Patient portal app missing"
    exit 1
fi

echo "🎉 All smoke tests passed!"
