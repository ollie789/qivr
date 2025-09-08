#!/bin/bash

# AWS CloudFront Deployment Script for Qivr Healthcare Platform
# This script deploys the CDN infrastructure and syncs assets

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
STACK_NAME="qivr-cdn-stack"
REGION="ap-southeast-2"
ENVIRONMENT="${1:-production}"
S3_BUCKET_NAME="qivr-static-assets-${ENVIRONMENT}"
DOMAIN_NAME="cdn.qivr.health"

echo -e "${GREEN}🚀 Starting CloudFront deployment for Qivr${NC}"
echo -e "Environment: ${YELLOW}${ENVIRONMENT}${NC}"
echo -e "Region: ${YELLOW}${REGION}${NC}"
echo -e "Stack Name: ${YELLOW}${STACK_NAME}${NC}"

# Step 1: Check if certificate exists (for HTTPS)
echo -e "\n${YELLOW}Step 1: Checking ACM certificate...${NC}"
CERT_ARN=$(aws acm list-certificates \
  --region us-east-1 \
  --query "CertificateSummaryList[?DomainName=='${DOMAIN_NAME}' || DomainName=='*.qivr.health'].CertificateArn | [0]" \
  --output text)

if [ "$CERT_ARN" == "None" ] || [ -z "$CERT_ARN" ]; then
  echo -e "${YELLOW}No certificate found. Creating certificate request...${NC}"
  
  # Request certificate
  CERT_ARN=$(aws acm request-certificate \
    --domain-name "*.qivr.health" \
    --subject-alternative-names "qivr.health" \
    --validation-method DNS \
    --region us-east-1 \
    --query CertificateArn \
    --output text)
  
  echo -e "${GREEN}Certificate requested: ${CERT_ARN}${NC}"
  echo -e "${RED}⚠️  Please validate the certificate in AWS Console before continuing${NC}"
  echo "Press Enter to continue after validation..."
  read
else
  echo -e "${GREEN}✓ Certificate found: ${CERT_ARN}${NC}"
fi

# Step 2: Build and optimize images
echo -e "\n${YELLOW}Step 2: Optimizing images...${NC}"
if [ -f "scripts/optimize-images.js" ]; then
  echo "Installing dependencies..."
  npm install sharp glob --save-dev
  
  echo "Running image optimization..."
  node scripts/optimize-images.js
  echo -e "${GREEN}✓ Images optimized${NC}"
else
  echo -e "${YELLOW}⚠️  Image optimization script not found, skipping...${NC}"
fi

# Step 3: Build frontend applications
echo -e "\n${YELLOW}Step 3: Building frontend applications...${NC}"
npm run build
echo -e "${GREEN}✓ Frontend applications built${NC}"

# Step 4: Create/Update CloudFormation stack
echo -e "\n${YELLOW}Step 4: Deploying CloudFormation stack...${NC}"

# Check if stack exists
STACK_EXISTS=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].StackName" \
  --output text 2>/dev/null || echo "NONE")

if [ "$STACK_EXISTS" == "NONE" ]; then
  echo "Creating new stack..."
  aws cloudformation create-stack \
    --stack-name ${STACK_NAME} \
    --template-body file://infrastructure/cloudfront/cloudfront-stack.yaml \
    --parameters \
      ParameterKey=S3BucketName,ParameterValue=${S3_BUCKET_NAME} \
      ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} \
      ParameterKey=CertificateArn,ParameterValue=${CERT_ARN} \
      ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION}
  
  echo "Waiting for stack creation to complete..."
  aws cloudformation wait stack-create-complete \
    --stack-name ${STACK_NAME} \
    --region ${REGION}
else
  echo "Updating existing stack..."
  aws cloudformation update-stack \
    --stack-name ${STACK_NAME} \
    --template-body file://infrastructure/cloudfront/cloudfront-stack.yaml \
    --parameters \
      ParameterKey=S3BucketName,ParameterValue=${S3_BUCKET_NAME} \
      ParameterKey=DomainName,ParameterValue=${DOMAIN_NAME} \
      ParameterKey=CertificateArn,ParameterValue=${CERT_ARN} \
      ParameterKey=Environment,ParameterValue=${ENVIRONMENT} \
    --capabilities CAPABILITY_IAM \
    --region ${REGION} 2>/dev/null || echo "No updates needed"
  
  # Wait only if update was initiated
  if [ $? -eq 0 ]; then
    aws cloudformation wait stack-update-complete \
      --stack-name ${STACK_NAME} \
      --region ${REGION}
  fi
fi

echo -e "${GREEN}✓ CloudFormation stack deployed${NC}"

# Step 5: Get stack outputs
echo -e "\n${YELLOW}Step 5: Getting stack outputs...${NC}"
DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue | [0]" \
  --output text)

DISTRIBUTION_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomainName'].OutputValue | [0]" \
  --output text)

echo -e "${GREEN}Distribution ID: ${DISTRIBUTION_ID}${NC}"
echo -e "${GREEN}Distribution Domain: ${DISTRIBUTION_DOMAIN}${NC}"

# Step 6: Sync assets to S3
echo -e "\n${YELLOW}Step 6: Syncing assets to S3...${NC}"

# Sync patient portal
echo "Syncing patient portal..."
aws s3 sync apps/patient-portal/dist s3://${S3_BUCKET_NAME}/patient-portal/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --region ${REGION}

aws s3 sync apps/patient-portal/dist s3://${S3_BUCKET_NAME}/patient-portal/ \
  --delete \
  --cache-control "no-cache" \
  --include "*.html" \
  --region ${REGION}

# Sync clinic dashboard
echo "Syncing clinic dashboard..."
aws s3 sync apps/clinic-dashboard/dist s3://${S3_BUCKET_NAME}/clinic-dashboard/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --region ${REGION}

aws s3 sync apps/clinic-dashboard/dist s3://${S3_BUCKET_NAME}/clinic-dashboard/ \
  --delete \
  --cache-control "no-cache" \
  --include "*.html" \
  --region ${REGION}

# Sync widget
echo "Syncing widget..."
aws s3 sync apps/widget/dist s3://${S3_BUCKET_NAME}/widget/ \
  --delete \
  --cache-control "public, max-age=31536000" \
  --exclude "*.html" \
  --region ${REGION}

aws s3 sync apps/widget/dist s3://${S3_BUCKET_NAME}/widget/ \
  --delete \
  --cache-control "no-cache" \
  --include "*.html" \
  --region ${REGION}

# Sync optimized images
if [ -d "public/optimized" ]; then
  echo "Syncing optimized images..."
  aws s3 sync public/optimized s3://${S3_BUCKET_NAME}/images/ \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --content-encoding "gzip" \
    --region ${REGION}
fi

echo -e "${GREEN}✓ Assets synced to S3${NC}"

# Step 7: Create CloudFront invalidation
echo -e "\n${YELLOW}Step 7: Creating CloudFront invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text)

echo -e "${GREEN}✓ Invalidation created: ${INVALIDATION_ID}${NC}"

# Step 8: Update DNS (if Route53 is being used)
echo -e "\n${YELLOW}Step 8: Checking DNS configuration...${NC}"
HOSTED_ZONE_ID=$(aws route53 list-hosted-zones-by-name \
  --query "HostedZones[?Name=='qivr.health.'].Id | [0]" \
  --output text)

if [ ! -z "$HOSTED_ZONE_ID" ] && [ "$HOSTED_ZONE_ID" != "None" ]; then
  echo "Updating Route53 DNS..."
  
  cat > /tmp/route53-change.json << EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "${DOMAIN_NAME}",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{
        "Value": "${DISTRIBUTION_DOMAIN}"
      }]
    }
  }]
}
EOF

  aws route53 change-resource-record-sets \
    --hosted-zone-id ${HOSTED_ZONE_ID} \
    --change-batch file:///tmp/route53-change.json
  
  echo -e "${GREEN}✓ DNS updated${NC}"
else
  echo -e "${YELLOW}⚠️  Route53 hosted zone not found. Please update DNS manually:${NC}"
  echo -e "  ${DOMAIN_NAME} -> ${DISTRIBUTION_DOMAIN}"
fi

# Step 9: Output summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ CloudFront Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nDeployment Summary:"
echo -e "  Stack Name: ${STACK_NAME}"
echo -e "  S3 Bucket: ${S3_BUCKET_NAME}"
echo -e "  Distribution ID: ${DISTRIBUTION_ID}"
echo -e "  Distribution Domain: ${DISTRIBUTION_DOMAIN}"
echo -e "  Custom Domain: https://${DOMAIN_NAME}"
echo -e "\nNext Steps:"
echo -e "  1. Verify the certificate is validated (if newly created)"
echo -e "  2. Update DNS if not using Route53"
echo -e "  3. Wait 15-20 minutes for global propagation"
echo -e "  4. Test the CDN endpoints"
echo -e "\nUseful Commands:"
echo -e "  View distribution status:"
echo -e "    aws cloudfront get-distribution --id ${DISTRIBUTION_ID}"
echo -e "  Monitor invalidation:"
echo -e "    aws cloudfront get-invalidation --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID}"
echo -e "  View CloudWatch metrics:"
echo -e "    aws cloudwatch get-metric-statistics --namespace AWS/CloudFront --metric-name Requests --dimensions Name=DistributionId,Value=${DISTRIBUTION_ID} --start-time 2024-01-01T00:00:00Z --end-time 2024-12-31T23:59:59Z --period 86400 --statistics Sum"
