#!/bin/bash

echo "==================================================================="
echo "Security Implementation Tests for Qivr"
echo "==================================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Database - Check if dedupe table would be created
echo -e "${YELLOW}TEST 1: Checking dedupe table migration file${NC}"
if [ -f "database/migrations/010_intake_idempotency_and_csp.sql" ]; then
    echo -e "${GREEN}✓ Migration file exists${NC}"
    echo "  Content:"
    cat database/migrations/010_intake_idempotency_and_csp.sql | sed 's/^/    /'
else
    echo -e "${RED}✗ Migration file not found${NC}"
fi
echo ""

# Test 2: Verify Worker uses transaction-local tenant scope
echo -e "${YELLOW}TEST 2: Checking Worker tenant scope configuration${NC}"
echo "Searching for set_config usage in IntakeProcessingWorker..."
grep_result=$(grep -n "set_config" backend/Qivr.Api/Workers/IntakeProcessingWorker.cs)
if echo "$grep_result" | grep -q "true"; then
    echo -e "${GREEN}✓ Worker uses transaction-local scope (third parameter is 'true')${NC}"
    echo "  Found at: $grep_result"
else
    echo -e "${RED}✗ Worker may not be using transaction-local scope${NC}"
fi
echo ""

# Additional check for all set_config usages
echo "All set_config usages in the codebase:"
grep -r "set_config" backend --include="*.cs" | while read -r line; do
    if echo "$line" | grep -q "true"; then
        echo -e "  ${GREEN}✓${NC} $line"
    else
        echo -e "  ${RED}✗${NC} $line"
    fi
done
echo ""

# Test 3: CSP Headers Configuration
echo -e "${YELLOW}TEST 3: Checking CSP frame-ancestors configuration${NC}"
echo "Checking SecurityHeadersMiddleware for frame-ancestors..."
if grep -q "frame-ancestors" backend/Qivr.Api/Middleware/SecurityHeadersMiddleware.cs; then
    echo -e "${GREEN}✓ frame-ancestors directive found${NC}"
    
    # Check if BrandingOptions is used
    if grep -q "BrandingOptions" backend/Qivr.Api/Middleware/SecurityHeadersMiddleware.cs; then
        echo -e "${GREEN}✓ BrandingOptions integration found${NC}"
        
        # Show the frame-ancestors logic
        echo "  Frame-ancestors logic:"
        grep -A2 -B2 "frameAncestors" backend/Qivr.Api/Middleware/SecurityHeadersMiddleware.cs | sed 's/^/    /'
    else
        echo -e "${RED}✗ BrandingOptions not integrated${NC}"
    fi
else
    echo -e "${RED}✗ frame-ancestors directive not found${NC}"
fi
echo ""

# Test 4: Verify BrandingOptions exists
echo -e "${YELLOW}TEST 4: Checking BrandingOptions configuration${NC}"
if [ -f "backend/Qivr.Api/Options/BrandingOptions.cs" ]; then
    echo -e "${GREEN}✓ BrandingOptions.cs exists${NC}"
    echo "  Content:"
    cat backend/Qivr.Api/Options/BrandingOptions.cs | sed 's/^/    /'
else
    echo -e "${RED}✗ BrandingOptions.cs not found${NC}"
fi
echo ""

# Test 5: Verify ProblemDetails configuration
echo -e "${YELLOW}TEST 5: Checking ProblemDetails configuration${NC}"
if grep -q "AddProblemDetails" backend/Qivr.Api/Program.cs && grep -q "UseExceptionHandler" backend/Qivr.Api/Program.cs; then
    echo -e "${GREEN}✓ ProblemDetails and ExceptionHandler configured${NC}"
    echo "  Services:"
    grep -n "AddProblemDetails" backend/Qivr.Api/Program.cs | sed 's/^/    /'
    echo "  Middleware:"
    grep -n "UseExceptionHandler" backend/Qivr.Api/Program.cs | sed 's/^/    /'
else
    echo -e "${RED}✗ ProblemDetails not fully configured${NC}"
fi
echo ""

# Test 6: Request ID correlation
echo -e "${YELLOW}TEST 6: Checking Request ID correlation${NC}"
echo "Checking IntakeController for X-Request-ID propagation..."
if grep -q "x-request-id" backend/Qivr.Api/Controllers/IntakeController.cs; then
    echo -e "${GREEN}✓ Request ID propagation to SQS found${NC}"
    grep -n "x-request-id" backend/Qivr.Api/Controllers/IntakeController.cs | sed 's/^/    /'
else
    echo -e "${RED}✗ Request ID not propagated to SQS${NC}"
fi

echo "Checking Worker for Request ID in logging scope..."
if grep -q "requestId" backend/Qivr.Api/Workers/IntakeProcessingWorker.cs; then
    echo -e "${GREEN}✓ Request ID used in logging scope${NC}"
    grep -n "requestId" backend/Qivr.Api/Workers/IntakeProcessingWorker.cs | head -2 | sed 's/^/    /'
else
    echo -e "${RED}✗ Request ID not in logging scope${NC}"
fi
echo ""

# Test 7: Idempotency implementation
echo -e "${YELLOW}TEST 7: Checking idempotency implementation${NC}"
echo "Checking Worker for dedupe logic..."
if grep -q "intake_dedupe" backend/Qivr.Api/Workers/IntakeProcessingWorker.cs; then
    echo -e "${GREEN}✓ Idempotency check implemented${NC}"
    grep -n "intake_dedupe" backend/Qivr.Api/Workers/IntakeProcessingWorker.cs | sed 's/^/    /'
    
    # Check for ON CONFLICT DO NOTHING
    if grep -q "ON CONFLICT DO NOTHING" backend/Qivr.Api/Workers/IntakeProcessingWorker.cs; then
        echo -e "${GREEN}✓ Using ON CONFLICT DO NOTHING for idempotency${NC}"
    fi
else
    echo -e "${RED}✗ Idempotency not implemented${NC}"
fi
echo ""

echo "==================================================================="
echo "Summary:"
echo "==================================================================="

# SQL script to test database after migration
cat > test-database.sql << 'EOF'
-- Run this against your database after applying migrations:

-- Test 1: Check dedupe table exists
SELECT 
    CASE 
        WHEN to_regclass('qivr.intake_dedupe') IS NOT NULL 
        THEN '✓ intake_dedupe table exists' 
        ELSE '✗ intake_dedupe table NOT found' 
    END as dedupe_table_check;

-- Test 2: Verify tenant context is transaction-local
-- This should be run within the application to test properly
-- Example test transaction:
BEGIN;
    SELECT set_config('app.tenant_id', 'test-tenant-123'::text, true) as set_result;
    SELECT current_setting('app.tenant_id', true) as tenant_in_transaction;
ROLLBACK;
-- After rollback, this should return empty/null:
SELECT current_setting('app.tenant_id', true) as tenant_after_rollback;

-- Test 3: Check if RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'qivr' 
ORDER BY tablename, policyname
LIMIT 5;
EOF

echo -e "${YELLOW}Database test script created: test-database.sql${NC}"
echo "Run it against your database to verify table creation and RLS policies."
echo ""

# Create a simple HTTP test for CSP headers
cat > test-csp-headers.sh << 'EOF'
#!/bin/bash
# Test CSP headers on the API

API_URL="${1:-http://localhost:5000}"
echo "Testing CSP headers on $API_URL"
echo ""

# Test widget endpoint
echo "Testing widget endpoint CSP:"
curl -s -I "$API_URL/api/widget/test" 2>/dev/null | grep -i "content-security-policy\|x-frame-options" || echo "No widget endpoint or no CSP headers"
echo ""

# Test regular API endpoint  
echo "Testing API endpoint CSP:"
curl -s -I "$API_URL/api/v1/health" 2>/dev/null | grep -i "content-security-policy\|x-frame-options" || echo "No API endpoint or no CSP headers"
echo ""

# Test with specific clinic header
echo "Testing with X-Clinic-Id header:"
curl -s -I -H "X-Clinic-Id: test-clinic-123" "$API_URL/api/v1/intake/submit" 2>/dev/null | grep -i "content-security-policy\|x-frame-options" || echo "No intake endpoint or no CSP headers"
EOF
chmod +x test-csp-headers.sh

echo -e "${YELLOW}HTTP test script created: test-csp-headers.sh${NC}"
echo "Run './test-csp-headers.sh [API_URL]' when the API is running."
echo ""

echo -e "${GREEN}All tests completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Apply the migration: psql -d qivr -f database/migrations/010_intake_idempotency_and_csp.sql"
echo "2. Run the database tests: psql -d qivr -f test-database.sql"
echo "3. Start the API and run: ./test-csp-headers.sh http://localhost:5000"
