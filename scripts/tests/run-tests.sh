#!/bin/bash

echo "🧪 QIVR TEST RUNNER"
echo "=================="
echo ""
echo "Choose a test to run:"
echo ""
echo "1. 🎯 Comprehensive Full Test (recommended)"
echo "2. 🏗️  Create New Clinic"  
echo "3. 👤 Simple Patient Test"
echo "4. 🔍 CloudWatch Debug"
echo "5. 📊 Show Test Status"
echo ""
read -p "Enter choice (1-5): " choice

case $choice in
    1)
        echo "Running comprehensive test..."
        node scripts/tests/active/test-comprehensive-full.mjs
        ;;
    2)
        echo "Creating new clinic..."
        node scripts/tests/active/test-creation.mjs
        ;;
    3)
        echo "Testing patient creation..."
        node scripts/tests/active/test-patient-simple.mjs
        ;;
    4)
        echo "Running CloudWatch debug..."
        node scripts/tests/active/test-logs-debug.mjs
        ;;
    5)
        echo "📊 TEST STATUS:"
        echo "✅ Patient creation - Working"
        echo "✅ Admin auth - Working"
        echo "✅ CloudWatch debug - Working"
        echo "⚠️  Provider creation - Needs deployment"
        echo "⚠️  Appointments/Messages - Needs implementation"
        ;;
    *)
        echo "Invalid choice. Use 1-5."
        ;;
esac
