#!/bin/bash

echo "🔍 MIGRATION CONFLICTS AUDIT"
echo "=============================="

cd "$(dirname "$0")/.."

echo ""
echo "1. 🚫 CHECKING FOR OLD CLINIC REFERENCES..."
echo "--------------------------------------------"

# Check for Clinic entity references
echo "❌ Clinic entity references:"
find backend -name "*.cs" | xargs grep -n "class Clinic\|: Clinic\|<Clinic>" | head -5

echo ""
echo "❌ Clinic navigation properties:"
find backend -name "*.cs" | xargs grep -n "\.Clinic\|Clinic\." | grep -v "ClinicAdmin\|ClinicManagement" | head -10

echo ""
echo "❌ Old clinic table references:"
find backend -name "*.cs" | xargs grep -n "clinics" | grep -v "clinic-management" | head -5

echo ""
echo "2. 🔐 CHECKING AUTHORIZATION ROLES..."
echo "------------------------------------"

echo "❌ SystemAdmin references (should be removed):"
find backend -name "*.cs" | xargs grep -n "SystemAdmin" | head -5

echo ""
echo "❌ ClinicAdmin vs Admin conflicts:"
find backend -name "*.cs" | xargs grep -n "ClinicAdmin" | head -5

echo ""
echo "3. 📊 CHECKING DATABASE SCHEMA MISMATCHES..."
echo "--------------------------------------------"

echo "❌ UserType vs Role property mismatches:"
find backend -name "*.cs" | xargs grep -n "\.Role\|\.UserType" | head -10

echo ""
echo "❌ CognitoSub vs cognito_id mismatches:"
find backend -name "*.cs" | xargs grep -n "CognitoSub\|cognito_id" | head -5

echo ""
echo "4. 🏗️ CHECKING ENTITY RELATIONSHIPS..."
echo "--------------------------------------"

echo "❌ Foreign key references to clinics table:"
find backend -name "*.cs" | xargs grep -n "ClinicId\|clinic_id" | head -10

echo ""
echo "❌ Include statements for Clinic:"
find backend -name "*.cs" | xargs grep -n "Include.*Clinic" | head -5

echo ""
echo "5. 🧪 CHECKING TEST CONFLICTS..."
echo "-------------------------------"

echo "❌ Tests using old clinic endpoints:"
find scripts -name "*.mjs" | xargs grep -n "/clinics/" | head -5

echo ""
echo "❌ Tests with hardcoded tenant IDs:"
find scripts -name "*.mjs" | xargs grep -n "b6c55eef\|24ad9f22" | head -5

echo ""
echo "6. 📝 CHECKING MIGRATION STATE..."
echo "--------------------------------"

echo "✅ Current migration files:"
ls -la backend/Qivr.Infrastructure/Migrations/ | tail -3

echo ""
echo "✅ Archived migrations:"
ls -la database/old-migrations/ | wc -l

echo ""
echo "🎯 AUDIT COMPLETE!"
echo "=================="
echo ""
echo "🔧 TO FIX ISSUES:"
echo "- Remove any Clinic entity references"
echo "- Replace SystemAdmin with Admin"
echo "- Fix UserType/Role property mismatches"
echo "- Update foreign keys to use tenant_id"
echo "- Update tests to use proper endpoints"
