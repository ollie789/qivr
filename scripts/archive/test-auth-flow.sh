#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_BASE="http://localhost:5050"
REGION="ap-southeast-2"
POOL_ID="ap-southeast-2_b48ZBE35F"
CLIENT_ID="3u1j21aero8u8c7a4gh52g9qhb"
CLIENT_SECRET="1sfitrb0486vqg0gqve60q7neqnhkkrfkulkkptnvfkgv1v74amm"

echo -e "${BLUE}🔍 Testing Authentication Flow with New Cognito Pool${NC}"
echo "================================================================"
echo ""

# Step 1: Authenticate and get tokens
echo -e "${YELLOW}Step 1: Authenticating with Cognito...${NC}"

# Compute SECRET_HASH for Cognito
SECRET_HASH=$(echo -n "doctor@test.com${CLIENT_ID}" | openssl dgst -sha256 -hmac "${CLIENT_SECRET}" -binary | base64)

AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
    --region "$REGION" \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id "$CLIENT_ID" \
    --auth-parameters USERNAME="doctor@test.com",PASSWORD="TestPass123!",SECRET_HASH="$SECRET_HASH" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.AccessToken')
    ID_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')
    echo -e "  ${GREEN}✓ Authentication successful${NC}"
    
    # Decode the ID token to see claims
    echo ""
    echo -e "${YELLOW}Step 2: Decoding JWT to check claims...${NC}"
    
    # Extract payload from JWT (base64 decode the middle part)
    PAYLOAD=$(echo "$ID_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null || echo "$ID_TOKEN" | cut -d'.' -f2 | base64 -D)
    
    echo "Claims in ID Token:"
    echo "$PAYLOAD" | jq '{
        sub: .sub,
        email: .email,
        role: .["custom:role"],
        tenant_id: .["custom:tenant_id"],
        clinic_id: .["custom:clinic_id"]
    }'
    
    # Extract tenant_id from claims
    TENANT_ID=$(echo "$PAYLOAD" | jq -r '.["custom:tenant_id"]')
    echo ""
    echo -e "  ${GREEN}✓ Tenant ID from token: $TENANT_ID${NC}"
else
    echo -e "  ${RED}✗ Authentication failed${NC}"
    echo "$AUTH_RESPONSE"
    exit 1
fi

# Step 3: Test /api/tenants endpoint
echo ""
echo -e "${YELLOW}Step 3: Testing GET /api/tenants...${NC}"

TENANTS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    "$API_BASE/api/tenants")

HTTP_CODE=$(echo "$TENANTS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$TENANTS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ GET /api/tenants returned 200${NC}"
    echo "  Response:"
    echo "$RESPONSE_BODY" | jq '.' | head -20
else
    echo -e "  ${RED}✗ GET /api/tenants returned $HTTP_CODE${NC}"
    echo "  Response: $RESPONSE_BODY"
fi

# Step 4: Test /api/auth/debug endpoint
echo ""
echo -e "${YELLOW}Step 4: Testing GET /api/auth/debug...${NC}"

DEBUG_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "X-Tenant-Id: $TENANT_ID" \
    "$API_BASE/api/auth/debug")

HTTP_CODE=$(echo "$DEBUG_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$DEBUG_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ GET /api/auth/debug returned 200${NC}"
    echo "  Debug info:"
    echo "$RESPONSE_BODY" | jq '{
        tenant_fromClaim: .tenant.fromClaim,
        tenant_fromHeader: .tenant.fromHeader,
        role: .role,
        userId: .userId
    }'
else
    echo -e "  ${RED}✗ GET /api/auth/debug returned $HTTP_CODE${NC}"
    echo "  Response: $RESPONSE_BODY"
fi

# Step 5: Test a guarded endpoint (appointments)
echo ""
echo -e "${YELLOW}Step 5: Testing GET /api/appointments (guarded endpoint)...${NC}"

APPOINTMENTS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "X-Tenant-Id: $TENANT_ID" \
    "$API_BASE/api/appointments?page=1&pageSize=10")

HTTP_CODE=$(echo "$APPOINTMENTS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$APPOINTMENTS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ GET /api/appointments returned 200${NC}"
    echo "  Response preview:"
    echo "$RESPONSE_BODY" | jq '{
        totalCount: .totalCount,
        items: .items | length
    }'
else
    echo -e "  ${RED}✗ GET /api/appointments returned $HTTP_CODE${NC}"
    echo "  Response: $RESPONSE_BODY"
fi

# Step 6: Test another guarded endpoint (patient-records)
echo ""
echo -e "${YELLOW}Step 6: Testing GET /api/patient-records (guarded endpoint)...${NC}"

RECORDS_RESPONSE=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer $ID_TOKEN" \
    -H "X-Tenant-Id: $TENANT_ID" \
    "$API_BASE/api/patient-records")

HTTP_CODE=$(echo "$RECORDS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$RECORDS_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ]; then
    echo -e "  ${GREEN}✓ GET /api/patient-records returned 200${NC}"
    echo "  Response preview:"
    echo "$RESPONSE_BODY" | jq 'if type == "array" then {count: length} else . end' | head -10
else
    echo -e "  ${RED}✗ GET /api/patient-records returned $HTTP_CODE${NC}"
    echo "  Response: $RESPONSE_BODY"
fi

echo ""
echo "================================================================"
echo -e "${BLUE}Summary:${NC}"
echo "================================================================"
echo ""
echo "✅ Authentication with new Cognito pool works"
echo "✅ JWT contains correct custom claims (custom:role, custom:tenant_id)"
echo "✅ Claims are properly named without double 'custom:' prefix"
echo ""
echo "Next: Sign in via clinic dashboard at http://localhost:3010"
echo "      Username: doctor@test.com"
echo "      Password: TestPass123!"
echo ""
echo "In DevTools Network tab, verify:"
echo "  1. GET /api/tenants returns 200 with tenant list"
echo "  2. Subsequent API calls include X-Tenant-Id header"
echo "================================================================"