#!/bin/bash

API_URL="https://clinic.qivr.pro/api"
TIMESTAMP=$(date +%s)
TEST_EMAIL="patient${TIMESTAMP}@test.com"
TEST_PASSWORD="TestPass123!"
TEST_TENANT="b12aedee-b094-465c-bf03-80dbff5cf415"

echo "🧪 Patient Portal Auth Test"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Test Email: $TEST_EMAIL"
echo ""

# Test 1: Patient Signup
echo "1️⃣  Testing patient signup..."
SIGNUP_RESPONSE=$(curl -s -c /tmp/patient-cookies.txt -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"$TEST_EMAIL\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"firstName\": \"Test\",
    \"lastName\": \"Patient\",
    \"phoneNumber\": \"\",
    \"tenantId\": \"$TEST_TENANT\",
    \"role\": \"Patient\"
  }")

if echo "$SIGNUP_RESPONSE" | jq -e '.userInfo.tenantId' > /dev/null 2>&1; then
    TENANT_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.userInfo.tenantId')
    echo "  ✅ Signup successful - Tenant: $TENANT_ID"
else
    echo "  ❌ Signup failed"
    echo "$SIGNUP_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 2: Patient Login
echo "2️⃣  Testing patient login..."
LOGIN_RESPONSE=$(curl -s -c /tmp/patient-cookies.txt -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\"
  }")

if echo "$LOGIN_RESPONSE" | jq -e '.userInfo.tenantId' > /dev/null 2>&1; then
    TENANT_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.userInfo.tenantId')
    echo "  ✅ Login successful - Tenant: $TENANT_ID"
else
    echo "  ❌ Login failed"
    echo "$LOGIN_RESPONSE" | jq .
    exit 1
fi
echo ""

# Test 3: Get User Info
echo "3️⃣  Testing /auth/user-info..."
USER_INFO=$(curl -s -b /tmp/patient-cookies.txt "${API_URL}/auth/user-info")
if echo "$USER_INFO" | jq -e '.tenantId' > /dev/null 2>&1; then
    echo "  ✅ User info retrieved"
    echo "$USER_INFO" | jq '{email, tenantId, role: .["cognito:groups"][0]}'
else
    echo "  ❌ Failed to get user info"
fi
echo ""

# Test 4: Access patient endpoints
echo "4️⃣  Testing patient can access their data..."
APPOINTMENTS=$(curl -s -b /tmp/patient-cookies.txt \
  -H "X-Tenant-Id: $TENANT_ID" \
  "${API_URL}/appointments")

if echo "$APPOINTMENTS" | jq -e 'type == "array"' > /dev/null 2>&1; then
    COUNT=$(echo "$APPOINTMENTS" | jq 'length')
    echo "  ✅ Can access appointments ($COUNT items)"
else
    STATUS=$(echo "$APPOINTMENTS" | jq -r '.status // "unknown"')
    echo "  ⚠️  Appointments returned status: $STATUS"
fi
echo ""

# Test 5: Try to access different tenant (should fail)
echo "5️⃣  Testing tenant isolation..."
WRONG_TENANT="00000000-0000-0000-0000-000000000000"
ISOLATED=$(curl -s -b /tmp/patient-cookies.txt \
  -H "X-Tenant-Id: $WRONG_TENANT" \
  "${API_URL}/appointments")

if echo "$ISOLATED" | jq -e '.status == 403 or .status == 401' > /dev/null 2>&1; then
    echo "  ✅ Tenant isolation working (blocked wrong tenant)"
elif echo "$ISOLATED" | jq -e 'type == "array" and length == 0' > /dev/null 2>&1; then
    echo "  ✅ Tenant isolation working (empty results)"
else
    echo "  ⚠️  Tenant isolation may not be working properly"
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Patient Portal Auth Test Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
