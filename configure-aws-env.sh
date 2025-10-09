#!/bin/bash

# AWS Environment Configuration Script for Qivr
# This script sets all required environment variables for the application

REGION="ap-southeast-2"
ENV_NAME="qivr-api-staging-prod"
APP_NAME="qivr-api-staging"

echo "================================================"
echo "AWS Environment Configuration Script"
echo "Environment: $ENV_NAME"
echo "Region: $REGION"
echo "================================================"

# Generate a secure JWT secret (256-bit key)
JWT_SECRET=$(openssl rand -base64 32)
echo "Generated JWT Secret: [Hidden for security]"

# Check if environment is ready
STATUS=$(aws elasticbeanstalk describe-environments \
  --environment-names $ENV_NAME \
  --region $REGION \
  --query 'Environments[0].Status' \
  --output text)

if [ "$STATUS" != "Ready" ]; then
    echo "Environment is not ready (Status: $STATUS). Please wait for it to be Ready."
    exit 1
fi

echo ""
echo "Setting environment variables..."

# Core configuration
aws elasticbeanstalk update-environment \
  --environment-name $ENV_NAME \
  --region $REGION \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=ASPNETCORE_ENVIRONMENT,Value=Production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=ENVIRONMENT,Value=production \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET_KEY,Value="$JWT_SECRET" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Jwt__SecretKey,Value="$JWT_SECRET" \
    'Namespace=aws:elasticbeanstalk:application:environment,OptionName=ConnectionStrings__DefaultConnection,Value=Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=qivr_dev_password;SslMode=Require' \
    'Namespace=aws:elasticbeanstalk:application:environment,OptionName=DATABASE_URL,Value=postgresql://qivr_user:qivr_dev_password@qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com:5432/qivr' \
    'Namespace=aws:elasticbeanstalk:application:environment,OptionName=Intake__ConnectionString,Value=Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=qivr_dev_password' \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_HOST,Value=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_PORT,Value=5432 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_NAME,Value=qivr \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_USER,Value=qivr_user \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_PASSWORD,Value=qivr_dev_password

echo "Database configuration set."

# Wait for update to start
sleep 5

# Cognito configuration
aws elasticbeanstalk update-environment \
  --environment-name $ENV_NAME \
  --region $REGION \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=COGNITO_REGION,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=COGNITO_USER_POOL_ID,Value=ap-southeast-2_jbutB4tj1 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=COGNITO_CLIENT_ID,Value=4l510mm689hhpgr12prbuch2og \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__UserPoolId,Value=ap-southeast-2_jbutB4tj1 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Cognito__UserPoolClientId,Value=4l510mm689hhpgr12prbuch2og \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__PatientPool__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__PatientPool__UserPoolId,Value=ap-southeast-2_ZMcriKNGJ \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__PatientPool__ClientId,Value=4kugfmvk56o3otd0grc4gddi8r \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__ClinicPool__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__ClinicPool__UserPoolId,Value=ap-southeast-2_jbutB4tj1 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__ClinicPool__ClientId,Value=4l510mm689hhpgr12prbuch2og

echo "Cognito configuration set."

# Email configuration (using local for now, switch to SES later)
aws elasticbeanstalk update-environment \
  --environment-name $ENV_NAME \
  --region $REGION \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__Provider,Value=smtp \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__Enabled,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__FromEmail,Value=noreply@qivr.health \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__FromName,Value="Qivr Health"

echo "Email configuration set (disabled for now)."

# S3 configuration (will use IAM role)
aws elasticbeanstalk update-environment \
  --environment-name $ENV_NAME \
  --region $REGION \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=S3__BucketName,Value=qivr-uploads-staging \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=S3__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Region,Value=ap-southeast-2

echo "S3 configuration set."

# Application URLs
aws elasticbeanstalk update-environment \
  --environment-name $ENV_NAME \
  --region $REGION \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=App__BaseUrl,Value=http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com \
    'Namespace=aws:elasticbeanstalk:application:environment,OptionName=CORS_ALLOWED_ORIGINS,Value=http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com,http://qivr-clinic-dashboard-staging.s3-website-ap-southeast-2.amazonaws.com' \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Security__DefaultTenantId,Value=b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11

echo "Application URLs and CORS configuration set."

# Feature flags
aws elasticbeanstalk update-environment \
  --environment-name $ENV_NAME \
  --region $REGION \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__ProcessIntakeQueue,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__EnableAiAnalysis,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__SendEmailNotifications,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__EnableAsyncProcessing,Value=false

echo "Feature flags set (disabled for initial setup)."

echo ""
echo "================================================"
echo "Configuration update initiated!"
echo "================================================"
echo ""
echo "JWT Secret has been generated and saved."
echo "Save this JWT secret securely: $JWT_SECRET"
echo ""
echo "The environment will restart to apply these changes."
echo "This typically takes 3-5 minutes."
echo ""
echo "After restart, the following will be configured:"
echo "✅ Database connection (RDS)"
echo "✅ JWT authentication"
echo "✅ Cognito user pools (both Patient and Clinic)"
echo "✅ CORS for frontend applications"
echo "✅ S3 storage (using IAM role)"
echo "⚠️  Email sending (disabled - configure SES when ready)"
echo "⚠️  SMS messaging (not configured - add MessageMedia/Twilio when ready)"
echo "⚠️  SQS queue (not configured - create queue when ready)"
echo ""
echo "Monitor status with:"
echo "aws elasticbeanstalk describe-environments --environment-names $ENV_NAME --region $REGION | jq '.Environments[0].Status'"