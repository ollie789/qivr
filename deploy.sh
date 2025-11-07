#!/bin/bash
set -e

echo "🚀 QIVR Deployment Script"
echo "========================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="ap-southeast-2"
ECR_REGISTRY="818084701597.dkr.ecr.ap-southeast-2.amazonaws.com"
CLUSTER_NAME="qivr_cluster"
SERVICE_NAME="qivr-api"

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

# Deploy Backend
if [ "$DEPLOY_BACKEND" = true ]; then
  echo -e "${YELLOW}📦 Building and deploying backend...${NC}"
  
  cd backend
  
  # Build and publish .NET app
  echo "Building .NET application..."
  dotnet publish -c Release -o publish
  
  # Build Docker image
  echo "Building Docker image..."
  IMAGE_TAG=$(date +%Y%m%d%H%M%S)
  docker build -t $ECR_REGISTRY/qivr-api:$IMAGE_TAG .
  docker tag $ECR_REGISTRY/qivr-api:$IMAGE_TAG $ECR_REGISTRY/qivr-api:latest
  
  # Push to ECR
  echo "Pushing to ECR..."
  aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
  docker push $ECR_REGISTRY/qivr-api:$IMAGE_TAG
  docker push $ECR_REGISTRY/qivr-api:latest
  
  # Update ECS service
  echo "Updating ECS service..."
  aws ecs update-service \
    --cluster $CLUSTER_NAME \
    --service $SERVICE_NAME \
    --force-new-deployment \
    --region $AWS_REGION
  
  cd ..
  echo -e "${GREEN}✅ Backend deployment initiated${NC}"
fi

# Deploy Frontend
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
  
  cd ../..
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
echo "   ECS Service: aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $AWS_REGION"
echo "   CloudFront: Check invalidation status in AWS Console"
