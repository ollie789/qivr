#!/bin/bash

# Entity Model vs Migration Schema Audit
# Compares what entities expect vs what migration creates

echo "🔍 Entity Model Schema Audit"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

BACKEND_DIR="backend"

echo "📋 Checking Entity Models vs DbContext Configuration"
echo ""

# Check Tenant entity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏢 TENANT Entity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Properties in Tenant.cs:"
grep "public.*{.*get.*set" $BACKEND_DIR/Qivr.Core/Entities/Tenant.cs | sed 's/^/  /'
echo ""

echo "Ignored in DbContext:"
grep -A 20 "modelBuilder.Entity<Tenant>" $BACKEND_DIR/Qivr.Infrastructure/Data/QivrDbContext.cs | grep "Ignore" | sed 's/^/  /'
echo ""

echo "Columns in Migration:"
grep -A 15 "name: \"tenants\"" $BACKEND_DIR/Qivr.Infrastructure/Migrations/20251108070500_InitialSaaSDatabase.cs | grep "table.Column" | sed 's/.*Column<\(.*\)>.*name: "\(.*\)".*/  \2 (\1)/'
echo ""

# Check User entity
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "👤 USER Entity"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Properties in User.cs:"
grep "public.*{.*get.*set" $BACKEND_DIR/Qivr.Core/Entities/User.cs | sed 's/^/  /'
echo ""

echo "Ignored in DbContext:"
grep -A 30 "modelBuilder.Entity<User>" $BACKEND_DIR/Qivr.Infrastructure/Data/QivrDbContext.cs | grep "Ignore" | sed 's/^/  /'
echo ""

echo "Mapped in DbContext:"
grep -A 30 "modelBuilder.Entity<User>" $BACKEND_DIR/Qivr.Infrastructure/Data/QivrDbContext.cs | grep "HasConversion\|HasColumnName" | sed 's/^/  /'
echo ""

echo "Columns in Migration:"
grep -A 20 "name: \"users\"" $BACKEND_DIR/Qivr.Infrastructure/Migrations/20251108070500_InitialSaaSDatabase.cs | grep "table.Column" | sed 's/.*Column<\(.*\)>.*name: "\(.*\)".*/  \2 (\1)/'
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Potential Mismatches"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check for properties that should be ignored
echo "⚠️  Properties in entities that might need .Ignore():"
echo ""

# Tenant properties not in migration
echo "Tenant entity properties NOT in migration:"
TENANT_PROPS=$(grep "public.*{.*get.*set" $BACKEND_DIR/Qivr.Core/Entities/Tenant.cs | awk '{print $3}' | tr -d '?')
MIGRATION_COLS=$(grep -A 15 "name: \"tenants\"" $BACKEND_DIR/Qivr.Infrastructure/Migrations/20251108070500_InitialSaaSDatabase.cs | grep "table.Column" | sed 's/.*name: "\(.*\)".*/\1/')

for prop in $TENANT_PROPS; do
    prop_snake=$(echo $prop | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//')
    if ! echo "$MIGRATION_COLS" | grep -qi "$prop_snake"; then
        IGNORED=$(grep -A 20 "modelBuilder.Entity<Tenant>" $BACKEND_DIR/Qivr.Infrastructure/Data/QivrDbContext.cs | grep "Ignore.*$prop")
        if [ -z "$IGNORED" ]; then
            echo "  ❌ $prop (not in migration, not ignored)"
        else
            echo "  ✅ $prop (not in migration, but ignored)"
        fi
    fi
done

echo ""
echo "User entity properties NOT in migration:"
USER_PROPS=$(grep "public.*{.*get.*set" $BACKEND_DIR/Qivr.Core/Entities/User.cs | awk '{print $3}' | tr -d '?')
MIGRATION_COLS=$(grep -A 20 "name: \"users\"" $BACKEND_DIR/Qivr.Infrastructure/Migrations/20251108070500_InitialSaaSDatabase.cs | grep "table.Column" | sed 's/.*name: "\(.*\)".*/\1/')

for prop in $USER_PROPS; do
    prop_snake=$(echo $prop | sed 's/\([A-Z]\)/_\L\1/g' | sed 's/^_//')
    if ! echo "$MIGRATION_COLS" | grep -qi "$prop_snake"; then
        IGNORED=$(grep -A 30 "modelBuilder.Entity<User>" $BACKEND_DIR/Qivr.Infrastructure/Data/QivrDbContext.cs | grep "Ignore.*$prop")
        if [ -z "$IGNORED" ]; then
            echo "  ❌ $prop (not in migration, not ignored)"
        else
            echo "  ✅ $prop (not in migration, but ignored)"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Audit Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
