#!/bin/bash

echo "🔍 QIVR Feature Verification"
echo "============================"
echo ""

API_URL="${API_URL:-http://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com}"
AUTH_TOKEN="${AUTH_TOKEN}"

if [ -z "$AUTH_TOKEN" ]; then
  echo "❌ Error: AUTH_TOKEN environment variable required"
  echo ""
  echo "Usage:"
  echo "  1. Log into clinic dashboard"
  echo "  2. Open browser dev tools → Network tab"
  echo "  3. Copy JWT token from Authorization header"
  echo "  4. Run: AUTH_TOKEN='Bearer <token>' ./infrastructure/verify-features.sh"
  exit 1
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Test API endpoint
test_endpoint() {
  local method=$1
  local path=$2
  local description=$3
  
  echo -n "Testing $description... "
  
  response=$(curl -s -w "\n%{http_code}" -X "$method" \
    -H "Authorization: $AUTH_TOKEN" \
    -H "Content-Type: application/json" \
    "$API_URL$path" 2>/dev/null)
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | sed '$d')
  
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "${GREEN}✅ $http_code${NC}"
    return 0
  elif [ "$http_code" = "401" ]; then
    echo -e "${RED}❌ 401 Unauthorized (check token)${NC}"
    return 1
  elif [ "$http_code" = "404" ]; then
    echo -e "${YELLOW}⚠️  404 Not Found (endpoint may not exist)${NC}"
    return 1
  else
    echo -e "${RED}❌ $http_code${NC}"
    return 1
  fi
}

echo "1. PROMs (Patient Reported Outcome Measures)"
echo "   ------------------------------------------"
test_endpoint "GET" "/api/v1/proms/templates" "Fetch PROM templates"
test_endpoint "GET" "/api/PromInstance" "Fetch PROM instances"
echo ""

echo "2. Documents"
echo "   ---------"
test_endpoint "GET" "/api/documents" "Fetch documents"
test_endpoint "GET" "/api/v1/documents" "Fetch documents (v1)"
echo ""

echo "3. Messages"
echo "   --------"
test_endpoint "GET" "/api/messages" "Fetch messages"
test_endpoint "GET" "/api/messages/unread/count" "Get unread count"
echo ""

echo "4. Appointments"
echo "   ------------"
test_endpoint "GET" "/api/appointments" "Fetch appointments"
echo ""

echo "5. Patients"
echo "   --------"
test_endpoint "GET" "/api/patients" "Fetch patients"
echo ""

echo ""
echo "======================================"
echo "Feature Status Summary"
echo "======================================"
echo ""

# Check if patient portal has messages page
if [ -f "/Users/oliver/Projects/qivr/apps/patient-portal/src/pages/Messages.tsx" ]; then
  echo -e "${GREEN}✅ Patient Portal: Messages page exists${NC}"
else
  echo -e "${YELLOW}⚠️  Patient Portal: Messages page missing${NC}"
fi

# Check if patient portal has messages API
if [ -f "/Users/oliver/Projects/qivr/apps/patient-portal/src/services/messagesApi.ts" ]; then
  echo -e "${GREEN}✅ Patient Portal: Messages API exists${NC}"
else
  echo -e "${YELLOW}⚠️  Patient Portal: Messages API missing${NC}"
fi

# Check if patient portal has PROMs
if [ -f "/Users/oliver/Projects/qivr/apps/patient-portal/src/services/promsApi.ts" ]; then
  echo -e "${GREEN}✅ Patient Portal: PROMs API exists${NC}"
else
  echo -e "${RED}❌ Patient Portal: PROMs API missing${NC}"
fi

# Check if patient portal has documents
if [ -f "/Users/oliver/Projects/qivr/apps/patient-portal/src/services/documentsApi.ts" ]; then
  echo -e "${GREEN}✅ Patient Portal: Documents API exists${NC}"
else
  echo -e "${RED}❌ Patient Portal: Documents API missing${NC}"
fi

# Check if patient portal has appointments
if [ -f "/Users/oliver/Projects/qivr/apps/patient-portal/src/services/appointmentsApi.ts" ]; then
  echo -e "${GREEN}✅ Patient Portal: Appointments API exists${NC}"
else
  echo -e "${RED}❌ Patient Portal: Appointments API missing${NC}"
fi

echo ""
echo "Next Steps:"
echo "  1. If any endpoints return 401, verify AUTH_TOKEN is valid"
echo "  2. If endpoints return 404, check backend routes"
echo "  3. Deploy patient portal with new Messages feature"
echo "  4. Test end-to-end flow in browser"
