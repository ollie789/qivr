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

echo -e "${BLUE}🔐 Fixing Cognito User Passwords${NC}"
echo "===================================="
echo ""

# Define users to fix
declare -a USERS=(
    "doctor@test.com|Test123!"
    "nurse@test.com|Test123!"
    "patient@test.com|Test123!"
)

for user_data in "${USERS[@]}"; do
    IFS='|' read -r email password <<< "$user_data"
    
    echo -e "${YELLOW}Fixing password for: $email${NC}"
    
    # First, get the user details to get the correct username
    USERNAME=$(aws cognito-idp list-users \
        --user-pool-id "$USER_POOL_ID" \
        --region "$REGION" \
        --filter "email=\"$email\"" \
        --query 'Users[0].Username' \
        --output text 2>/dev/null)
    
    if [ "$USERNAME" != "None" ] && [ -n "$USERNAME" ]; then
        echo "  Found user with ID: $USERNAME"
        
        # Force change the password to confirm the user
        aws cognito-idp admin-set-user-password \
            --user-pool-id "$USER_POOL_ID" \
            --username "$USERNAME" \
            --password "$password" \
            --permanent \
            --region "$REGION" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "  ${GREEN}✓ Password set successfully${NC}"
            
            # Also set email as alias for easier login
            aws cognito-idp admin-update-user-attributes \
                --user-pool-id "$USER_POOL_ID" \
                --username "$USERNAME" \
                --user-attributes Name=email_verified,Value=true \
                --region "$REGION" 2>/dev/null
            
            echo -e "  ${GREEN}✓ Email verified${NC}"
        else
            # Try alternative method - confirm the user first
            echo "  Attempting to confirm user first..."
            
            # Admin confirm the user
            aws cognito-idp admin-confirm-sign-up \
                --user-pool-id "$USER_POOL_ID" \
                --username "$USERNAME" \
                --region "$REGION" 2>/dev/null
            
            # Now set the password
            aws cognito-idp admin-set-user-password \
                --user-pool-id "$USER_POOL_ID" \
                --username "$USERNAME" \
                --password "$password" \
                --permanent \
                --region "$REGION" 2>/dev/null
            
            if [ $? -eq 0 ]; then
                echo -e "  ${GREEN}✓ Password set after confirmation${NC}"
            else
                echo -e "  ${RED}✗ Failed to set password${NC}"
                
                # Try admin reset password as last resort
                echo "  Trying admin reset..."
                aws cognito-idp admin-reset-user-password \
                    --user-pool-id "$USER_POOL_ID" \
                    --username "$USERNAME" \
                    --region "$REGION" 2>/dev/null
                
                # Then set permanent password
                aws cognito-idp admin-set-user-password \
                    --user-pool-id "$USER_POOL_ID" \
                    --username "$USERNAME" \
                    --password "$password" \
                    --permanent \
                    --region "$REGION" 2>/dev/null
                
                if [ $? -eq 0 ]; then
                    echo -e "  ${GREEN}✓ Password set after reset${NC}"
                else
                    echo -e "  ${RED}✗ All password setting methods failed${NC}"
                fi
            fi
        fi
    else
        echo -e "  ${RED}✗ User not found in Cognito${NC}"
    fi
    
    echo ""
done

# Verify the final status
echo -e "${YELLOW}Final user status:${NC}"
aws cognito-idp list-users \
    --user-pool-id "$USER_POOL_ID" \
    --region "$REGION" \
    --query 'Users[].{Email:Attributes[?Name==`email`].Value|[0], Status:UserStatus, Sub:Attributes[?Name==`sub`].Value|[0]}' \
    --output table

echo ""
echo -e "${GREEN}✅ Password fix complete!${NC}"
echo ""
echo "Test by logging in with:"
echo "  Admin:   doctor@test.com / Test123!"
echo "  Staff:   nurse@test.com / Test123!"
echo "  Patient: patient@test.com / Test123!"