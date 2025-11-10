#!/bin/bash

# Audit Controllers for Entity Property Mismatches
# Finds cases where controllers query properties that don't exist on entities

echo "🔍 Scanning for Controller/Entity Property Mismatches"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BACKEND_DIR="/Users/oliver/Projects/qivr/backend"
ISSUES_FOUND=0

# Common mismatches to check
declare -A ENTITY_MAPPINGS=(
    ["Message.RecipientId"]="Message.DirectRecipientId"
    ["User.Roles"]="User.Role"
    ["Tenant.CognitoUserPoolId"]="(ignored in DbContext)"
    ["Tenant.CognitoUserPoolClientId"]="(ignored in DbContext)"
)

echo "📋 Known Entity Property Mappings:"
for key in "${!ENTITY_MAPPINGS[@]}"; do
    echo "  ❌ $key → ✅ ${ENTITY_MAPPINGS[$key]}"
done
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔎 Checking Controllers..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for Message.RecipientId usage
echo "🔍 Checking Message.RecipientId usage..."
RECIPIENT_MATCHES=$(grep -r "\.RecipientId" "$BACKEND_DIR/Qivr.Api/Controllers" 2>/dev/null | grep -v "DirectRecipientId" | wc -l | tr -d ' ')
if [ "$RECIPIENT_MATCHES" -gt 0 ]; then
    echo "  ❌ Found $RECIPIENT_MATCHES uses of .RecipientId (should be .DirectRecipientId)"
    grep -n "\.RecipientId" "$BACKEND_DIR/Qivr.Api/Controllers"/*.cs 2>/dev/null | grep -v "DirectRecipientId" | head -5
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "  ✅ No .RecipientId mismatches found"
fi
echo ""

# Check for User.Roles usage (should be User.Role)
echo "🔍 Checking User.Roles usage..."
ROLES_MATCHES=$(grep -r "\.Roles" "$BACKEND_DIR/Qivr.Api/Controllers" 2>/dev/null | grep -v "// " | wc -l | tr -d ' ')
if [ "$ROLES_MATCHES" -gt 0 ]; then
    echo "  ⚠️  Found $ROLES_MATCHES uses of .Roles (check if should be .Role)"
    grep -n "\.Roles" "$BACKEND_DIR/Qivr.Api/Controllers"/*.cs 2>/dev/null | grep -v "// " | head -5
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "  ✅ No .Roles usage found"
fi
echo ""

# Check for Tenant property usage that's ignored in DbContext
echo "🔍 Checking Tenant.CognitoUserPoolId usage..."
TENANT_MATCHES=$(grep -r "\.CognitoUserPoolId\|\.CognitoUserPoolClientId" "$BACKEND_DIR/Qivr.Api/Controllers" 2>/dev/null | wc -l | tr -d ' ')
if [ "$TENANT_MATCHES" -gt 0 ]; then
    echo "  ⚠️  Found $TENANT_MATCHES uses of ignored Tenant properties"
    grep -n "\.CognitoUserPoolId\|\.CognitoUserPoolClientId" "$BACKEND_DIR/Qivr.Api/Controllers"/*.cs 2>/dev/null | head -5
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo "  ✅ No ignored Tenant property usage found"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo "✅ No controller/entity mismatches found!"
else
    echo "⚠️  Found $ISSUES_FOUND potential issues"
    echo ""
    echo "💡 Run this before each deployment to catch naming mismatches"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
