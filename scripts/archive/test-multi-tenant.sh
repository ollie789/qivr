#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🏥 Qivr Multi-Tenant Testing Script"
echo "===================================="
echo ""

# Configuration
API_BASE_URL="http://localhost:5050"
CLINIC_DASHBOARD_URL="http://localhost:3010"
PATIENT_PORTAL_URL="http://localhost:3005"

# Check if backend is running
echo "1. Checking backend health..."
HEALTH_STATUS=$(curl -s "${API_BASE_URL}/health" | jq -r '.status' 2>/dev/null)

if [ "$HEALTH_STATUS" == "Healthy" ]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend is not running or unhealthy${NC}"
    echo "  Start it with: cd backend && dotnet run --project Qivr.Api --urls \"http://localhost:5050\""
    exit 1
fi

# Check database connection
echo ""
echo "2. Checking database for test user..."
PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql \
    -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    -U qivr_user -d qivr -t -c \
    "SELECT COUNT(*) FROM users WHERE email = 'doctor@test.com';" 2>/dev/null | tr -d ' '

USER_COUNT=$(PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql \
    -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    -U qivr_user -d qivr -t -c \
    "SELECT COUNT(*) FROM users WHERE email = 'doctor@test.com';" 2>/dev/null | tr -d ' ')

if [ "$USER_COUNT" == "1" ]; then
    echo -e "${GREEN}✓ Test user exists in database${NC}"
else
    echo -e "${RED}✗ Test user not found in database${NC}"
fi

# Get tenant information
echo ""
echo "3. Fetching tenant information from database..."
TENANT_INFO=$(PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql \
    -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    -U qivr_user -d qivr -t -c \
    "SELECT t.id, t.name FROM tenants t 
     JOIN users u ON u.tenant_id = t.id 
     WHERE u.email = 'doctor@test.com';" 2>/dev/null)

echo "   Tenant for test user:"
echo "   $TENANT_INFO"

# Check if frontend apps are running
echo ""
echo "4. Checking frontend applications..."

# Check clinic dashboard
curl -s -o /dev/null -w "%{http_code}" "$CLINIC_DASHBOARD_URL" | grep -q "200\|304"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Clinic Dashboard is running at $CLINIC_DASHBOARD_URL${NC}"
else
    echo -e "${YELLOW}⚠ Clinic Dashboard not accessible at $CLINIC_DASHBOARD_URL${NC}"
    echo "  Start it with: npm run clinic:dev"
fi

# Check patient portal
curl -s -o /dev/null -w "%{http_code}" "$PATIENT_PORTAL_URL" | grep -q "200\|304"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Patient Portal is running at $PATIENT_PORTAL_URL${NC}"
else
    echo -e "${YELLOW}⚠ Patient Portal not accessible at $PATIENT_PORTAL_URL${NC}"
    echo "  Start it with: npm run patient:dev"
fi

# Test the tenants endpoint (will require authentication)
echo ""
echo "5. Testing /api/tenants endpoint (requires authentication)..."
echo "   Note: This will return 401 without a valid JWT token"
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "${API_BASE_URL}/api/tenants")
if [ "$RESPONSE_CODE" == "401" ]; then
    echo -e "${GREEN}✓ Endpoint exists and requires authentication (401)${NC}"
else
    echo -e "${YELLOW}⚠ Unexpected response code: $RESPONSE_CODE${NC}"
fi

# Summary
echo ""
echo "===================================="
echo "Summary:"
echo ""
echo "To test the complete multi-tenant flow:"
echo ""
echo "1. Navigate to Clinic Dashboard: ${CLINIC_DASHBOARD_URL}"
echo "2. Login with: doctor@test.com / Test123!"
echo "3. Look for the tenant selector in the header"
echo "4. Open browser DevTools > Network tab"
echo "5. Switch tenants and observe X-Tenant-Id header changes"
echo ""
echo "Key files to verify:"
echo "• Backend: /backend/Qivr.Api/Controllers/TenantsController.cs"
echo "• Service: /backend/Qivr.Services/UserService.cs:90"
echo "• Frontend: /apps/clinic-dashboard/src/components/TenantSelector.tsx"
echo "• API Client: /apps/clinic-dashboard/src/lib/api-client.ts:39"
echo ""
echo "Active tenant is pulled from auth store and included in every API request!"