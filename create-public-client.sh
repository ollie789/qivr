#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

REGION="ap-southeast-2"
POOL_ID="ap-southeast-2_b48ZBE35F"

echo -e "${BLUE}Creating Public App Client for Frontend Applications${NC}"
echo "======================================================"
echo ""
echo "Note: Frontend applications need a client WITHOUT a secret"
echo ""

# Create a new app client without secret for frontend use
echo -e "${YELLOW}Creating public app client...${NC}"

CLIENT_RESPONSE=$(aws cognito-idp create-user-pool-client \
    --user-pool-id "$POOL_ID" \
    --client-name "qivr-clinic-public-client" \
    --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" "ALLOW_USER_SRP_AUTH" \
    --read-attributes "email" "given_name" "family_name" "custom:role" "custom:tenant_id" "custom:clinic_id" "custom:employee_id" "custom:specialty" "custom:license_num" \
    --write-attributes "email" "given_name" "family_name" "custom:role" "custom:clinic_id" "custom:employee_id" "custom:specialty" \
    --region "$REGION" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    CLIENT_ID=$(echo "$CLIENT_RESPONSE" | jq -r '.UserPoolClient.ClientId')
    echo -e "  ${GREEN}✓ Created public app client: $CLIENT_ID${NC}"
    echo ""
    
    # Save configuration
    cat > /tmp/public_client_config.json << EOF
{
  "poolId": "$POOL_ID",
  "clientId": "$CLIENT_ID",
  "clientSecret": null,
  "region": "$REGION"
}
EOF
    
    echo -e "${GREEN}✅ Public client created successfully!${NC}"
    echo ""
    echo "================================================================"
    echo -e "${YELLOW}IMPORTANT: Update your frontend configurations:${NC}"
    echo "================================================================"
    echo ""
    echo "NEW CLIENT ID (no secret): $CLIENT_ID"
    echo ""
    echo "1. Update clinic-dashboard/.env:"
    echo "   VITE_COGNITO_CLIENT_ID=$CLIENT_ID"
    echo ""
    echo "2. Update patient-portal/.env:"
    echo "   VITE_COGNITO_CLIENT_ID=$CLIENT_ID"
    echo ""
    echo "3. The Pool ID remains the same:"
    echo "   VITE_COGNITO_USER_POOL_ID=$POOL_ID"
    echo ""
    echo "This client does NOT require a SECRET_HASH, perfect for browser apps!"
    echo "================================================================"
    
    # Automatically update the .env files
    echo ""
    echo -e "${YELLOW}Automatically updating .env files...${NC}"
    
    # Update clinic dashboard
    if [ -f "apps/clinic-dashboard/.env" ]; then
        sed -i.bak "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$CLIENT_ID/" apps/clinic-dashboard/.env
        echo -e "  ${GREEN}✓ Updated apps/clinic-dashboard/.env${NC}"
    fi
    
    # Update patient portal
    if [ -f "apps/patient-portal/.env" ]; then
        sed -i.bak "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$CLIENT_ID/" apps/patient-portal/.env
        echo -e "  ${GREEN}✓ Updated apps/patient-portal/.env${NC}"
    fi
    
    # Also check for .env.local files
    if [ -f "apps/clinic-dashboard/.env.local" ]; then
        sed -i.bak "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$CLIENT_ID/" apps/clinic-dashboard/.env.local
        echo -e "  ${GREEN}✓ Updated apps/clinic-dashboard/.env.local${NC}"
    fi
    
    if [ -f "apps/patient-portal/.env.local" ]; then
        sed -i.bak "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$CLIENT_ID/" apps/patient-portal/.env.local
        echo -e "  ${GREEN}✓ Updated apps/patient-portal/.env.local${NC}"
    fi
    
    echo ""
    echo -e "${YELLOW}NOTE: You need to restart the frontend applications for changes to take effect${NC}"
    echo ""
    echo "Run: ./restart-apps.sh"
    echo ""
    
else
    echo -e "  ${RED}✗ Failed to create app client${NC}"
    echo "$CLIENT_RESPONSE"
    exit 1
fi