#!/bin/bash

# Analytics Testing Script
# Tests calculations, API responses, and data accuracy

set -e

echo "🧪 Running Analytics Tests..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to run test
run_test() {
    local test_name=$1
    local command=$2
    
    echo -n "Testing: $test_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}"
        ((FAILED++))
    fi
}

echo "📦 1. Building Backend Tests..."
cd "$(dirname "$0")/../../backend"
dotnet build Qivr.Tests/Qivr.Tests.csproj --configuration Release > /dev/null 2>&1
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

echo "🧪 2. Running Unit Tests..."
dotnet test Qivr.Tests/Qivr.Tests.csproj \
    --filter "FullyQualifiedName~ClinicAnalyticsServiceTests" \
    --configuration Release \
    --logger "console;verbosity=minimal"
echo ""

echo "🧪 3. Running Integration Tests..."
dotnet test Qivr.Tests/Qivr.Tests.csproj \
    --filter "FullyQualifiedName~ClinicAnalyticsControllerTests" \
    --configuration Release \
    --logger "console;verbosity=minimal"
echo ""

echo "📊 4. Testing API Endpoints (if backend is running)..."
echo ""

# Check if backend is running
if curl -s http://localhost:5050/health > /dev/null 2>&1; then
    echo -e "${GREEN}Backend is running${NC}"
    
    # Get auth token (you'll need to provide credentials)
    if [ -z "$TEST_TOKEN" ]; then
        echo -e "${YELLOW}⚠ TEST_TOKEN not set. Skipping API tests.${NC}"
        echo "  Set TEST_TOKEN environment variable to test live API"
    else
        echo "Testing live API endpoints..."
        
        # Test dashboard metrics
        run_test "Dashboard Metrics" \
            "curl -s -H 'Authorization: Bearer $TEST_TOKEN' \
            'http://localhost:5050/api/clinic-analytics/dashboard' | jq -e '.todayAppointments >= 0'"
        
        # Test clinical analytics
        run_test "Clinical Analytics" \
            "curl -s -H 'Authorization: Bearer $TEST_TOKEN' \
            'http://localhost:5050/api/clinic-analytics/clinical?from=2025-10-25&to=2025-11-25' | jq -e '.averagePromScore >= 0'"
        
        # Test pain map analytics
        run_test "Pain Map Analytics" \
            "curl -s -H 'Authorization: Bearer $TEST_TOKEN' \
            'http://localhost:5050/api/clinic-analytics/pain-maps?from=2025-10-25&to=2025-11-25' | jq -e '.totalPainMaps >= 0'"
    fi
else
    echo -e "${YELLOW}⚠ Backend not running. Skipping API tests.${NC}"
    echo "  Start backend with: cd backend && dotnet run"
fi

echo ""
echo "═══════════════════════════════════════"
echo "📊 Test Summary"
echo "═══════════════════════════════════════"
echo -e "Passed: ${GREEN}$PASSED${NC}"
echo -e "Failed: ${RED}$FAILED${NC}"
echo "═══════════════════════════════════════"

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
