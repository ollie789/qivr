#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "       Verifying Qivr API Endpoints"
echo "=================================================="
echo ""

# Set headers
TENANT_ID="11111111-1111-1111-1111-111111111111"
CLINIC_ID="22222222-2222-2222-2222-222222222222"

# Test backend health
echo "Testing Backend API..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/api/health)
if [ "$RESPONSE" = "200" ] || [ "$RESPONSE" = "404" ]; then
    echo -e "${GREEN}✓${NC} Backend API is running on port 5050"
else
    echo -e "${RED}✗${NC} Backend API is not responding"
fi

echo ""
echo "Testing specific endpoints..."
echo "--------------------------------"

# Test clinic dashboard overview
echo -n "Clinic Dashboard Overview: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "X-Clinic-Id: $CLINIC_ID" \
    http://localhost:5050/api/clinic-dashboard/overview)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} (200 OK)"
elif [ "$RESPONSE" = "401" ]; then
    echo -e "${YELLOW}⚠${NC} (401 - Needs Authentication)"
else
    echo -e "${RED}✗${NC} ($RESPONSE)"
fi

# Test appointments endpoint
echo -n "Appointments API: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "X-Clinic-Id: $CLINIC_ID" \
    http://localhost:5050/api/Appointments)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} (200 OK)"
elif [ "$RESPONSE" = "401" ]; then
    echo -e "${YELLOW}⚠${NC} (401 - Needs Authentication)"
else
    echo -e "${RED}✗${NC} ($RESPONSE)"
fi

# Test notifications endpoint
echo -n "Notifications API: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "X-Clinic-Id: $CLINIC_ID" \
    http://localhost:5050/api/Notifications)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} (200 OK)"
elif [ "$RESPONSE" = "401" ]; then
    echo -e "${YELLOW}⚠${NC} (401 - Needs Authentication)"
else
    echo -e "${RED}✗${NC} ($RESPONSE)"
fi

# Test PROM templates (v1) endpoint
echo -n "PROM Templates (v1) API: "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "X-Tenant-Id: $TENANT_ID" \
    -H "X-Clinic-Id: $CLINIC_ID" \
    http://localhost:5050/api/v1/proms/templates)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} (200 OK)"
elif [ "$RESPONSE" = "401" ]; then
    echo -e "${YELLOW}⚠${NC} (401 - Needs Authentication)"
else
    echo -e "${RED}✗${NC} ($RESPONSE)"
fi

echo ""
echo "Testing Frontend Apps..."
echo "--------------------------------"

# Test Clinic Dashboard
echo -n "Clinic Dashboard (port 3001): "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Running"
else
    echo -e "${RED}✗${NC} Not responding"
fi

# Test Patient Portal
echo -n "Patient Portal (port 3000): "
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$RESPONSE" = "200" ]; then
    echo -e "${GREEN}✓${NC} Running"
else
    echo -e "${RED}✗${NC} Not responding"
fi

echo ""
echo "=================================================="
echo "          Configuration Summary"
echo "=================================================="
echo ""
echo "Clinic Dashboard .env:"
grep "VITE_API_URL" /Users/oliver/Projects/qivr/apps/clinic-dashboard/.env 2>/dev/null || echo "Not found"
echo ""
echo "Patient Portal .env:"
grep "VITE_API_URL" /Users/oliver/Projects/qivr/apps/patient-portal/.env 2>/dev/null || echo "Not found"
echo ""
echo "=================================================="
echo ""
echo "If you see 401 errors, that's normal - it means"
echo "the endpoints exist but require authentication."
echo "The important thing is they're not returning 404."
echo ""
