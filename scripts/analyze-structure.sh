#!/bin/bash
echo "=== PROJECT STRUCTURE ANALYSIS ==="
echo ""

echo "1. ROOT DIRECTORY FILES"
echo "----------------------"
ls -1 *.md *.json *.yml *.sh *.sql *.js *.cs 2>/dev/null | wc -l
echo "loose files in root"
echo ""

echo "2. DUPLICATE/OBSOLETE CONFIGS"
echo "-----------------------------"
echo "Task definitions:"
ls -1 task-definition*.json 2>/dev/null | wc -l
echo ""
echo "Test scripts:"
ls -1 test-*.js test-*.sh 2>/dev/null | wc -l
echo ""

echo "3. DOCUMENTATION FILES"
echo "---------------------"
ls -1 *.md 2>/dev/null
echo ""

echo "4. TEMPORARY/DEBUG FILES"
echo "-----------------------"
find . -maxdepth 1 -name "*.zip" -o -name "*.tar.gz" -o -name "*backup*" 2>/dev/null
echo ""

echo "5. PROPER STRUCTURE"
echo "------------------"
echo "apps/: $(ls -d apps/* 2>/dev/null | wc -l) items"
echo "backend/: $(ls -d backend/* 2>/dev/null | wc -l) items"
echo "frontend/: $(ls -d frontend/* 2>/dev/null | wc -l) items"
echo "infrastructure/: $(ls -d infrastructure/* 2>/dev/null | wc -l) items"
echo "docs/: $(ls -d docs/* 2>/dev/null | wc -l) items"
echo "scripts/: $(ls -d scripts/* 2>/dev/null | wc -l) items"
echo ""

echo "6. GIT STATUS"
echo "------------"
git status --short | head -20
