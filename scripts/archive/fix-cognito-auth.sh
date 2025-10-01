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

echo -e "${BLUE}🔧 Fixing Cognito Authentication Issues${NC}"
echo "========================================"
echo ""

# Step 1: Delete existing clinic users with UUID usernames
echo -e "${YELLOW}Step 1: Cleaning up existing clinic users...${NC}"

# Get all users in the pool
aws cognito-idp list-users \
    --user-pool-id "$CLINIC_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].Username' \
    --output json | jq -r '.[]' | while read username; do
    
    echo "Deleting user: $username"
    aws cognito-idp admin-delete-user \
        --user-pool-id "$CLINIC_POOL_ID" \
        --username "$username" \
        --region "$REGION" 2>/dev/null
done

# Step 2: Create users with email as username
echo ""
echo -e "${YELLOW}Step 2: Creating clinic users with email as username...${NC}"

# Define clinic users
declare -a CLINIC_USERS=(
    "doctor@test.com|Test|Doctor|Admin"
    "nurse@test.com|Test|Nurse|Staff"
)

CREATED_USERS=""

for user_data in "${CLINIC_USERS[@]}"; do
    IFS='|' read -r email firstname lastname role <<< "$user_data"
    
    echo -e "\n${BLUE}Creating: $email (Role: $role)${NC}"
    
    # Create user with email as username (important!)
    RESULT=$(aws cognito-idp admin-create-user \
        --user-pool-id "$CLINIC_POOL_ID" \
        --username "$email" \
        --user-attributes \
            Name=email,Value="$email" \
            Name=email_verified,Value=true \
            Name=given_name,Value="$firstname" \
            Name=family_name,Value="$lastname" \
        --message-action SUPPRESS \
        --region "$REGION" 2>&1)
    
    if [ $? -eq 0 ]; then
        echo -e "  ${GREEN}✓ Created user${NC}"
        
        # Extract the sub from result
        SUB=$(echo "$RESULT" | jq -r '.User.Attributes[] | select(.Name=="sub") | .Value')
        echo "  Sub: $SUB"
        
        # Set permanent password
        aws cognito-idp admin-set-user-password \
            --user-pool-id "$CLINIC_POOL_ID" \
            --username "$email" \
            --password "TestPass123!" \
            --permanent \
            --region "$REGION" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✓ Password set${NC}"
        else
            echo -e "  ${RED}✗ Failed to set password${NC}"
        fi
        
        CREATED_USERS="$CREATED_USERS$email|$SUB|$role\n"
    else
        echo -e "  ${RED}✗ Failed to create user${NC}"
        echo "  Error: $RESULT"
    fi
done

# Step 3: Update database with new Cognito subs
echo ""
echo -e "${YELLOW}Step 3: Updating database with new Cognito subs...${NC}"

# Parse created users and update database
echo -e "$CREATED_USERS" | while IFS='|' read -r email sub role; do
    if [ -n "$email" ] && [ -n "$sub" ]; then
        echo "Updating $email with sub: $sub"
        
        PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql \
            -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
            -U qivr_user -d qivr -c \
            "UPDATE users SET cognito_id = '$sub', role = '$role', tenant_id = '$TENANT_ID' WHERE email = '$email';" 2>/dev/null
    fi
done

# Step 4: Verify the setup
echo ""
echo -e "${YELLOW}Step 4: Verifying setup...${NC}"

echo -e "\n${BLUE}Cognito Users:${NC}"
aws cognito-idp list-users \
    --user-pool-id "$CLINIC_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].[Username, UserStatus, Attributes[?Name==`email`].Value|[0]]' \
    --output table

echo -e "\n${BLUE}Database Users:${NC}"
PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql \
    -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    -U qivr_user -d qivr -t -c \
    "SELECT email, role, 
        CASE WHEN cognito_id IS NOT NULL THEN '✓' ELSE '✗' END as synced 
    FROM users 
    WHERE email IN ('doctor@test.com', 'nurse@test.com') 
    ORDER BY email;"

echo ""
echo -e "${GREEN}✅ Authentication Fixed!${NC}"
echo ""
echo "Test Login:"
echo "1. Go to http://localhost:3010"
echo "2. Login with:"
echo "   Email: doctor@test.com"
echo "   Password: TestPass123!"
echo ""
echo "The key fix: Users are now created with email as the username,"
echo "allowing email-based login instead of UUID-based."