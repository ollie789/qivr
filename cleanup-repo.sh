#!/bin/bash

# GitHub Repo Cleanup Script
# Organizes files into proper directories

echo "🧹 Cleaning up GitHub repository..."

# Create archive directory if it doesn't exist
mkdir -p archive

# Move old scripts to archive
echo "📦 Archiving old scripts..."
[ -f "audit-existing-features.sh" ] && mv audit-existing-features.sh archive/
[ -f "cleanup-project.sh" ] && mv cleanup-project.sh archive/
[ -f "install.sh" ] && mv install.sh archive/
[ -f "start-all.sh" ] && mv start-all.sh archive/
[ -f "stop-all.sh" ] && mv stop-all.sh archive/
[ -f "status.sh" ] && mv status.sh archive/

# Move config files to root (keep them)
echo "📋 Organizing config files..."
# These stay in root: .env, .env.example, .gitignore, package.json, etc.

# Move SQL files to database directory
echo "🗄️  Moving SQL files..."
[ -f "check-tenant-pools.sql" ] && mv check-tenant-pools.sql database/

# Move Docker files to infrastructure
echo "🐳 Organizing Docker files..."
[ -f "docker-compose.test.yml" ] && mv docker-compose.test.yml infrastructure/
[ -f "docker-compose.yml" ] && mv docker-compose.yml infrastructure/

# Move AWS files
echo "☁️  Organizing AWS files..."
[ -f "task-definition-template.json" ] && mv task-definition-template.json aws/
[ -f "buildspec.yml" ] && mv buildspec.yml aws/

# Move documentation
echo "📚 Organizing documentation..."
[ -f "AWS_RESOURCES_STATUS.md" ] && mv AWS_RESOURCES_STATUS.md docs/
[ -f "CHANGELOG-TESTS.md" ] && mv CHANGELOG-TESTS.md docs/
[ -f "DOCS-CLEANUP-SUMMARY.md" ] && mv DOCS-CLEANUP-SUMMARY.md docs/
[ -f "DOCS-INDEX.md" ] && mv DOCS-INDEX.md docs/
[ -f "QUICK-REFERENCE.md" ] && mv QUICK-REFERENCE.md docs/
[ -f "TEST-QUICK-REF.md" ] && mv TEST-QUICK-REF.md docs/

# Clean up empty directories
echo "🗑️  Removing empty directories..."
[ -d "logs" ] && [ -z "$(ls -A logs)" ] && rmdir logs
[ -d ".pids" ] && [ -z "$(ls -A .pids)" ] && rmdir .pids

# Remove .DS_Store files
echo "🍎 Removing .DS_Store files..."
find . -name ".DS_Store" -delete

echo "✅ Cleanup complete!"
echo ""
echo "📁 Repository structure:"
echo "  ├── apps/              (Frontend apps)"
echo "  ├── backend/           (Backend API)"
echo "  ├── docs/              (Documentation)"
echo "  ├── scripts/           (Utility scripts)"
echo "  ├── database/          (SQL files)"
echo "  ├── aws/               (AWS configs)"
echo "  ├── infrastructure/    (Docker, Terraform)"
echo "  ├── archive/           (Old scripts)"
echo "  └── [config files]     (Root configs)"

