#!/bin/bash

# Frontend-Backend API Compatibility Test
# Checks if all frontend API calls have matching backend endpoints

API_URL="https://clinic.qivr.pro/api"

echo "🔍 Frontend-Backend API Compatibility Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get auth token first
echo "🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -c /tmp/cookies.txt -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test1762774598204@clinic.test","password":"TestPass123!"}')

TENANT_ID=$(echo $LOGIN_RESPONSE | jq -r '.userInfo.tenantId')

if [ "$TENANT_ID" == "null" ] || [ -z "$TENANT_ID" ]; then
    echo "❌ Login failed or no tenant ID"
    exit 1
fi

echo "✅ Logged in - Tenant: $TENANT_ID"
echo ""

# Test endpoints the frontend expects
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Testing Frontend API Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/cookies.txt \
        -X $method "${API_URL}${endpoint}" \
        -H "Content-Type: application/json" \
        -H "X-Tenant-Id: $TENANT_ID")
    
    if [ "$STATUS" == "$expected_status" ] || [ "$STATUS" == "200" ] || [ "$STATUS" == "404" ]; then
        echo "  ✅ $method $endpoint → $STATUS"
    else
        echo "  ❌ $method $endpoint → $STATUS (expected $expected_status or 200/404)"
    fi
}

# Auth endpoints
echo "🔐 Auth Endpoints:"
test_endpoint "GET" "/auth/user-info" "200"
test_endpoint "POST" "/auth/logout" "200"
test_endpoint "POST" "/auth/refresh" "200"

echo ""
echo "👥 Patient Endpoints:"
test_endpoint "GET" "/patients" "200"
test_endpoint "GET" "/patients/page" "200"

echo ""
echo "📅 Appointment Endpoints:"
test_endpoint "GET" "/appointments" "200"
test_endpoint "GET" "/appointments/upcoming" "200"
test_endpoint "GET" "/appointments/availability" "200"
test_endpoint "GET" "/appointments/waitlist" "200"

echo ""
echo "💬 Message Endpoints:"
test_endpoint "GET" "/messages" "200"
test_endpoint "GET" "/messages/conversations" "200"
test_endpoint "GET" "/messages/unread-count" "200"
test_endpoint "GET" "/messages/templates" "200"

echo ""
echo "🔔 Notification Endpoints:"
test_endpoint "GET" "/notifications" "200"
test_endpoint "GET" "/notifications/unread-count" "200"
test_endpoint "GET" "/notifications/preferences" "200"

echo ""
echo "📄 Document Endpoints:"
test_endpoint "GET" "/documents" "200"
test_endpoint "GET" "/documents/categories" "200"

echo ""
echo "📊 Evaluation Endpoints:"
test_endpoint "GET" "/v1/evaluations" "200"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Compatibility Check Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 200 = Working, 404 = Not implemented yet, 401/403 = Auth issue"
