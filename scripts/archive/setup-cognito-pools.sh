#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="ap-southeast-2"
CLINIC_POOL_ID="ap-southeast-2_jbutB4tj1"
PATIENT_POOL_ID="ap-southeast-2_ZMcriKNGJ"
TENANT_ID="b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"

echo -e "${BLUE}🏥 Setting up Cognito User Pools Correctly${NC}"
echo "============================================="
echo ""

# Step 1: Remove patient from clinic pool
echo -e "${YELLOW}Step 1: Cleaning up clinic pool...${NC}"
aws cognito-idp admin-delete-user \
    --user-pool-id "$CLINIC_POOL_ID" \
    --username "28a2d124-c1e9-432b-97dc-6001498eb730" \
    --region "$REGION" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Removed patient from clinic pool${NC}"
else
    echo -e "${YELLOW}⚠ Patient not in clinic pool (good!)${NC}"
fi

# Step 2: Get patient pool client ID
echo ""
echo -e "${YELLOW}Step 2: Getting patient pool configuration...${NC}"
PATIENT_POOL_CLIENTS=$(aws cognito-idp list-user-pool-clients \
    --user-pool-id "$PATIENT_POOL_ID" \
    --region "$REGION" \
    --query 'UserPoolClients[0].ClientId' \
    --output text)

echo "Patient Pool ID: $PATIENT_POOL_ID"
echo "Patient Pool Client ID: $PATIENT_POOL_CLIENTS"

# Step 3: Create patient user in patient pool
echo ""
echo -e "${YELLOW}Step 3: Creating patient in patient pool...${NC}"

# First check if patient exists in patient pool
PATIENT_EXISTS=$(aws cognito-idp list-users \
    --user-pool-id "$PATIENT_POOL_ID" \
    --region "$REGION" \
    --filter "email=\"patient@test.com\"" \
    --query 'Users[0].Username' \
    --output text 2>/dev/null)

if [ "$PATIENT_EXISTS" != "None" ] && [ -n "$PATIENT_EXISTS" ]; then
    echo -e "${YELLOW}Patient already exists in patient pool. Deleting to recreate...${NC}"
    aws cognito-idp admin-delete-user \
        --user-pool-id "$PATIENT_POOL_ID" \
        --username "$PATIENT_EXISTS" \
        --region "$REGION" 2>/dev/null
fi

# Create patient user
aws cognito-idp admin-create-user \
    --user-pool-id "$PATIENT_POOL_ID" \
    --username "patient@test.com" \
    --user-attributes \
        Name=email,Value="patient@test.com" \
        Name=email_verified,Value=true \
        Name=given_name,Value="Test" \
        Name=family_name,Value="Patient" \
    --temporary-password "TestPass123!" \
    --message-action SUPPRESS \
    --region "$REGION" > /tmp/patient-user.json 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Created patient in patient pool${NC}"
    
    # Get the sub
    PATIENT_SUB=$(cat /tmp/patient-user.json | jq -r '.User.Attributes[] | select(.Name=="sub") | .Value')
    echo "  Patient Sub: $PATIENT_SUB"
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$PATIENT_POOL_ID" \
        --username "patient@test.com" \
        --password "TestPass123!" \
        --permanent \
        --region "$REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Password set to permanent${NC}"
    else
        echo -e "  ${RED}✗ Failed to set password${NC}"
    fi
else
    echo -e "${RED}✗ Failed to create patient${NC}"
fi

# Step 4: Update database
echo ""
echo -e "${YELLOW}Step 4: Updating database...${NC}"

PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql \
    -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    -U qivr_user -d qivr << EOF
-- Create or update patient user
INSERT INTO users (
    id, 
    cognito_id, 
    email, 
    role, 
    tenant_id,
    first_name, 
    last_name, 
    phone, 
    metadata,
    created_at, 
    updated_at
) VALUES (
    gen_random_uuid(),
    '${PATIENT_SUB:-pending}',
    'patient@test.com',
    'Patient',
    '$TENANT_ID',
    'Test',
    'Patient',
    '',
    '{}',
    NOW(),
    NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
    cognito_id = EXCLUDED.cognito_id,
    role = 'Patient',
    tenant_id = '$TENANT_ID',
    updated_at = NOW();

-- Verify all users
SELECT 
    email, 
    role, 
    CASE 
        WHEN cognito_id IS NOT NULL AND cognito_id != '' THEN '✓' 
        ELSE '✗' 
    END as has_cognito,
    LEFT(cognito_id, 8) || '...' as cognito_prefix
FROM users 
WHERE email IN ('doctor@test.com', 'nurse@test.com', 'patient@test.com')
ORDER BY 
    CASE role 
        WHEN 'Admin' THEN 1 
        WHEN 'Staff' THEN 2 
        WHEN 'Patient' THEN 3 
        ELSE 4 
    END;
EOF

# Step 5: Show pool configurations
echo ""
echo -e "${YELLOW}Step 5: Verifying Cognito Pools...${NC}"

echo -e "\n${BLUE}Clinic Pool Users:${NC}"
aws cognito-idp list-users \
    --user-pool-id "$CLINIC_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].{Email:Attributes[?Name==`email`].Value|[0], Status:UserStatus}' \
    --output json | jq -r '.[] | "\(.Email): \(.Status)"'

echo -e "\n${BLUE}Patient Pool Users:${NC}"
aws cognito-idp list-users \
    --user-pool-id "$PATIENT_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].{Email:Attributes[?Name==`email`].Value|[0], Status:UserStatus}' \
    --output json | jq -r '.[] | "\(.Email): \(.Status)"'

echo ""
echo -e "${GREEN}✅ User Pool Setup Complete!${NC}"
echo ""
echo "Frontend Configurations Needed:"
echo ""
echo "Clinic Dashboard (.env):"
echo "  VITE_COGNITO_USER_POOL_ID=$CLINIC_POOL_ID"
echo "  VITE_COGNITO_CLIENT_ID=[Get from AWS Console]"
echo ""
echo "Patient Portal (.env):"
echo "  VITE_COGNITO_USER_POOL_ID=$PATIENT_POOL_ID"
echo "  VITE_COGNITO_CLIENT_ID=$PATIENT_POOL_CLIENTS"
echo ""
echo "Test Credentials:"
echo "  Clinic Dashboard (http://localhost:3010):"
echo "    • doctor@test.com / TestPass123!"
echo "    • nurse@test.com / TestPass123!"
echo ""
echo "  Patient Portal (http://localhost:3005):"
echo "    • patient@test.com / TestPass123!"