#!/bin/bash

# Quick AWS Staging Deployment Script
# Deploys frontend apps to S3 and backend to Elastic Beanstalk

set -e

echo "🚀 Quick Staging Deployment Starting..."

# Configuration
export AWS_REGION="ap-southeast-2"
export ENVIRONMENT="staging"
export AWS_ACCOUNT_ID="818084701597"

# S3 Buckets
export CLINIC_BUCKET="qivr-clinic-dashboard-staging"
export PATIENT_BUCKET="qivr-patient-portal-staging"

echo "📦 Step 1: Preparing Backend API..."
cd ${PWD}/backend

# Create appsettings.Production.json with RDS connection
cat > Qivr.Api/appsettings.Production.json << 'EOF'
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=;SslMode=Require"
  },
  "UseJwtAuth": false,
  "UseMockAuth": false,
  "DevAuth": {
    "Enabled": false
  },
  "Cognito": {
    "Region": "ap-southeast-2",
    "UserPoolId": "ap-southeast-2_jbutB4tj1",
    "UserPoolClientId": "4l510mm689hhpgr12prbuch2og"
  },
  "AWS": {
    "Cognito": {
      "PatientPool": {
        "Region": "ap-southeast-2",
        "UserPoolId": "ap-southeast-2_ZMcriKNGJ",
        "ClientId": "4kugfmvk56o3otd0grc4gddi8r"
      },
      "ClinicPool": {
        "Region": "ap-southeast-2",
        "UserPoolId": "ap-southeast-2_jbutB4tj1",
        "ClientId": "4l510mm689hhpgr12prbuch2og"
      }
    }
  },
  "Cors": {
    "AllowedOrigins": [
      "http://qivr-clinic-dashboard-staging.s3-website-ap-southeast-2.amazonaws.com",
      "http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com",
      "https://d1234567890.cloudfront.net",
      "https://d0987654321.cloudfront.net"
    ]
  },
  "Security": {
    "DefaultTenantId": "b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
  }
}
EOF

# Create deployment package for Elastic Beanstalk
echo "Building API..."
dotnet publish Qivr.Api -c Release -o ./publish
cd publish
zip -r ../../api-staging.zip .
cd /Users/oliver/Projects/qivr

echo "📦 Step 2: Deploying Backend to Elastic Beanstalk..."

# Check if EB application exists
aws elasticbeanstalk describe-applications --application-names qivr-api-staging --region ${AWS_REGION} 2>/dev/null || \
  aws elasticbeanstalk create-application --application-name qivr-api-staging --region ${AWS_REGION}

# Generate timestamp once for consistency
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
S3_KEY="api-staging-${TIMESTAMP}.zip"
VERSION_LABEL="v-${TIMESTAMP}"

# Upload deployment package to S3
aws s3 mb s3://qivr-eb-deployments-${AWS_ACCOUNT_ID} --region ${AWS_REGION} 2>/dev/null || true
aws s3 cp api-staging.zip s3://qivr-eb-deployments-${AWS_ACCOUNT_ID}/${S3_KEY}

# Create application version
aws elasticbeanstalk create-application-version \
  --application-name qivr-api-staging \
  --version-label ${VERSION_LABEL} \
  --source-bundle S3Bucket=qivr-eb-deployments-${AWS_ACCOUNT_ID},S3Key=${S3_KEY} \
  --region ${AWS_REGION}

# Check if environment exists, create if not
aws elasticbeanstalk describe-environments --application-name qivr-api-staging --environment-names qivr-api-staging-env --region ${AWS_REGION} 2>/dev/null || \
  aws elasticbeanstalk create-environment \
    --application-name qivr-api-staging \
    --environment-name qivr-api-staging-env \
    --solution-stack-name "64bit Amazon Linux 2023 v3.5.5 running .NET 8" \
    --version-label ${VERSION_LABEL} \
    --region ${AWS_REGION} \
    --option-settings \
      Namespace=aws:autoscaling:launchconfiguration,OptionName=InstanceType,Value=t3.small \
      Namespace=aws:elasticbeanstalk:application:environment,OptionName=ASPNETCORE_ENVIRONMENT,Value=Production

# Update environment with new version if it exists
aws elasticbeanstalk update-environment \
  --application-name qivr-api-staging \
  --environment-name qivr-api-staging-env \
  --version-label ${VERSION_LABEL} \
  --region ${AWS_REGION} 2>/dev/null || true

# Determine API endpoint
if [ -n "$API_URL_OVERRIDE" ]; then
  API_URL="$API_URL_OVERRIDE"
  echo "Using API URL override: ${API_URL}"
else
  API_HOST=$(aws elasticbeanstalk describe-environments \
    --application-name qivr-api-staging \
    --environment-names qivr-api-staging-env \
    --query 'Environments[0].CNAME' \
    --output text \
    --region ${AWS_REGION} 2>/dev/null || echo "")

  if [ -n "$API_HOST" ] && [ "$API_HOST" != "None" ]; then
    API_URL="http://${API_HOST}"
  else
    echo "⚠️  Warning: Elastic Beanstalk endpoint unavailable. Falling back to manual override."
    API_URL="http://3.25.217.124:8080"
  fi
fi

echo "API will be available at: ${API_URL}"

echo "📦 Step 3: Building and Deploying Frontend Apps..."

# Build and deploy Clinic Dashboard
echo "Building Clinic Dashboard..."
cd apps/clinic-dashboard

cat > .env.production << EOF
VITE_API_URL=${API_URL}
VITE_COGNITO_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_jbutB4tj1
VITE_COGNITO_CLIENT_ID=4l510mm689hhpgr12prbuch2og
VITE_ENABLE_DEV_AUTH=false
VITE_USE_AUTH_PROXY=false
VITE_REQUIRE_AUTH=true
EOF

npm install
npm run build

# Create and configure S3 bucket
aws s3api head-bucket --bucket ${CLINIC_BUCKET} 2>/dev/null || {
  aws s3api create-bucket --bucket ${CLINIC_BUCKET} \
    --region ${AWS_REGION} \
    --create-bucket-configuration LocationConstraint=${AWS_REGION}
  
  aws s3api put-bucket-website --bucket ${CLINIC_BUCKET} \
    --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'
  
  aws s3api put-public-access-block --bucket ${CLINIC_BUCKET} \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
  
  aws s3api put-bucket-policy --bucket ${CLINIC_BUCKET} --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${CLINIC_BUCKET}/*\"
    }]
  }"
}

aws s3 sync dist/ s3://${CLINIC_BUCKET}/ --delete

cd ../..

# Build and deploy Patient Portal
echo "Building Patient Portal..."
cd apps/patient-portal

cat > .env.production << EOF
VITE_API_URL=${API_URL}
VITE_COGNITO_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_ZMcriKNGJ
VITE_COGNITO_CLIENT_ID=4kugfmvk56o3otd0grc4gddi8r
VITE_ENABLE_DEV_AUTH=false
VITE_USE_AUTH_PROXY=false
VITE_REQUIRE_AUTH=true
EOF

npm install
npm run build

# Create and configure S3 bucket
aws s3api head-bucket --bucket ${PATIENT_BUCKET} 2>/dev/null || {
  aws s3api create-bucket --bucket ${PATIENT_BUCKET} \
    --region ${AWS_REGION} \
    --create-bucket-configuration LocationConstraint=${AWS_REGION}
  
  aws s3api put-bucket-website --bucket ${PATIENT_BUCKET} \
    --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'
  
  aws s3api put-public-access-block --bucket ${PATIENT_BUCKET} \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
  
  aws s3api put-bucket-policy --bucket ${PATIENT_BUCKET} --policy "{
    \"Version\": \"2012-10-17\",
    \"Statement\": [{
      \"Sid\": \"PublicReadGetObject\",
      \"Effect\": \"Allow\",
      \"Principal\": \"*\",
      \"Action\": \"s3:GetObject\",
      \"Resource\": \"arn:aws:s3:::${PATIENT_BUCKET}/*\"
    }]
  }"
}

aws s3 sync dist/ s3://${PATIENT_BUCKET}/ --delete

cd ../..

echo "✅ Deployment Complete!"
echo ""
echo "📍 Access your staging environment at:"
echo "  Clinic Dashboard: http://${CLINIC_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"
echo "  Patient Portal: http://${PATIENT_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"
echo "  API Endpoint: http://${API_URL}"
echo ""
echo "⏳ Note: Elastic Beanstalk environment may take 5-10 minutes to be ready"
echo ""
echo "🔑 Next Steps:"
echo "1. Wait for Elastic Beanstalk environment to be ready (check AWS Console)"
echo "2. Run database migrations if needed"
echo "3. Create test users in Cognito or use existing ones"
echo ""
echo "To check API status:"
echo "  curl http://${API_URL}/health"
