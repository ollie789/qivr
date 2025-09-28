#!/bin/bash

# Authentication Diagnostic Script for QIVR
# This helps identify common authentication issues

echo "🔍 QIVR Authentication Diagnostics"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API is running
echo -e "\n1. Checking if API is running..."
if curl -s http://localhost:5050/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is running on port 5050${NC}"
else
    echo -e "${RED}✗ API is not running on port 5050${NC}"
    echo "  Start it with: cd backend && dotnet run --project Qivr.Api"
fi

# Check Cognito configuration
echo -e "\n2. Checking AWS Cognito configuration..."
CONFIG_FILE="/Users/oliver/Projects/qivr/backend/Qivr.Api/appsettings.Development.json"

if [ -f "$CONFIG_FILE" ]; then
    PATIENT_POOL=$(grep -A3 "PatientPool" "$CONFIG_FILE" | grep "UserPoolId" | cut -d'"' -f4)
    CLINIC_POOL=$(grep -A3 "ClinicPool" "$CONFIG_FILE" | grep "UserPoolId" | cut -d'"' -f4)
    
    if [ ! -z "$PATIENT_POOL" ]; then
        echo -e "${GREEN}✓ Patient Pool ID: $PATIENT_POOL${NC}"
    else
        echo -e "${RED}✗ Patient Pool ID not found${NC}"
    fi
    
    if [ ! -z "$CLINIC_POOL" ]; then
        echo -e "${GREEN}✓ Clinic Pool ID: $CLINIC_POOL${NC}"
    else
        echo -e "${RED}✗ Clinic Pool ID not found${NC}"
    fi
else
    echo -e "${RED}✗ Configuration file not found${NC}"
fi

# Test Cognito pools existence
echo -e "\n3. Verifying Cognito User Pools exist in AWS..."
REGION="ap-southeast-2"

if command -v aws &> /dev/null; then
    # Check clinic pool
    if aws cognito-idp describe-user-pool --user-pool-id "$CLINIC_POOL" --region "$REGION" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Clinic User Pool exists and is accessible${NC}"
    else
        echo -e "${RED}✗ Clinic User Pool not accessible (check AWS credentials or pool ID)${NC}"
    fi
    
    # Check patient pool
    if aws cognito-idp describe-user-pool --user-pool-id "$PATIENT_POOL" --region "$REGION" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Patient User Pool exists and is accessible${NC}"
    else
        echo -e "${RED}✗ Patient User Pool not accessible (check AWS credentials or pool ID)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ AWS CLI not installed, skipping pool verification${NC}"
fi

# Check CORS configuration
echo -e "\n4. Testing CORS configuration..."
RESPONSE=$(curl -s -I -X OPTIONS http://localhost:5050/api/auth/login \
    -H "Origin: http://localhost:3001" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" 2>&1)

if echo "$RESPONSE" | grep -q "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ CORS is configured${NC}"
else
    echo -e "${RED}✗ CORS might not be properly configured${NC}"
    echo "  Check Program.cs CORS configuration"
fi

# Test login endpoint
echo -e "\n5. Testing login endpoint..."
TEST_RESPONSE=$(curl -s -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"test","password":"test"}' 2>&1)

if echo "$TEST_RESPONSE" | grep -q "unauthorized\|401"; then
    echo -e "${GREEN}✓ Login endpoint is responding (returns 401 as expected for invalid credentials)${NC}"
elif echo "$TEST_RESPONSE" | grep -q "error"; then
    echo -e "${RED}✗ Login endpoint returned an error${NC}"
    echo "  Response: $TEST_RESPONSE"
else
    echo -e "${YELLOW}⚠ Unexpected response from login endpoint${NC}"
    echo "  Response: $TEST_RESPONSE"
fi

# Check environment variables
echo -e "\n6. Checking environment variables..."
if [ ! -z "$COGNITO_USER_POOL_ID" ]; then
    echo -e "${GREEN}✓ COGNITO_USER_POOL_ID is set${NC}"
else
    echo -e "${YELLOW}⚠ COGNITO_USER_POOL_ID not set (using config file)${NC}"
fi

if [ ! -z "$COGNITO_CLIENT_ID" ]; then
    echo -e "${GREEN}✓ COGNITO_CLIENT_ID is set${NC}"
else
    echo -e "${YELLOW}⚠ COGNITO_CLIENT_ID not set (using config file)${NC}"
fi

# Test with known credentials
echo -e "\n7. Testing with demo credentials..."
echo -e "${YELLOW}Attempting login with clinic demo account...${NC}"

CLINIC_LOGIN=$(curl -s -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{
        "username": "clinic@qivr.health",
        "password": "Clinic123!",
        "userType": "clinic"
    }' 2>&1)

if echo "$CLINIC_LOGIN" | grep -q "token\|accessToken"; then
    echo -e "${GREEN}✓ Demo clinic login successful!${NC}"
    # Extract token if possible
    TOKEN=$(echo "$CLINIC_LOGIN" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    if [ ! -z "$TOKEN" ]; then
        echo -e "${GREEN}✓ Got access token${NC}"
        
        # Test authenticated endpoint
        echo -e "\n8. Testing authenticated endpoint with token..."
        AUTH_TEST=$(curl -s http://localhost:5050/api/proms/templates \
            -H "Authorization: Bearer $TOKEN" \
            -H "X-Clinic-Id: b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11" 2>&1)
        
        if echo "$AUTH_TEST" | grep -q "unauthorized\|401"; then
            echo -e "${RED}✗ Token was rejected${NC}"
        else
            echo -e "${GREEN}✓ Authenticated request successful${NC}"
        fi
    fi
else
    echo -e "${RED}✗ Demo login failed${NC}"
    echo "  Response: $CLINIC_LOGIN"
fi

echo -e "\n======================================"
echo -e "📊 Diagnosis Summary:"
echo -e "======================================"

echo -e "\nCommon fixes for authentication issues:"
echo "1. Ensure Cognito User Pools exist and are accessible"
echo "2. Verify AWS credentials are configured: aws configure"
echo "3. Check that frontend is sending tokens in Authorization header"
echo "4. Verify CORS is allowing your frontend origin"
echo "5. Check Program.cs JWT configuration matches Cognito settings"
echo ""
echo "To see detailed logs, run the API with:"
echo "  cd backend && ASPNETCORE_ENVIRONMENT=Development dotnet run --project Qivr.Api"