#!/bin/bash
echo "=== EXISTING FEATURES AUDIT ==="
echo ""

echo "1. FRONTEND PAGES/ROUTES"
echo "------------------------"
find ~/Projects/qivr/apps/clinic-dashboard/src/pages -name "*.tsx" -o -name "*.ts" 2>/dev/null | sed 's|.*/pages/||' | sort
echo ""

echo "2. FRONTEND COMPONENTS"
echo "---------------------"
find ~/Projects/qivr/apps/clinic-dashboard/src/components -type d -maxdepth 1 2>/dev/null | sed 's|.*/components/||' | grep -v "^$" | sort
echo ""

echo "3. BACKEND CONTROLLERS"
echo "---------------------"
find ~/Projects/qivr/backend -name "*Controller.cs" 2>/dev/null | xargs basename -s .cs | sort
echo ""

echo "4. BACKEND SERVICES"
echo "------------------"
find ~/Projects/qivr/backend/Qivr.Services -name "*Service.cs" 2>/dev/null | xargs basename -s .cs | grep -v "ServiceCollection" | sort
echo ""

echo "5. DATABASE ENTITIES"
echo "-------------------"
find ~/Projects/qivr/backend/Qivr.Core/Entities -name "*.cs" 2>/dev/null | xargs basename -s .cs | sort
echo ""

echo "6. API ENDPOINTS (from controllers)"
echo "-----------------------------------"
grep -r "^\[Http" ~/Projects/qivr/backend/Qivr.Api/Controllers --include="*.cs" | grep -oP '\[Http\w+.*?\]' | sort -u | head -30
echo ""

echo "7. FRONTEND FEATURES (from routes)"
echo "----------------------------------"
grep -r "path.*:" ~/Projects/qivr/apps/clinic-dashboard/src --include="*.tsx" --include="*.ts" | grep -oP "path:\s*['\"].*?['\"]" | sort -u | head -30
