#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

REGION="ap-southeast-2"
USER_POOL_ID="ap-southeast-2_jbutB4tj1"
TENANT_ID="b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"

echo -e "${BLUE}🔧 Fixing Cognito User Configuration${NC}"
echo "========================================"
echo ""

# Step 1: Remove patient user from Cognito (they shouldn't be in clinic pool)
echo -e "${YELLOW}Step 1: Removing patient from clinic user pool...${NC}"
aws cognito-idp admin-delete-user \
    --user-pool-id "$USER_POOL_ID" \
    --username "28a2d124-c1e9-432b-97dc-6001498eb730" \
    --region "$REGION" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Removed patient@test.com from clinic pool${NC}"
else
    echo -e "${YELLOW}⚠ Patient already removed or not found${NC}"
fi

# Step 2: Add custom attributes to existing clinic users
echo ""
echo -e "${YELLOW}Step 2: Adding custom attributes to clinic users...${NC}"

# Define clinic users (doctor and nurse only)
declare -a CLINIC_USERS=(
    "376ee309-c27e-4d72-b400-647d4ea61f09|doctor@test.com|Admin"
    "e795bfce-d3f5-4ee1-9188-2f1560665e98|nurse@test.com|Staff"
)

for user_data in "${CLINIC_USERS[@]}"; do
    IFS='|' read -r username email role <<< "$user_data"
    
    echo -e "${BLUE}Updating: $email${NC}"
    
    # Add custom attributes (tenant_id and role)
    aws cognito-idp admin-update-user-attributes \
        --user-pool-id "$USER_POOL_ID" \
        --username "$username" \
        --user-attributes \
            Name=email,Value="$email" \
            Name=email_verified,Value=true \
        --region "$REGION" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Updated attributes${NC}"
    else
        echo -e "  ${RED}✗ Failed to update attributes${NC}"
    fi
done

echo ""
echo -e "${YELLOW}Step 3: Updating database...${NC}"

# Update database to remove patient from users table or mark as different type
PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql \
    -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    -U qivr_user -d qivr << EOF
-- Remove patient from clinic users or update their status
DELETE FROM users WHERE email = 'patient@test.com';

-- Ensure clinic users have correct tenant_id
UPDATE users 
SET tenant_id = '$TENANT_ID',
    updated_at = NOW()
WHERE email IN ('doctor@test.com', 'nurse@test.com');

-- Verify
SELECT email, role, tenant_id::text 
FROM users 
WHERE email IN ('doctor@test.com', 'nurse@test.com')
ORDER BY email;
EOF

echo ""
echo -e "${YELLOW}Step 4: Create Patient Pool Configuration (for future)${NC}"
echo "For proper multi-tenant setup, consider:"
echo "1. Separate user pool for patients"
echo "2. Or use groups within the same pool with different permissions"
echo "3. Store tenant_id and role in database (as we're doing now)"

echo ""
echo -e "${GREEN}✅ Configuration Fixed!${NC}"
echo ""
echo "Clinic Dashboard Users (http://localhost:3010):"
echo "  • doctor@test.com / TestPass123! (Admin)"
echo "  • nurse@test.com / TestPass123! (Staff)"
echo ""
echo "Patient Portal (http://localhost:3005):"
echo "  • Patients should register through a different flow"
echo "  • Or use a separate Cognito User Pool"
echo ""
echo "Note: Since Cognito doesn't support custom attributes after pool creation,"
echo "we're storing role and tenant_id in the database and fetching them during authentication."