#!/bin/bash
set -e

echo "=== CLEANING UP PROJECT STRUCTURE ==="

# Create archive directory for old files
mkdir -p archive/2025-11-10-cleanup

# Move obsolete task definitions (keep only template)
echo "1. Archiving old task definitions..."
mv task-definition-arm64.json archive/2025-11-10-cleanup/ 2>/dev/null || true
mv task-definition-fix.json archive/2025-11-10-cleanup/ 2>/dev/null || true
mv task-definition-opentelemetry-fix.json archive/2025-11-10-cleanup/ 2>/dev/null || true
mv task-definition-x86.json archive/2025-11-10-cleanup/ 2>/dev/null || true

# Move test scripts to scripts/
echo "2. Moving test scripts..."
mv test-*.js scripts/ 2>/dev/null || true
mv test-*.sh scripts/ 2>/dev/null || true
mv test-*.html scripts/ 2>/dev/null || true

# Move SQL scripts to database/
echo "3. Moving SQL scripts..."
mv *.sql database/ 2>/dev/null || true

# Move deployment scripts to scripts/
echo "4. Organizing deployment scripts..."
mv deploy*.sh scripts/ 2>/dev/null || true
mv local-build.sh scripts/ 2>/dev/null || true

# Move Lambda functions to infrastructure/
echo "5. Moving Lambda functions..."
mv lambda-*.js infrastructure/ 2>/dev/null || true
mv enhanced-auto-create.cs infrastructure/ 2>/dev/null || true

# Move AWS configs to aws/
echo "6. Moving AWS configs..."
mv codebuild-policy.json aws/ 2>/dev/null || true
mv codepipeline-policy.json aws/ 2>/dev/null || true
mv fix-cors-task-def.json aws/ 2>/dev/null || true

# Consolidate docs
echo "7. Consolidating documentation..."
mv AWS-*.md docs/ 2>/dev/null || true
mv CICD-*.md docs/ 2>/dev/null || true
mv HTTPS-*.md docs/ 2>/dev/null || true
mv SYSTEM-*.md docs/ 2>/dev/null || true
mv DEPLOYMENT.md docs/ 2>/dev/null || true
mv OPERATIONS.md docs/ 2>/dev/null || true
mv TODO-FRESH.md docs/ 2>/dev/null || true

# Move audit/report files to docs/
echo "8. Moving audit reports..."
mv CONFIG-AUDIT-REPORT.md docs/ 2>/dev/null || true
mv MEDIUM-PRIORITY-FIXES.md docs/ 2>/dev/null || true

# Archive temporary files
echo "9. Archiving temporary files..."
mv api-staging.zip archive/2025-11-10-cleanup/ 2>/dev/null || true
mv docs-backup-*.tar.gz archive/2025-11-10-cleanup/ 2>/dev/null || true

# Move utility scripts
echo "10. Moving utility scripts..."
mv clear-*.js scripts/ 2>/dev/null || true
mv debug-*.js scripts/ 2>/dev/null || true
mv browser-*.js scripts/ 2>/dev/null || true
mv create-user.sh scripts/ 2>/dev/null || true

# Move analysis scripts
echo "11. Moving analysis scripts..."
mv analyze-structure.sh scripts/ 2>/dev/null || true
mv audit-config.sh scripts/ 2>/dev/null || true

# Move CloudFront config
echo "12. Moving CloudFront config..."
mv cloudfront-update.json infrastructure/ 2>/dev/null || true

echo ""
echo "=== CLEANUP COMPLETE ==="
echo ""
echo "Summary:"
echo "- Archived: archive/2025-11-10-cleanup/"
echo "- Scripts: scripts/"
echo "- SQL: database/"
echo "- Docs: docs/"
echo "- AWS configs: aws/"
echo "- Infrastructure: infrastructure/"
