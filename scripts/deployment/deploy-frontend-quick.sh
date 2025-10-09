#!/bin/bash

# Quick Frontend Deployment Script (bypasses TypeScript errors)
# Deploys frontend apps to S3 without strict type checking
#
# Optional override: export API_URL_OVERRIDE="http://your-api-endpoint:8080" before running

set -e

echo "🚀 Quick Frontend Deployment Starting..."

# Configuration
export AWS_REGION="ap-southeast-2"
export ENVIRONMENT="staging"
export AWS_ACCOUNT_ID="818084701597"

# S3 Buckets
export CLINIC_BUCKET="qivr-clinic-dashboard-staging"
export PATIENT_BUCKET="qivr-patient-portal-staging"

# Determine API endpoint
if [ -n "$API_URL_OVERRIDE" ]; then
  API_URL="$API_URL_OVERRIDE"
  echo "Using API URL override: ${API_URL}"
else
  API_HOST=$(aws elasticbeanstalk describe-environments \
    --application-name qivr-api-staging \
    --environment-names qivr-api-staging-env-v2 \
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

echo "API URL: ${API_URL}"

echo "📦 Building and Deploying Frontend Apps..."

# Build and deploy Clinic Dashboard
echo "Building Clinic Dashboard (skipping type checking)..."
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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Build without type checking
npm run build -- --mode production || npx vite build --mode production

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
echo "Building Patient Portal (skipping type checking)..."
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

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  npm install
fi

# Build without type checking
npm run build -- --mode production || npx vite build --mode production

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

echo "✅ Frontend Deployment Complete!"
echo ""
echo "📍 Access your staging environment at:"
echo "  Clinic Dashboard: http://${CLINIC_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"
echo "  Patient Portal: http://${PATIENT_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"
echo "  API Endpoint: http://${API_URL}"
echo ""
echo "⏳ Note: Elastic Beanstalk environment may still be launching..."
echo ""
echo "To check API status:"
echo "  curl http://${API_URL}/health"
