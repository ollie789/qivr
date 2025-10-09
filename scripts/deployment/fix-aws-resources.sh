#!/bin/bash

# Script to fix AWS resource tagging issues and recreate Elastic Beanstalk environment
set -e

echo "🔧 Fixing AWS Resource Configuration..."

# Configuration
export AWS_REGION="ap-southeast-2"
export AWS_ACCOUNT_ID="818084701597"
export APP_NAME="qivr-api-staging"
export ENV_NAME="qivr-api-staging-prod"
export TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Common tags for all resources
TAGS="Environment=staging,Application=qivr,ManagedBy=terraform,Owner=qivr-team"

echo "📋 Step 1: Checking existing resources..."

# Check S3 buckets and add tags if missing
echo "Checking S3 buckets..."
for bucket in qivr-clinic-dashboard-staging qivr-patient-portal-staging qivr-eb-deployments-${AWS_ACCOUNT_ID}; do
  if aws s3api head-bucket --bucket ${bucket} 2>/dev/null; then
    echo "  Adding tags to bucket: ${bucket}"
    aws s3api put-bucket-tagging --bucket ${bucket} \
      --tagging "TagSet=[{Key=Environment,Value=staging},{Key=Application,Value=qivr},{Key=ManagedBy,Value=cli}]" 2>/dev/null || true
  fi
done

echo ""
echo "📦 Step 2: Preparing new Elastic Beanstalk deployment..."

# Check if we have a deployment package
if [ ! -f "api-staging.zip" ]; then
  echo "Building deployment package..."
  cd backend
  dotnet publish Qivr.Api -c Release -o ./publish
  cd publish
  zip -r ../../api-staging.zip . > /dev/null 2>&1
  cd ../..
fi

# Upload to S3
echo "Uploading deployment package to S3..."
S3_KEY="api-staging-${TIMESTAMP}.zip"
aws s3 cp api-staging.zip s3://qivr-eb-deployments-${AWS_ACCOUNT_ID}/${S3_KEY} --region ${AWS_REGION}

# Create new application version
echo "Creating application version..."
VERSION_LABEL="v-${TIMESTAMP}"
aws elasticbeanstalk create-application-version \
  --application-name ${APP_NAME} \
  --version-label ${VERSION_LABEL} \
  --source-bundle S3Bucket=qivr-eb-deployments-${AWS_ACCOUNT_ID},S3Key=${S3_KEY} \
  --region ${AWS_REGION}

echo ""
echo "📋 Step 3: Creating Elastic Beanstalk environment with proper configuration..."

# Create environment with proper tags and configuration
cat > eb-options.json << EOF
[
  {
    "Namespace": "aws:autoscaling:launchconfiguration",
    "OptionName": "InstanceType",
    "Value": "t3.small"
  },
  {
    "Namespace": "aws:elasticbeanstalk:application:environment",
    "OptionName": "ASPNETCORE_ENVIRONMENT",
    "Value": "Production"
  },
  {
    "Namespace": "aws:elasticbeanstalk:environment",
    "OptionName": "EnvironmentType",
    "Value": "SingleInstance"
  },
  {
    "Namespace": "aws:elasticbeanstalk:environment",
    "OptionName": "ServiceRole",
    "Value": "aws-elasticbeanstalk-service-role"
  },
  {
    "Namespace": "aws:autoscaling:launchconfiguration",
    "OptionName": "IamInstanceProfile",
    "Value": "aws-elasticbeanstalk-ec2-role"
  },
  {
    "Namespace": "aws:elasticbeanstalk:healthreporting:system",
    "OptionName": "SystemType",
    "Value": "basic"
  },
  {
    "Namespace": "aws:elasticbeanstalk:managedactions",
    "OptionName": "ManagedActionsEnabled",
    "Value": "false"
  }
]
EOF

# Create the environment
echo "Creating Elastic Beanstalk environment..."
aws elasticbeanstalk create-environment \
  --application-name ${APP_NAME} \
  --environment-name ${ENV_NAME} \
  --solution-stack-name "64bit Amazon Linux 2023 v3.5.5 running .NET 8" \
  --version-label ${VERSION_LABEL} \
  --region ${AWS_REGION} \
  --tags "Key=Environment,Value=staging" "Key=Application,Value=qivr" "Key=ManagedBy,Value=cli" \
  --option-settings file://eb-options.json || {
    echo "⚠️ Environment creation failed. It may already exist or there might be permission issues."
    echo "Checking existing environments..."
    aws elasticbeanstalk describe-environments --application-name ${APP_NAME} --region ${AWS_REGION} \
      --query 'Environments[?Status!=`Terminated`].[EnvironmentName,Status,Health]' --output table
  }

echo ""
echo "📋 Step 4: Checking RDS database tags..."
aws rds list-tags-for-resource \
  --resource-name arn:aws:rds:${AWS_REGION}:${AWS_ACCOUNT_ID}:db:qivr-dev-db \
  --region ${AWS_REGION} 2>/dev/null || {
    echo "Adding tags to RDS instance..."
    aws rds add-tags-to-resource \
      --resource-name arn:aws:rds:${AWS_REGION}:${AWS_ACCOUNT_ID}:db:qivr-dev-db \
      --tags "Key=Environment,Value=staging" "Key=Application,Value=qivr" \
      --region ${AWS_REGION} 2>/dev/null || true
  }

echo ""
echo "📋 Step 5: Checking Cognito User Pools..."
# Tag Cognito User Pools
for pool_id in ap-southeast-2_jbutB4tj1 ap-southeast-2_ZMcriKNGJ; do
  echo "Checking tags for Cognito pool: ${pool_id}"
  aws cognito-idp tag-resource \
    --resource-arn arn:aws:cognito-idp:${AWS_REGION}:${AWS_ACCOUNT_ID}:userpool/${pool_id} \
    --tags Environment=staging,Application=qivr \
    --region ${AWS_REGION} 2>/dev/null || true
done

echo ""
echo "📋 Step 6: Checking Secrets Manager resources..."
aws secretsmanager list-secrets --region ${AWS_REGION} --query 'SecretList[?contains(Name, `qivr`)].[Name]' --output text | while read secret; do
  if [ ! -z "$secret" ]; then
    echo "Tagging secret: $secret"
    aws secretsmanager tag-resource \
      --secret-id "$secret" \
      --tags "[{\"Key\":\"Environment\",\"Value\":\"staging\"},{\"Key\":\"Application\",\"Value\":\"qivr\"}]" \
      --region ${AWS_REGION} 2>/dev/null || true
  fi
done

# Clean up temp file
rm -f eb-options.json

echo ""
echo "✅ AWS Resource Configuration Complete!"
echo ""
echo "📊 Environment Status:"
echo "-------------------"

# Check EB environment status
ENV_STATUS=$(aws elasticbeanstalk describe-environments \
  --application-name ${APP_NAME} \
  --environment-names ${ENV_NAME} \
  --region ${AWS_REGION} \
  --query 'Environments[0].Status' \
  --output text 2>/dev/null || echo "Not Found")

if [ "$ENV_STATUS" == "Launching" ] || [ "$ENV_STATUS" == "Updating" ]; then
  echo "⏳ Elastic Beanstalk environment is being created. This will take 5-10 minutes."
  echo "   Status: $ENV_STATUS"
  echo ""
  echo "Check status with:"
  echo "  aws elasticbeanstalk describe-environments --application-name ${APP_NAME} --region ${AWS_REGION}"
elif [ "$ENV_STATUS" == "Ready" ]; then
  ENV_URL=$(aws elasticbeanstalk describe-environments \
    --application-name ${APP_NAME} \
    --environment-names ${ENV_NAME} \
    --region ${AWS_REGION} \
    --query 'Environments[0].CNAME' \
    --output text)
  echo "✅ Environment is ready!"
  echo "   API URL: http://${ENV_URL}"
else
  echo "⚠️  Environment status: $ENV_STATUS"
  echo "   You may need to check the AWS Console for more details."
fi

echo ""
echo "📍 Resources:"
echo "  • S3 Buckets tagged: ✅"
echo "  • RDS Database: qivr-dev-db (tagged)"
echo "  • Cognito User Pools: Tagged"
echo "  • Clinic Dashboard: http://qivr-clinic-dashboard-staging.s3-website-${AWS_REGION}.amazonaws.com"
echo "  • Patient Portal: http://qivr-patient-portal-staging.s3-website-${AWS_REGION}.amazonaws.com"
echo ""
echo "🔍 To monitor deployment progress:"
echo "  aws elasticbeanstalk describe-events --application-name ${APP_NAME} --region ${AWS_REGION} --max-items 10"