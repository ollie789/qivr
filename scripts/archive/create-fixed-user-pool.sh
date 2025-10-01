#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="ap-southeast-2"
OLD_POOL_ID="ap-southeast-2_jbutB4tj1"
POOL_NAME="qivr-clinic-fixed"

echo -e "${BLUE}🔄 Creating New Cognito User Pool with Fixed Custom Attributes${NC}"
echo "================================================================"
echo ""

# Step 1: Create the new user pool with properly named custom attributes
echo -e "${YELLOW}Step 1: Creating new user pool with correct custom attributes...${NC}"

cat > /tmp/user-pool-schema.json << 'EOF'
[
  {
    "Name": "email",
    "AttributeDataType": "String",
    "Required": true,
    "Mutable": true
  },
  {
    "Name": "given_name",
    "AttributeDataType": "String",
    "Required": false,
    "Mutable": true
  },
  {
    "Name": "family_name",
    "AttributeDataType": "String",
    "Required": false,
    "Mutable": true
  },
  {
    "Name": "role",
    "AttributeDataType": "String",
    "DeveloperOnlyAttribute": false,
    "Mutable": true,
    "StringAttributeConstraints": {
      "MinLength": "1",
      "MaxLength": "50"
    }
  },
  {
    "Name": "tenant_id",
    "AttributeDataType": "String",
    "DeveloperOnlyAttribute": false,
    "Mutable": false,
    "StringAttributeConstraints": {
      "MinLength": "1",
      "MaxLength": "100"
    }
  },
  {
    "Name": "clinic_id",
    "AttributeDataType": "String",
    "DeveloperOnlyAttribute": false,
    "Mutable": true,
    "StringAttributeConstraints": {
      "MinLength": "1",
      "MaxLength": "100"
    }
  },
  {
    "Name": "employee_id",
    "AttributeDataType": "String",
    "DeveloperOnlyAttribute": false,
    "Mutable": true,
    "StringAttributeConstraints": {
      "MinLength": "1",
      "MaxLength": "50"
    }
  },
  {
    "Name": "specialty",
    "AttributeDataType": "String",
    "DeveloperOnlyAttribute": false,
    "Mutable": true,
    "StringAttributeConstraints": {
      "MinLength": "1",
      "MaxLength": "100"
    }
  },
  {
    "Name": "license_num",
    "AttributeDataType": "String",
    "DeveloperOnlyAttribute": false,
    "Mutable": false,
    "StringAttributeConstraints": {
      "MinLength": "1",
      "MaxLength": "50"
    }
  }
]
EOF

# Create the new user pool
POOL_RESPONSE=$(aws cognito-idp create-user-pool \
    --pool-name "$POOL_NAME" \
    --schema file:///tmp/user-pool-schema.json \
    --username-attributes "email" \
    --auto-verified-attributes "email" \
    --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=true}" \
    --mfa-configuration "OFF" \
    --region "$REGION" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    NEW_POOL_ID=$(echo "$POOL_RESPONSE" | jq -r '.UserPool.Id')
    echo -e "  ${GREEN}✓ Created new user pool: $NEW_POOL_ID${NC}"
    
    # Save the pool ID for later use
    echo "$NEW_POOL_ID" > /tmp/new_pool_id.txt
else
    echo -e "  ${RED}✗ Failed to create user pool${NC}"
    echo "$POOL_RESPONSE"
    exit 1
fi

# Step 2: Create app client for the new pool
echo ""
echo -e "${YELLOW}Step 2: Creating app client...${NC}"

CLIENT_RESPONSE=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$NEW_POOL_ID" \
    --client-name "qivr-clinic-client" \
    --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" "ALLOW_USER_SRP_AUTH" \
    --generate-secret \
    --read-attributes "email" "given_name" "family_name" "custom:role" "custom:tenant_id" "custom:clinic_id" "custom:employee_id" "custom:specialty" "custom:license_num" \
    --write-attributes "email" "given_name" "family_name" "custom:role" "custom:clinic_id" "custom:employee_id" "custom:specialty" \
    --region "$REGION" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.UserPoolClient.ClientId')
    CLIENT_SECRET=$(echo "$CLIENT_RESPONSE" | jq -r '.UserPoolClient.ClientSecret')
    echo -e "  ${GREEN}✓ Created app client: $CLIENT_ID${NC}"
else
    echo -e "  ${RED}✗ Failed to create app client${NC}"
    echo "$CLIENT_RESPONSE"
    exit 1
fi

# Step 3: Create the users with correct attributes
echo ""
echo -e "${YELLOW}Step 3: Creating users with properly named custom attributes...${NC}"

TENANT_ID="b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
CLINIC_ID="22222222-2222-2222-2222-222222222222"

# Create doctor
echo ""
echo "Creating doctor@test.com..."
aws cognito-idp admin-create-user \
    --user-pool-id "$NEW_POOL_ID" \
    --username "doctor@test.com" \
    --user-attributes \
        Name=email,Value="doctor@test.com" \
        Name=email_verified,Value=true \
        Name=given_name,Value="Test" \
        Name=family_name,Value="Doctor" \
        Name="custom:role",Value="Admin" \
        Name="custom:tenant_id",Value="$TENANT_ID" \
        Name="custom:clinic_id",Value="$CLINIC_ID" \
        Name="custom:employee_id",Value="EMP001" \
        Name="custom:specialty",Value="General Practice" \
    --message-action SUPPRESS \
    --region "$REGION" > /tmp/doctor_new.json 2>&1

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓ Created doctor@test.com${NC}"
    NEW_DOCTOR_SUB=$(cat /tmp/doctor_new.json | jq -r '.User.Attributes[] | select(.Name=="sub") | .Value')
    echo "  New Sub: $NEW_DOCTOR_SUB"
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$NEW_POOL_ID" \
        --username "doctor@test.com" \
        --password "TestPass123!" \
        --permanent \
        --region "$REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Password set${NC}"
    fi
else
    echo -e "  ${RED}✗ Failed to create doctor@test.com${NC}"
    cat /tmp/doctor_new.json
fi

# Create nurse
echo ""
echo "Creating nurse@test.com..."
aws cognito-idp admin-create-user \
    --user-pool-id "$NEW_POOL_ID" \
    --username "nurse@test.com" \
    --user-attributes \
        Name=email,Value="nurse@test.com" \
        Name=email_verified,Value=true \
        Name=given_name,Value="Test" \
        Name=family_name,Value="Nurse" \
        Name="custom:role",Value="Staff" \
        Name="custom:tenant_id",Value="$TENANT_ID" \
        Name="custom:clinic_id",Value="$CLINIC_ID" \
        Name="custom:employee_id",Value="EMP002" \
        Name="custom:specialty",Value="Nursing" \
    --message-action SUPPRESS \
    --region "$REGION" > /tmp/nurse_new.json 2>&1

if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✓ Created nurse@test.com${NC}"
    NEW_NURSE_SUB=$(cat /tmp/nurse_new.json | jq -r '.User.Attributes[] | select(.Name=="sub") | .Value')
    echo "  New Sub: $NEW_NURSE_SUB"
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
        --user-pool-id "$NEW_POOL_ID" \
        --username "nurse@test.com" \
        --password "TestPass123!" \
        --permanent \
        --region "$REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Password set${NC}"
    fi
else
    echo -e "  ${RED}✗ Failed to create nurse@test.com${NC}"
    cat /tmp/nurse_new.json
fi

# Step 4: Verify the attributes
echo ""
echo -e "${YELLOW}Step 4: Verifying custom attributes...${NC}"
echo ""

echo -e "${BLUE}Doctor's attributes:${NC}"
aws cognito-idp admin-get-user \
    --user-pool-id "$NEW_POOL_ID" \
    --username "doctor@test.com" \
    --region "$REGION" 2>/dev/null | \
    jq -r '.UserAttributes[] | select(.Name | startswith("custom:") or .Name == "email") | "  \(.Name): \(.Value)"'

echo ""
echo -e "${GREEN}✅ New User Pool Created Successfully!${NC}"
echo ""
echo "================================================================"
echo -e "${YELLOW}IMPORTANT: Update your configuration with these new values:${NC}"
echo "================================================================"
echo ""
echo "User Pool ID: $NEW_POOL_ID"
echo "Client ID: $CLIENT_ID"
echo "Client Secret: $CLIENT_SECRET"
echo ""
echo "Doctor Sub: $NEW_DOCTOR_SUB"
echo "Nurse Sub: $NEW_NURSE_SUB"
echo ""
echo "The custom attributes now have the correct naming:"
echo "  • custom:role (not custom:custom:role)"
echo "  • custom:tenant_id (not custom:custom:tenant_id)"
echo "  • custom:clinic_id (not custom:custom:clinic_id)"
echo ""
echo "Next steps:"
echo "1. Update backend appsettings with new Pool ID"
echo "2. Update frontend .env with new Pool ID and Client ID"
echo "3. Update database with new Cognito sub IDs"
echo "================================================================"

# Save configuration for easy access
cat > /tmp/new_cognito_config.json << EOF
{
  "poolId": "$NEW_POOL_ID",
  "clientId": "$CLIENT_ID",
  "clientSecret": "$CLIENT_SECRET",
  "doctorSub": "$NEW_DOCTOR_SUB",
  "nurseSub": "$NEW_NURSE_SUB"
}
EOF

echo ""
echo "Configuration saved to: /tmp/new_cognito_config.json"