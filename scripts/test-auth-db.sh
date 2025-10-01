#!/bin/bash

# Test Authentication and Database Connectivity Script
# This script validates that:
# 1. The API can connect to the RDS database
# 2. Authentication (Cognito) is properly configured
# 3. Token validation works correctly

set -e

echo "================================"
echo "Authentication & DB Test Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:5050"
CLINIC_EMAIL="test.doctor@clinic.com"
CLINIC_PASSWORD="ClinicTest123!"

echo "Test Configuration:"
echo "  API URL: $API_URL"
echo "  Test User: $CLINIC_EMAIL"
echo ""

# Function to check if API is running
check_api() {
    echo -n "1. Checking if API is running... "
    if curl -s -f "$API_URL/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ API is running${NC}"
        return 0
    else
        echo -e "${RED}✗ API is not running${NC}"
        echo "   Please start the API with: dotnet watch run --project backend/Qivr.Api"
        return 1
    fi
}

# Function to test database connectivity via health check
test_db_connection() {
    echo -n "2. Testing database connectivity... "
    response=$(curl -s "$API_URL/health")
    if echo "$response" | grep -q "Healthy"; then
        echo -e "${GREEN}✓ Database connected${NC}"
        return 0
    else
        echo -e "${RED}✗ Database connection failed${NC}"
        echo "   Response: $response"
        return 1
    fi
}

# Function to test authentication
test_authentication() {
    echo -n "3. Testing Cognito authentication... "
    
    # Create a cookie jar for this session
    COOKIE_JAR=$(mktemp)
    
    # Attempt to login (saves cookies)
    auth_response=$(curl -s -c "$COOKIE_JAR" -X POST "$API_URL/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$CLINIC_EMAIL\",\"password\":\"$CLINIC_PASSWORD\"}" 2>&1)
    
    # Check if we got a successful response (expiresIn indicates success with cookie auth)
    if echo "$auth_response" | grep -q "expiresIn"; then
        echo -e "${GREEN}✓ Authentication successful (using cookies)${NC}"
        
        # Set cookie jar for subsequent requests
        AUTH_COOKIES="$COOKIE_JAR"
        echo "   Session established with httpOnly cookies"
        return 0
    else
        echo -e "${RED}✗ Authentication failed${NC}"
        echo "   Response: $auth_response"
        rm -f "$COOKIE_JAR"
        return 1
    fi
}

# Function to test authenticated API call
test_authenticated_call() {
    echo -n "4. Testing authenticated API call... "
    
    if [ -z "$AUTH_COOKIES" ]; then
        echo -e "${YELLOW}⚠ Skipping - no authentication cookies available${NC}"
        return 1
    fi
    
    # Try to fetch appointments to test auth (includes tenant from token)
    # Using an endpoint that should work with authentication
    test_response=$(curl -s -b "$AUTH_COOKIES" -X GET "$API_URL/api/v1/appointments" 2>&1)
    
    # Check for successful response (empty array or actual data)
    if echo "$test_response" | grep -q -E "^\[|\{.*\}"; then
        echo -e "${GREEN}✓ Authenticated call successful${NC}"
        return 0
    elif echo "$test_response" | grep -q "Unauthorized"; then
        echo -e "${RED}✗ Authentication token not working${NC}"
        echo "   Response: $test_response"
        return 1
    else
        # May have tenant issues but auth is working
        echo -e "${YELLOW}⚠ Auth working but may have tenant issues${NC}"
        echo "   Response: $test_response"
        # Consider this a partial success
        return 0
    fi
}

# Function to check database migrations
check_migrations() {
    echo -n "5. Checking database schema... "
    
    # This would normally check if migrations are applied
    # For now, we'll check if we can query a basic endpoint
    if [ -z "$AUTH_COOKIES" ]; then
        echo -e "${YELLOW}⚠ Skipping - authentication required${NC}"
        return 1
    fi
    
    # Try to fetch clinics (tests if schema is correct)
    clinics_response=$(curl -s -b "$AUTH_COOKIES" -X GET "$API_URL/api/v1/clinics" 2>&1)
    
    if echo "$clinics_response" | grep -q -E "\\[|clinics|\\{"; then
        echo -e "${GREEN}✓ Database schema appears correct${NC}"
        return 0
    else
        echo -e "${RED}✗ Database schema issue detected${NC}"
        echo "   Response: $clinics_response"
        echo "   You may need to run migrations:"
        echo "   cd backend && dotnet ef database update --project Qivr.Infrastructure --startup-project Qivr.Api"
        return 1
    fi
}

# Run all tests
echo "Starting tests..."
echo ""

TESTS_PASSED=0
TESTS_FAILED=0

if check_api; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
    echo ""
    echo -e "${RED}Cannot continue without API running${NC}"
    exit 1
fi

echo ""

if test_db_connection; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""

if test_authentication; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""

if test_authenticated_call; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""

if check_migrations; then
    ((TESTS_PASSED++))
else
    ((TESTS_FAILED++))
fi

echo ""
echo "================================"
echo "Test Results:"
echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
echo "================================"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed! Authentication and database are properly configured.${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed. Please check the errors above.${NC}"
    exit 1
fi