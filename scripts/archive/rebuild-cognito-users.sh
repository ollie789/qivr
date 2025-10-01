#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cognito configuration
REGION="ap-southeast-2"
USER_POOL_ID="ap-southeast-2_jbutB4tj1"
CLIENT_ID="4l510mm689hhpgr12prbuch2og"

# Database configuration
DB_HOST="qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com"
DB_USER="qivr_user"
DB_PASS="Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY="
DB_NAME="qivr"

echo -e "${BLUE}🧹 Cognito User Cleanup and Rebuild Script${NC}"
echo "============================================"
echo ""

# Function to run psql commands
run_psql() {
    PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "$1" 2>/dev/null
}

# Step 1: List existing Cognito users
echo -e "${YELLOW}Step 1: Listing existing Cognito users...${NC}"
aws cognito-idp list-users \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].Username' \
    --output json > /tmp/cognito-users.json

if [ $? -eq 0 ]; then
    echo "Current users in Cognito:"
    cat /tmp/cognito-users.json | jq -r '.[]'
    echo ""
else
    echo -e "${RED}Failed to list Cognito users. Check AWS CLI configuration.${NC}"
    exit 1
fi

# Step 2: Delete all existing users
echo -e "${YELLOW}Step 2: Deleting existing Cognito users...${NC}"
read -p "Are you sure you want to delete ALL users from Cognito? (y/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat /tmp/cognito-users.json | jq -r '.[]' | while read username; do
        echo "Deleting user: $username"
        aws cognito-idp admin-delete-user \
            --user-pool-id "$USER_POOL_ID" \
            --username "$username" \
            --region "$REGION" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✓ Deleted${NC}"
        else
            echo -e "  ${RED}✗ Failed to delete${NC}"
        fi
    done
else
    echo "Skipping user deletion."
fi

echo ""
echo -e "${YELLOW}Step 3: Creating new Cognito users...${NC}"

# Define users to create
declare -a USERS=(
    "doctor@test.com|Test|Doctor|Admin|Test123!"
    "nurse@test.com|Test|Nurse|Staff|Test123!"
    "patient@test.com|Test|Patient|Patient|Test123!"
)

# Get tenant ID from database
TENANT_ID=$(run_psql "SELECT id FROM tenants WHERE slug = 'demo-clinic' LIMIT 1;" | tr -d ' ')
if [ -z "$TENANT_ID" ]; then
    echo -e "${RED}No demo-clinic tenant found in database!${NC}"
    echo "Creating demo-clinic tenant..."
    TENANT_ID="b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
    run_psql "INSERT INTO tenants (id, name, slug, settings, created_at, updated_at) VALUES ('$TENANT_ID', 'Qivr Health Demo Clinic', 'demo-clinic', '{}', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"
fi

echo "Using tenant ID: $TENANT_ID"
echo ""

# Create each user
for user_data in "${USERS[@]}"; do
    IFS='|' read -r email firstname lastname role password <<< "$user_data"
    
    echo -e "${BLUE}Creating user: $email (Role: $role)${NC}"
    
    # Step 3a: Create user in Cognito
    echo "  1. Creating in Cognito..."
    aws cognito-idp admin-create-user \
        --user-pool-id "$USER_POOL_ID" \
        --username "$email" \
        --user-attributes \
            Name=email,Value="$email" \
            Name=given_name,Value="$firstname" \
            Name=family_name,Value="$lastname" \
            Name=email_verified,Value=true \
        --message-action SUPPRESS \
        --region "$REGION" > /tmp/cognito-user.json 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "     ${GREEN}✓ Created in Cognito${NC}"
        
        # Set permanent password
        aws cognito-idp admin-set-user-password \
            --user-pool-id "$USER_POOL_ID" \
            --username "$email" \
            --password "$password" \
            --permanent \
            --region "$REGION" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "     ${GREEN}✓ Password set${NC}"
        else
            echo -e "     ${RED}✗ Failed to set password${NC}"
        fi
        
        # Get the Cognito sub (user ID)
        COGNITO_SUB=$(cat /tmp/cognito-user.json | jq -r '.User.Attributes[] | select(.Name=="sub") | .Value')
        echo "     Cognito Sub: $COGNITO_SUB"
        
        # Step 3b: Create or update user in database
        echo "  2. Syncing to database..."
        
        # Check if user exists
        USER_EXISTS=$(run_psql "SELECT COUNT(*) FROM users WHERE email = '$email';" | tr -d ' ')
        
        if [ "$USER_EXISTS" = "1" ]; then
            # Update existing user
            run_psql "UPDATE users SET 
                cognito_id = '$COGNITO_SUB',
                role = '$role',
                first_name = '$firstname',
                last_name = '$lastname',
                tenant_id = '$TENANT_ID',
                updated_at = NOW()
                WHERE email = '$email';"
            echo -e "     ${GREEN}✓ Updated in database${NC}"
        else
            # Create new user
            USER_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
            run_psql "INSERT INTO users (
                id, cognito_id, email, role, tenant_id, 
                first_name, last_name, phone, metadata,
                created_at, updated_at
            ) VALUES (
                '$USER_ID',
                '$COGNITO_SUB',
                '$email',
                '$role',
                '$TENANT_ID',
                '$firstname',
                '$lastname',
                '',
                '{}',
                NOW(),
                NOW()
            );"
            echo -e "     ${GREEN}✓ Created in database${NC}"
        fi
        
    else
        echo -e "     ${RED}✗ Failed to create in Cognito${NC}"
    fi
    
    echo ""
done

# Step 4: Verify the setup
echo -e "${YELLOW}Step 4: Verifying setup...${NC}"

echo "Cognito users:"
aws cognito-idp list-users \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].{Username:Username, Status:UserStatus}' \
    --output table

echo ""
echo "Database users:"
run_psql "SELECT email, role, 
    CASE WHEN cognito_id IS NOT NULL THEN '✓' ELSE '✗' END as has_cognito,
    CASE WHEN tenant_id IS NOT NULL THEN '✓' ELSE '✗' END as has_tenant
    FROM users 
    WHERE email IN ('doctor@test.com', 'nurse@test.com', 'patient@test.com')
    ORDER BY email;"

echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "Test credentials:"
echo "  Admin:   doctor@test.com / Test123!"
echo "  Staff:   nurse@test.com / Test123!"
echo "  Patient: patient@test.com / Test123!"
echo ""
echo "Next steps:"
echo "1. Restart the backend: cd backend && dotnet run --project Qivr.Api --urls \"http://localhost:5050\""
echo "2. Navigate to: http://localhost:3010"
echo "3. Login with any of the test credentials above"