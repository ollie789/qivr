#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="ap-southeast-2"
CLINIC_POOL_ID="ap-southeast-2_jbutB4tj1"
TENANT_ID="b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
CLINIC_ID="22222222-2222-2222-2222-222222222222"

echo -e "${BLUE}🔄 Recreating Cognito Users with Custom Attributes${NC}"
echo "=================================================="
echo ""
echo "Note: tenant_id is immutable, so we must set it at user creation"
echo ""

# Step 1: Delete existing users
echo -e "${YELLOW}Step 1: Removing existing users...${NC}"
aws cognito-idp list-users \
    --user-pool-id "$CLINIC_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].Username' \
    --output json | jq -r '.[]' | while read username; do
    echo "  Deleting: $username"
    aws cognito-idp admin-delete-user \
        --user-pool-id "$CLINIC_POOL_ID" \
        --username "$username" \
        --region "$REGION" 2>/dev/null
done

# Step 2: Create users with all attributes
echo ""
echo -e "${YELLOW}Step 2: Creating users with custom attributes...${NC}"

# Create doctor
echo ""
echo "Creating doctor@test.com..."
aws cognito-idp admin-create-user \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "doctor@test.com" \
    --user-attributes \
        Name=email,Value="doctor@test.com" \
        Name=email_verified,Value=true \
        Name=given_name,Value="Test" \
        Name=family_name,Value="Doctor" \
        Name="custom:custom:role",Value="Admin" \
        Name="custom:custom:tenant_id",Value="$TENANT_ID" \
        Name="custom:custom:clinic_id",Value="$CLINIC_ID" \
        Name="custom:custom:employee_id",Value="EMP001" \
        Name="custom:custom:specialty",Value="General Practice" \
    --message-action SUPPRESS \
    --region "$REGION" > /tmp/doctor.json 2>&1

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓ Created doctor@test.com with attributes${NC}"
    SUB=$(cat /tmp/doctor.json | jq -r '.User.Attributes[] | select(.Name=="sub") | .Value')
    echo "  Sub: $SUB"
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$CLINIC_POOL_ID" \
        --username "doctor@test.com" \
        --password "TestPass123!" \
        --permanent \
        --region "$REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Password set${NC}"
    fi
else
    echo -e "  ${RED}✗ Failed to create doctor@test.com${NC}"
    cat /tmp/doctor.json
fi

# Create nurse
echo ""
echo "Creating nurse@test.com..."
aws cognito-idp admin-create-user \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "nurse@test.com" \
    --user-attributes \
        Name=email,Value="nurse@test.com" \
        Name=email_verified,Value=true \
        Name=given_name,Value="Test" \
        Name=family_name,Value="Nurse" \
        Name="custom:custom:role",Value="Staff" \
        Name="custom:custom:tenant_id",Value="$TENANT_ID" \
        Name="custom:custom:clinic_id",Value="$CLINIC_ID" \
        Name="custom:custom:employee_id",Value="EMP002" \
        Name="custom:custom:specialty",Value="Nursing" \
    --message-action SUPPRESS \
    --region "$REGION" > /tmp/nurse.json 2>&1

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓ Created nurse@test.com with attributes${NC}"
    SUB=$(cat /tmp/nurse.json | jq -r '.User.Attributes[] | select(.Name=="sub") | .Value')
    echo "  Sub: $SUB"
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$CLINIC_POOL_ID" \
        --username "nurse@test.com" \
        --password "TestPass123!" \
        --permanent \
        --region "$REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Password set${NC}"
    fi
else
    echo -e "  ${RED}✗ Failed to create nurse@test.com${NC}"
    cat /tmp/nurse.json
fi

# Step 3: Verify attributes
echo ""
echo -e "${YELLOW}Step 3: Verifying user attributes...${NC}"
echo ""

echo -e "${BLUE}Doctor's attributes:${NC}"
aws cognito-idp admin-get-user \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "doctor@test.com" \
    --region "$REGION" 2>/dev/null | \
    jq -r '.UserAttributes[] | select(.Name | startswith("custom") or .Name == "email") | "  \(.Name): \(.Value)"'

echo ""
echo -e "${BLUE}Nurse's attributes:${NC}"
aws cognito-idp admin-get-user \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "nurse@test.com" \
    --region "$REGION" 2>/dev/null | \
    jq -r '.UserAttributes[] | select(.Name | startswith("custom") or .Name == "email") | "  \(.Name): \(.Value)"'

echo ""
echo -e "${GREEN}✅ Users created with custom attributes!${NC}"
echo ""
echo "The JWT tokens will now include:"
echo "  • custom:custom:role (Admin/Staff)"
echo "  • custom:custom:tenant_id"
echo "  • custom:custom:clinic_id"
echo ""
echo "These attributes are in the Cognito token itself,"
echo "so the backend doesn't need to fetch from database!"
echo ""
echo "Test login at http://localhost:3010:"
echo "  Email: doctor@test.com"
echo "  Password: TestPass123!"