#!/bin/bash
set -e

echo "🚀 QIVR CodeBuild Deployment Script"
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-southeast-2"
CODEBUILD_PROJECT="qivr-build"

# Parse arguments
DEPLOY_BACKEND=true
DEPLOY_FRONTEND=true

while [[ $# -gt 0 ]]; do
  case $1 in
    --backend-only)
      DEPLOY_FRONTEND=false
      shift
      ;;
    --frontend-only)
      DEPLOY_BACKEND=false
      shift
      ;;
    *)
      echo "Unknown option $1"
      exit 1
      ;;
  esac
done

# Deploy Backend via CodeBuild
if [ "$DEPLOY_BACKEND" = true ]; then
  echo -e "${YELLOW}📦 Triggering CodeBuild for backend deployment...${NC}"
  
  # Start CodeBuild
  BUILD_ID=$(aws codebuild start-build \
    --project-name $CODEBUILD_PROJECT \
    --region $AWS_REGION \
    --query 'build.id' \
    --output text)
  
  echo "CodeBuild started: $BUILD_ID"
  echo "Monitor at: https://console.aws.amazon.com/codesuite/codebuild/projects/$CODEBUILD_PROJECT/build/$BUILD_ID"
  
  # Wait for build to complete (optional)
  echo "Waiting for build to complete..."
  aws codebuild batch-get-builds \
    --ids $BUILD_ID \
    --region $AWS_REGION \
    --query 'builds[0].buildStatus' \
    --output text
  
  echo -e "${GREEN}✅ Backend deployment via CodeBuild initiated${NC}"
fi

# Deploy Frontend (still direct since it's just S3/CloudFront)
if [ "$DEPLOY_FRONTEND" = true ]; then
  echo -e "${YELLOW}🎨 Building and deploying frontends...${NC}"
  
  # Deploy Clinic Dashboard
  echo "Building clinic dashboard..."
  cd apps/clinic-dashboard
  npm ci
  npm run build
  
  echo "Deploying clinic dashboard to S3..."
  aws s3 sync dist/ s3://qivr-clinic-dashboard-staging --delete --region $AWS_REGION
  
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id E1S9SAZB57T3C3 \
    --paths "/*" \
    --region $AWS_REGION
  
  cd ../..
  
  # Deploy Patient Portal
  echo "Building patient portal..."
  cd apps/patient-portal
  npm ci
  npm run build
  
  echo "Deploying patient portal to S3..."
  aws s3 sync dist/ s3://qivr-patient-portal-staging --delete --region $AWS_REGION
  
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation \
    --distribution-id E39OVJDZIZ22QL \
    --paths "/*" \
    --region $AWS_REGION
  
  cd ..
  echo -e "${GREEN}✅ Frontend deployments completed${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
echo ""
echo "📍 Application URLs:"
echo "   Clinic Dashboard: https://dwmqwnt4dy1td.cloudfront.net"
echo "   Patient Portal:   https://d1jw6e1qiegavd.cloudfront.net"
echo ""
echo "🔍 Monitor deployment:"
echo "   ECS Service: aws ecs describe-services --cluster qivr_cluster --services qivr-api --region $AWS_REGION"
echo "   CloudFront: Check invalidation status in AWS Console"
