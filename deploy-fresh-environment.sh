#!/bin/bash

# Fresh Deployment Script for Qivr API
# This creates a new, properly configured Elastic Beanstalk environment

REGION="ap-southeast-2"
APP_NAME="qivr-api-staging"
ENV_NAME="qivr-api-production"
VERSION_LABEL="v-20251001-150058"
STACK_NAME="64bit Amazon Linux 2023 v3.5.5 running .NET 8"

echo "================================================"
echo "Fresh Environment Deployment Script"
echo "Application: $APP_NAME"
echo "Environment: $ENV_NAME"
echo "Region: $REGION"
echo "================================================"

# Generate JWT Secret
JWT_SECRET=$(openssl rand -base64 32)
echo ""
echo "Generated JWT Secret: $JWT_SECRET"
echo "IMPORTANT: Save this JWT secret securely!"
echo ""

# Create the environment with all configurations
echo "Creating new environment with complete configuration..."

aws elasticbeanstalk create-environment \
  --application-name $APP_NAME \
  --environment-name $ENV_NAME \
  --solution-stack-name "$STACK_NAME" \
  --version-label $VERSION_LABEL \
  --region $REGION \
  --tags "Key=Project,Value=Qivr" "Key=Environment,Value=Staging" "Key=ManagedBy,Value=Terraform" \
  --option-settings \
    Namespace=aws:elasticbeanstalk:environment,OptionName=ServiceRole,Value=aws-elasticbeanstalk-service-role \
    Namespace=aws:autoscaling:launchconfiguration,OptionName=IamInstanceProfile,Value=aws-elasticbeanstalk-ec2-role \
    Namespace=aws:elasticbeanstalk:environment,OptionName=EnvironmentType,Value=SingleInstance \
    Namespace=aws:ec2:instances,OptionName=InstanceTypes,Value=t3.small \
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
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_PASSWORD,Value=qivr_dev_password \
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
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Cognito__ClinicPool__ClientId,Value=4l510mm689hhpgr12prbuch2og \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__Provider,Value=smtp \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__Enabled,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__FromEmail,Value=noreply@qivr.health \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__FromName,Value="Qivr Health" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=S3__BucketName,Value=qivr-uploads-staging \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=S3__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=AWS__Region,Value=ap-southeast-2 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=App__BaseUrl,Value=http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com \
    'Namespace=aws:elasticbeanstalk:application:environment,OptionName=CORS_ALLOWED_ORIGINS,Value=http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com,http://qivr-clinic-dashboard-staging.s3-website-ap-southeast-2.amazonaws.com' \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Security__DefaultTenantId,Value=b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11 \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__ProcessIntakeQueue,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__EnableAiAnalysis,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__SendEmailNotifications,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Features__EnableAsyncProcessing,Value=false \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=ApplyMigrations,Value=true

echo ""
echo "Environment creation initiated!"
echo ""
echo "================================================"
echo "IMPORTANT: Save these values:"
echo "================================================"
echo "JWT Secret: $JWT_SECRET"
echo "Environment Name: $ENV_NAME"
echo "================================================"
echo ""
echo "The environment will take 5-10 minutes to create."
echo ""
echo "Monitor progress with:"
echo "aws elasticbeanstalk describe-events --application-name $APP_NAME --environment-name $ENV_NAME --region $REGION --max-items 10"
echo ""
echo "Check status with:"
echo "aws elasticbeanstalk describe-environments --environment-names $ENV_NAME --region $REGION | jq '.Environments[0] | {Status, Health, EndpointURL}'"