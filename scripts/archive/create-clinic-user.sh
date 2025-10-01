#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Cognito configuration
USER_POOL_ID="us-east-1_1PHs4pV9s"
CLIENT_ID="6j8tfvvbl9q73iqj2bchjqkvfe"
REGION="us-east-1"

echo "==================================="
echo "  Qivr Clinic Portal - Create User"
echo "==================================="
echo

# Function to create a test user quickly
create_test_user() {
    EMAIL="admin@qivrclinic.com"
    PASSWORD="TestClinic123!"
    CLINIC_NAME="Qivr Test Clinic"
    FIRST_NAME="Admin"
    LAST_NAME="User"
    
    echo -e "${YELLOW}Creating test user with:${NC}"
    echo "Email: $EMAIL"
    echo "Password: $PASSWORD"
    echo "Clinic: $CLINIC_NAME"
    echo
    
    # Create the user
    echo -e "${YELLOW}Creating user in Cognito...${NC}"
    aws cognito-idp sign-up \
        --client-id $CLIENT_ID \
        --username "$EMAIL" \
        --password "$PASSWORD" \
        --user-attributes \
            Name=email,Value="$EMAIL" \
            Name=given_name,Value="$FIRST_NAME" \
            Name=family_name,Value="$LAST_NAME" \
            Name=custom:clinic_name,Value="$CLINIC_NAME" \
            Name=custom:role,Value="ClinicAdmin" \
        --region $REGION 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ User created successfully!${NC}"
        
        # Auto-confirm the user
        echo -e "${YELLOW}Confirming user...${NC}"
        aws cognito-idp admin-confirm-sign-up \
            --user-pool-id $USER_POOL_ID \
            --username "$EMAIL" \
            --region $REGION 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ User confirmed!${NC}"
        fi
        
        # Set permanent password
        echo -e "${YELLOW}Setting permanent password...${NC}"
        aws cognito-idp admin-set-user-password \
            --user-pool-id $USER_POOL_ID \
            --username "$EMAIL" \
            --password "$PASSWORD" \
            --permanent \
            --region $REGION 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Password set!${NC}"
        fi
        
    else
        echo -e "${YELLOW}User might already exist. Resetting password...${NC}"
        
        # Try to reset the password if user exists
        aws cognito-idp admin-set-user-password \
            --user-pool-id $USER_POOL_ID \
            --username "$EMAIL" \
            --password "$PASSWORD" \
            --permanent \
            --region $REGION 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Password reset successfully!${NC}"
        else
            echo -e "${RED}✗ Failed to create or update user${NC}"
            exit 1
        fi
    fi
    
    echo
    echo -e "${GREEN}==================================="
    echo "    User Ready for Login!"
    echo "===================================${NC}"
    echo "Email: $EMAIL"
    echo "Password: $PASSWORD"
    echo
    echo "You can now log in to the Clinic Portal at:"
    echo "http://localhost:3000/login"
}

# Function to create a custom user
create_custom_user() {
    read -p "Enter email address: " EMAIL
    read -s -p "Enter password (min 8 chars, uppercase, lowercase, number): " PASSWORD
    echo
    read -p "Enter clinic name: " CLINIC_NAME
    read -p "Enter first name: " FIRST_NAME
    read -p "Enter last name: " LAST_NAME
    
    echo
    echo -e "${YELLOW}Creating user...${NC}"
    
    # Create the user
    aws cognito-idp sign-up \
        --client-id $CLIENT_ID \
        --username "$EMAIL" \
        --password "$PASSWORD" \
        --user-attributes \
            Name=email,Value="$EMAIL" \
            Name=given_name,Value="$FIRST_NAME" \
            Name=family_name,Value="$LAST_NAME" \
            Name=custom:clinic_name,Value="$CLINIC_NAME" \
            Name=custom:role,Value="ClinicAdmin" \
        --region $REGION
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ User created!${NC}"
        
        read -p "Auto-confirm this user? (y/n): " CONFIRM
        if [ "$CONFIRM" = "y" ] || [ "$CONFIRM" = "Y" ]; then
            aws cognito-idp admin-confirm-sign-up \
                --user-pool-id $USER_POOL_ID \
                --username "$EMAIL" \
                --region $REGION
            
            aws cognito-idp admin-set-user-password \
                --user-pool-id $USER_POOL_ID \
                --username "$EMAIL" \
                --password "$PASSWORD" \
                --permanent \
                --region $REGION
            
            echo -e "${GREEN}✓ User confirmed and password set!${NC}"
        fi
        
        echo
        echo -e "${GREEN}User created successfully!${NC}"
        echo "Email: $EMAIL"
        echo "Clinic: $CLINIC_NAME"
    else
        echo -e "${RED}✗ Failed to create user${NC}"
    fi
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}AWS CLI is not installed. Please install it first:${NC}"
    echo "brew install awscli"
    exit 1
fi

# Check if AWS credentials are configured
aws sts get-caller-identity --region $REGION &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}AWS credentials not configured. Please run:${NC}"
    echo "aws configure"
    exit 1
fi

# Main menu
echo "Choose an option:"
echo "1. Quick create test user (admin@qivrclinic.com)"
echo "2. Create custom clinic user"
echo "3. Exit"
echo
read -p "Enter choice (1-3): " CHOICE

case $CHOICE in
    1)
        create_test_user
        ;;
    2)
        create_custom_user
        ;;
    3)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
