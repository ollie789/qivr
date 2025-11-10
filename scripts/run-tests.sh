#!/bin/bash

# Test Runner Script
# Runs all test suites for production (HTTPS)

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
EMAIL=${1:-}
PASSWORD=${2:-}

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║      QIVR CLINIC DASHBOARD TEST SUITE (HTTPS)              ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: Live System Test (creates new test clinic)
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Test 1: Live System Test (Full E2E)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

if node scripts/tests/test-live-system.mjs; then
    echo -e "${GREEN}✅ Live system test PASSED${NC}"
    LIVE_TEST_PASSED=true
else
    echo -e "${RED}❌ Live system test FAILED${NC}"
    LIVE_TEST_PASSED=false
fi

echo ""

# Test 2: API Endpoint Test (requires credentials)
if [ -n "$EMAIL" ] && [ -n "$PASSWORD" ]; then
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}Test 2: API Endpoint Test${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    if node scripts/tests/test-api-endpoints.mjs "$EMAIL" "$PASSWORD"; then
        echo -e "${GREEN}✅ API endpoint test PASSED${NC}"
        API_TEST_PASSED=true
    else
        echo -e "${RED}❌ API endpoint test FAILED${NC}"
        API_TEST_PASSED=false
    fi
    
    echo ""
else
    echo -e "${YELLOW}⏭️  Skipping API endpoint test (no credentials provided)${NC}"
    echo -e "${YELLOW}   Usage: ./run-tests.sh email@example.com Password123!${NC}"
    echo ""
    API_TEST_PASSED=true  # Don't fail if skipped
fi

# Test 3: Frontend Page Test (requires credentials and Playwright)
if [ -n "$EMAIL" ] && [ -n "$PASSWORD" ]; then
    if command -v npx &> /dev/null && npx playwright --version &> /dev/null 2>&1; then
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}Test 3: Frontend Page Test${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo ""
        
        if node scripts/tests/test-frontend-pages.mjs "$EMAIL" "$PASSWORD"; then
            echo -e "${GREEN}✅ Frontend page test PASSED${NC}"
            FRONTEND_TEST_PASSED=true
        else
            echo -e "${RED}❌ Frontend page test FAILED${NC}"
            FRONTEND_TEST_PASSED=false
        fi
        
        echo ""
    else
        echo -e "${YELLOW}⏭️  Skipping frontend page test (Playwright not installed)${NC}"
        echo -e "${YELLOW}   Install with: npm install -D playwright${NC}"
        echo ""
        FRONTEND_TEST_PASSED=true  # Don't fail if skipped
    fi
fi

# Summary
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      TEST SUMMARY                          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$LIVE_TEST_PASSED" = true ]; then
    echo -e "  ${GREEN}✅ Live System Test${NC}"
else
    echo -e "  ${RED}❌ Live System Test${NC}"
fi

if [ -n "$EMAIL" ] && [ -n "$PASSWORD" ]; then
    if [ "$API_TEST_PASSED" = true ]; then
        echo -e "  ${GREEN}✅ API Endpoint Test${NC}"
    else
        echo -e "  ${RED}❌ API Endpoint Test${NC}"
    fi
    
    if command -v npx &> /dev/null && npx playwright --version &> /dev/null 2>&1; then
        if [ "$FRONTEND_TEST_PASSED" = true ]; then
            echo -e "  ${GREEN}✅ Frontend Page Test${NC}"
        else
            echo -e "  ${RED}❌ Frontend Page Test${NC}"
        fi
    else
        echo -e "  ${YELLOW}⏭️  Frontend Page Test (skipped)${NC}"
    fi
else
    echo -e "  ${YELLOW}⏭️  API Endpoint Test (skipped)${NC}"
    echo -e "  ${YELLOW}⏭️  Frontend Page Test (skipped)${NC}"
fi

echo ""

# Exit with error if any test failed
if [ "$LIVE_TEST_PASSED" = true ] && [ "$API_TEST_PASSED" = true ] && [ "$FRONTEND_TEST_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}⚠️  Some tests failed. Review the output above.${NC}"
    exit 1
fi
