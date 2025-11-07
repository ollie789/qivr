#!/bin/bash

echo "🔍 QIVR System Status"
echo "===================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

AWS_REGION="ap-southeast-2"

# Check ECS Service
echo -e "${YELLOW}📊 ECS Service Status:${NC}"
aws ecs describe-services \
  --cluster qivr_cluster \
  --services qivr-api \
  --region $AWS_REGION \
  --query 'services[0].{Status:status,Running:runningCount,Desired:desiredCount,TaskDefinition:taskDefinition}' \
  --output table

# Check recent deployments
echo -e "\n${YELLOW}🚀 Recent Deployments:${NC}"
aws ecs describe-services \
  --cluster qivr_cluster \
  --services qivr-api \
  --region $AWS_REGION \
  --query 'services[0].deployments[*].{Status:status,CreatedAt:createdAt,TaskDef:taskDefinition}' \
  --output table

# Check CloudFront distributions
echo -e "\n${YELLOW}☁️  CloudFront Status:${NC}"
echo "Clinic Dashboard (E1S9SAZB57T3C3):"
aws cloudfront get-distribution \
  --id E1S9SAZB57T3C3 \
  --region $AWS_REGION \
  --query 'Distribution.{Status:Status,DomainName:DomainName}' \
  --output table

echo "Patient Portal (E39OVJDZIZ22QL):"
aws cloudfront get-distribution \
  --id E39OVJDZIZ22QL \
  --region $AWS_REGION \
  --query 'Distribution.{Status:Status,DomainName:DomainName}' \
  --output table

# Test endpoints
echo -e "\n${YELLOW}🌐 Endpoint Health:${NC}"

echo -n "Clinic Dashboard: "
if curl -s -f https://dwmqwnt4dy1td.cloudfront.net/ > /dev/null; then
  echo -e "${GREEN}✅ Online${NC}"
else
  echo -e "${RED}❌ Offline${NC}"
fi

echo -n "Patient Portal: "
if curl -s -f https://d1jw6e1qiegavd.cloudfront.net/ > /dev/null; then
  echo -e "${GREEN}✅ Online${NC}"
else
  echo -e "${RED}❌ Offline${NC}"
fi

echo ""
echo "📍 Application URLs:"
echo "   Clinic Dashboard: https://dwmqwnt4dy1td.cloudfront.net"
echo "   Patient Portal:   https://d1jw6e1qiegavd.cloudfront.net"
