#!/bin/bash

# Script to manage Cognito users and retrieve/set credentials
set -e

echo "🔐 Cognito User Management"
echo "=========================="

# Configuration
export AWS_REGION="ap-southeast-2"
CLINIC_POOL_ID="ap-southeast-2_jbutB4tj1"
CLINIC_CLIENT_ID="4l510mm689hhpgr12prbuch2og"
PATIENT_POOL_ID="ap-southeast-2_ZMcriKNGJ"
PATIENT_CLIENT_ID="4kugfmvk56o3otd0grc4gddi8r"

# Default test password (you should change this in production)
DEFAULT_PASSWORD="TestPassword123!"

echo ""
echo "📋 Current Users:"
echo ""
echo "Clinic Dashboard Pool (for doctors/nurses):"
echo "-------------------------------------------"
aws cognito-idp list-users --user-pool-id $CLINIC_POOL_ID --region $AWS_REGION \
  --query 'Users[*].[Attributes[?Name==`email`].Value|[0],UserStatus]' \
  --output table

echo ""
echo "Patient Portal Pool:"
echo "-------------------"
aws cognito-idp list-users --user-pool-id $PATIENT_POOL_ID --region $AWS_REGION \
  --query 'Users[*].[Attributes[?Name==`email`].Value|[0],UserStatus]' \
  --output table

echo ""
echo "🔧 Options:"
echo "1) Reset password for existing user"
echo "2) Create new test user"
echo "3) Show application URLs and client IDs"
echo "4) Exit"
echo ""
read -p "Select option (1-4): " option

case $option in
  1)
    echo ""
    echo "Select pool:"
    echo "1) Clinic Dashboard (doctor@test.com, nurse@test.com)"
    echo "2) Patient Portal (patient@test.com, ollie.bingemann@gmail.com)"
    read -p "Select pool (1-2): " pool_choice
    
    if [ "$pool_choice" = "1" ]; then
      POOL_ID=$CLINIC_POOL_ID
      echo "Available users: doctor@test.com, nurse@test.com"
    else
      POOL_ID=$PATIENT_POOL_ID
      echo "Available users: patient@test.com, ollie.bingemann@gmail.com"
    fi
    
    echo ""
    read -p "Enter email address to reset password: " email
    read -p "Enter new password (min 8 chars, uppercase, lowercase, number): " -s new_password
    echo ""
    
    # Get username from email
    username=$(aws cognito-idp list-users --user-pool-id $POOL_ID --region $AWS_REGION \
      --query "Users[?Attributes[?Name=='email' && Value=='$email']].Username | [0]" \
      --output text)
    
    if [ "$username" = "None" ] || [ -z "$username" ]; then
      echo "❌ User with email $email not found"
      exit 1
    fi
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
      --user-pool-id $POOL_ID \
      --username "$username" \
      --password "$new_password" \
      --permanent \
      --region $AWS_REGION
    
    echo "✅ Password reset successfully for $email"
    echo ""
    echo "Login credentials:"
    echo "  Email: $email"
    echo "  Password: [the password you just set]"
    ;;
    
  2)
    echo ""
    echo "Select pool for new user:"
    echo "1) Clinic Dashboard (for doctors/nurses)"
    echo "2) Patient Portal (for patients)"
    read -p "Select pool (1-2): " pool_choice
    
    if [ "$pool_choice" = "1" ]; then
      POOL_ID=$CLINIC_POOL_ID
      CLIENT_ID=$CLINIC_CLIENT_ID
      USER_TYPE="clinic"
    else
      POOL_ID=$PATIENT_POOL_ID
      CLIENT_ID=$PATIENT_CLIENT_ID
      USER_TYPE="patient"
    fi
    
    echo ""
    read -p "Enter email for new user: " email
    read -p "Enter password (min 8 chars, uppercase, lowercase, number): " -s password
    echo ""
    read -p "Enter name: " name
    
    # Create user
    aws cognito-idp admin-create-user \
      --user-pool-id $POOL_ID \
      --username "$email" \
      --user-attributes Name=email,Value="$email" Name=name,Value="$name" \
      --message-action SUPPRESS \
      --region $AWS_REGION
    
    # Set permanent password
    aws cognito-idp admin-set-user-password \
      --user-pool-id $POOL_ID \
      --username "$email" \
      --password "$password" \
      --permanent \
      --region $AWS_REGION
    
    echo "✅ User created successfully!"
    echo ""
    echo "Login credentials:"
    echo "  Email: $email"
    echo "  Password: [the password you set]"
    echo "  Pool: $USER_TYPE"
    ;;
    
  3)
    echo ""
    echo "🌐 Application URLs and Configuration:"
    echo "======================================"
    echo ""
    echo "Clinic Dashboard:"
    echo "  URL: http://qivr-clinic-dashboard-staging.s3-website-ap-southeast-2.amazonaws.com"
    echo "  User Pool ID: $CLINIC_POOL_ID"
    echo "  Client ID: $CLINIC_CLIENT_ID"
    echo "  Test Users: doctor@test.com, nurse@test.com"
    echo ""
    echo "Patient Portal:"
    echo "  URL: http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com"
    echo "  User Pool ID: $PATIENT_POOL_ID"
    echo "  Client ID: $PATIENT_CLIENT_ID"
    echo "  Test Users: patient@test.com, ollie.bingemann@gmail.com"
    echo ""
    echo "API Endpoint:"
    API_URL=$(aws elasticbeanstalk describe-environments \
      --application-name qivr-api-staging \
      --environment-names qivr-api-staging-prod \
      --query 'Environments[0].CNAME' \
      --output text \
      --region $AWS_REGION 2>/dev/null || echo "Not ready yet")
    
    if [ "$API_URL" != "None" ] && [ "$API_URL" != "Not ready yet" ]; then
      echo "  URL: http://$API_URL"
    else
      echo "  Status: Environment still launching..."
    fi
    ;;
    
  4)
    echo "Exiting..."
    exit 0
    ;;
    
  *)
    echo "Invalid option"
    exit 1
    ;;
esac

echo ""
echo "📝 Quick Test Instructions:"
echo "1. Go to the appropriate URL (Clinic Dashboard or Patient Portal)"
echo "2. Enter the email and password"
echo "3. You should be able to log in successfully"
echo ""
echo "⚠️ Note: If login fails, check that:"
echo "  - The frontend apps are configured with correct Cognito settings"
echo "  - The API endpoint is running and accessible"
echo "  - CORS is properly configured"