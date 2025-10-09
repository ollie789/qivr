#!/bin/bash

# Quick Build Script - Bypasses TypeScript errors for development
# This script builds both frontend apps without strict type checking

set -e

echo "🚀 Quick Build Starting (TypeScript checking disabled)..."

# Build Clinic Dashboard
echo "📦 Building Clinic Dashboard..."
cd apps/clinic-dashboard
npx vite build --mode production
echo "✅ Clinic Dashboard built successfully"

cd ../..

# Build Patient Portal
echo "📦 Building Patient Portal..."
cd apps/patient-portal
npx vite build --mode production
echo "✅ Patient Portal built successfully"

cd ../..

echo "✨ Build Complete!"
echo ""
echo "Build outputs:"
echo "  • Clinic Dashboard: apps/clinic-dashboard/dist/"
echo "  • Patient Portal: apps/patient-portal/dist/"
echo ""
echo "⚠️  Note: This build skipped TypeScript type checking."
echo "    Run 'npm run build' in each app for full type checking."