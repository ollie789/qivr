#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="ap-southeast-2"
CLINIC_POOL_ID="ap-southeast-2_jbutB4tj1"
PATIENT_POOL_ID="ap-southeast-2_ZMcriKNGJ"
TENANT_ID="b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
CLINIC_ID="22222222-2222-2222-2222-222222222222"

echo -e "${BLUE}🔧 Setting Custom Attributes in Cognito${NC}"
echo "========================================"
echo ""

# Set attributes for clinic users
echo -e "${YELLOW}Setting attributes for clinic users...${NC}"
echo ""

# Doctor
echo "Updating doctor@test.com..."
aws cognito-idp admin-update-user-attributes \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "doctor@test.com" \
    --user-attributes \
        Name="custom:custom:role",Value="Admin" \
        Name="custom:custom:tenant_id",Value="$TENANT_ID" \
        Name="custom:custom:clinic_id",Value="$CLINIC_ID" \
        Name="custom:custom:employee_id",Value="EMP001" \
        Name="custom:custom:specialty",Value="General Practice" \
    --region "$REGION" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓ Updated doctor@test.com${NC}"
else
    echo -e "  ${RED}✗ Failed to update doctor@test.com${NC}"
fi

# Nurse
echo "Updating nurse@test.com..."
aws cognito-idp admin-update-user-attributes \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "nurse@test.com" \
    --user-attributes \
        Name="custom:custom:role",Value="Staff" \
        Name="custom:custom:tenant_id",Value="$TENANT_ID" \
        Name="custom:custom:clinic_id",Value="$CLINIC_ID" \
        Name="custom:custom:employee_id",Value="EMP002" \
        Name="custom:custom:specialty",Value="Nursing" \
    --region "$REGION" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓ Updated nurse@test.com${NC}"
else
    echo -e "  ${RED}✗ Failed to update nurse@test.com${NC}"
fi

# Set attributes for patient user
echo ""
echo -e "${YELLOW}Setting attributes for patient user...${NC}"

# Check if patient pool has custom attributes
PATIENT_ATTRS=$(aws cognito-idp describe-user-pool \
    --user-pool-id "$PATIENT_POOL_ID" \
    --region "$REGION" 2>/dev/null | jq -r '.UserPool.SchemaAttributes[] | select(.Name | contains("custom")) | .Name' | head -1)

if [ -n "$PATIENT_ATTRS" ]; then
    echo "Updating patient@test.com..."
    aws cognito-idp admin-update-user-attributes \
        --user-pool-id "$PATIENT_POOL_ID" \
        --username "patient@test.com" \
        --user-attributes \
            Name="custom:custom:role",Value="Patient" \
            Name="custom:custom:tenant_id",Value="$TENANT_ID" \
        --region "$REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Updated patient@test.com${NC}"
    else
        echo -e "  Patient pool may not have custom attributes defined"
    fi
else
    echo "  Patient pool doesn't have custom attributes (this is normal)"
fi

# Verify the attributes
echo ""
echo -e "${YELLOW}Verifying user attributes...${NC}"
echo ""

echo -e "${BLUE}Doctor attributes:${NC}"
aws cognito-idp admin-get-user \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "doctor@test.com" \
    --region "$REGION" 2>/dev/null | jq -r '.UserAttributes[] | select(.Name | contains("custom") or .Name == "email") | "\(.Name): \(.Value)"'

echo ""
echo -e "${BLUE}Nurse attributes:${NC}"
aws cognito-idp admin-get-user \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "nurse@test.com" \
    --region "$REGION" 2>/dev/null | jq -r '.UserAttributes[] | select(.Name | contains("custom") or .Name == "email") | "\(.Name): \(.Value)"'

echo ""
echo -e "${GREEN}✅ Custom attributes set!${NC}"
echo ""
echo "The backend authentication middleware should now be able to read:"
echo "  - custom:custom:role (Admin/Staff/Patient)"
echo "  - custom:custom:tenant_id"
echo "  - custom:custom:clinic_id"
echo ""
echo "These will be included in the JWT token from Cognito."
echo ""
echo "Try logging in again at http://localhost:3010 with:"
echo "  Email: doctor@test.com"
echo "  Password: TestPass123!"