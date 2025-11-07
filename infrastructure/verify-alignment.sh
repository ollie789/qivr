#!/bin/bash

echo "🔍 QIVR System Alignment Verification"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

REGION="ap-southeast-2"
ISSUES=0

# 1. Backend Service
echo "1. Backend API Service"
echo "   -------------------"
BACKEND_STATUS=$(aws ecs describe-services --cluster qivr_cluster --services qivr-api --region $REGION --query 'services[0].{Running:runningCount,Desired:desiredCount}' --output json 2>/dev/null)
if [ $? -eq 0 ]; then
  RUNNING=$(echo $BACKEND_STATUS | jq -r '.Running')
  DESIRED=$(echo $BACKEND_STATUS | jq -r '.Desired')
  if [ "$RUNNING" = "$DESIRED" ]; then
    echo -e "   ${GREEN}✅ Running: $RUNNING/$DESIRED tasks${NC}"
  else
    echo -e "   ${RED}❌ Running: $RUNNING/$DESIRED tasks (mismatch)${NC}"
    ISSUES=$((ISSUES+1))
  fi
else
  echo -e "   ${RED}❌ Cannot check backend status${NC}"
  ISSUES=$((ISSUES+1))
fi

# Check if AutoCreateUserMiddleware is present
if grep -q "AutoCreateUserMiddleware" /Users/oliver/Projects/qivr/backend/Qivr.Api/Program.cs; then
  echo -e "   ${GREEN}✅ Auto-user creation middleware enabled${NC}"
else
  echo -e "   ${RED}❌ Auto-user creation middleware missing${NC}"
  ISSUES=$((ISSUES+1))
fi

# Check database connection
if grep -q "qivr-dev-db" /Users/oliver/Projects/qivr/backend/Qivr.Api/appsettings.Production.json; then
  echo -e "   ${GREEN}✅ Connected to qivr-dev-db RDS${NC}"
else
  echo -e "   ${RED}❌ Database connection not configured${NC}"
  ISSUES=$((ISSUES+1))
fi

echo ""

# 2. Frontends
echo "2. Frontend Deployments"
echo "   --------------------"

# Clinic Dashboard
CLINIC_UPDATED=$(aws s3api head-object --bucket qivr-clinic-dashboard-staging --key index.html --query 'LastModified' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
  echo -e "   ${GREEN}✅ Clinic Dashboard: Last updated $CLINIC_UPDATED${NC}"
else
  echo -e "   ${RED}❌ Cannot check clinic dashboard${NC}"
  ISSUES=$((ISSUES+1))
fi

# Patient Portal
PATIENT_UPDATED=$(aws s3api head-object --bucket qivr-patient-portal-staging --key index.html --query 'LastModified' --output text 2>/dev/null)
if [ $? -eq 0 ]; then
  echo -e "   ${GREEN}✅ Patient Portal: Last updated $PATIENT_UPDATED${NC}"
else
  echo -e "   ${RED}❌ Cannot check patient portal${NC}"
  ISSUES=$((ISSUES+1))
fi

# Check API URLs in frontends
if grep -q "qivr-alb-1257648623" /Users/oliver/Projects/qivr/apps/clinic-dashboard/.env.production; then
  echo -e "   ${GREEN}✅ Clinic dashboard points to correct API${NC}"
else
  echo -e "   ${YELLOW}⚠️  Clinic dashboard API URL may be incorrect${NC}"
fi

if grep -q "qivr-alb-1257648623" /Users/oliver/Projects/qivr/apps/patient-portal/.env.production; then
  echo -e "   ${GREEN}✅ Patient portal points to correct API${NC}"
else
  echo -e "   ${YELLOW}⚠️  Patient portal API URL may be incorrect${NC}"
fi

echo ""

# 3. CloudFront
echo "3. CloudFront Distributions"
echo "   ------------------------"

CLINIC_CF_STATUS=$(aws cloudfront get-distribution --id E1S9SAZB57T3C3 --query 'Distribution.Status' --output text 2>/dev/null)
if [ "$CLINIC_CF_STATUS" = "Deployed" ]; then
  echo -e "   ${GREEN}✅ Clinic CloudFront: Deployed${NC}"
  echo "      https://dwmqwnt4dy1td.cloudfront.net"
elif [ "$CLINIC_CF_STATUS" = "InProgress" ]; then
  echo -e "   ${YELLOW}⏳ Clinic CloudFront: Deploying...${NC}"
else
  echo -e "   ${RED}❌ Clinic CloudFront: $CLINIC_CF_STATUS${NC}"
  ISSUES=$((ISSUES+1))
fi

PATIENT_CF_STATUS=$(aws cloudfront get-distribution --id E39OVJDZIZ22QL --query 'Distribution.Status' --output text 2>/dev/null)
if [ "$PATIENT_CF_STATUS" = "Deployed" ]; then
  echo -e "   ${GREEN}✅ Patient CloudFront: Deployed${NC}"
  echo "      https://d1jw6e1qiegavd.cloudfront.net"
elif [ "$PATIENT_CF_STATUS" = "InProgress" ]; then
  echo -e "   ${YELLOW}⏳ Patient CloudFront: Deploying...${NC}"
else
  echo -e "   ${RED}❌ Patient CloudFront: $PATIENT_CF_STATUS${NC}"
  ISSUES=$((ISSUES+1))
fi

echo ""

# 4. Monitoring
echo "4. CloudWatch Monitoring"
echo "   ---------------------"

ALARM_COUNT=$(aws cloudwatch describe-alarms --region $REGION --alarm-name-prefix "qivr-" --query 'length(MetricAlarms)' --output text 2>/dev/null)
if [ "$ALARM_COUNT" -ge 7 ]; then
  echo -e "   ${GREEN}✅ $ALARM_COUNT CloudWatch alarms configured${NC}"
else
  echo -e "   ${YELLOW}⚠️  Only $ALARM_COUNT alarms found (expected 7+)${NC}"
fi

SNS_TOPIC=$(aws sns list-topics --region $REGION --query "Topics[?contains(TopicArn, 'qivr-staging-alerts')].TopicArn | [0]" --output text 2>/dev/null)
if [ -n "$SNS_TOPIC" ] && [ "$SNS_TOPIC" != "None" ]; then
  echo -e "   ${GREEN}✅ SNS alerts configured${NC}"
else
  echo -e "   ${RED}❌ SNS alerts not found${NC}"
  ISSUES=$((ISSUES+1))
fi

echo ""

# 5. Database
echo "5. Database Status"
echo "   ---------------"

DB_STATUS=$(aws rds describe-db-instances --db-instance-identifier qivr-dev-db --region $REGION --query 'DBInstances[0].DBInstanceStatus' --output text 2>/dev/null)
if [ "$DB_STATUS" = "available" ]; then
  echo -e "   ${GREEN}✅ RDS Instance: Available${NC}"
else
  echo -e "   ${RED}❌ RDS Instance: $DB_STATUS${NC}"
  ISSUES=$((ISSUES+1))
fi

echo ""

# Summary
echo "======================================"
if [ $ISSUES -eq 0 ]; then
  echo -e "${GREEN}✅ All systems aligned and operational!${NC}"
  echo ""
  echo "Access URLs:"
  echo "  Clinic (HTTPS): https://dwmqwnt4dy1td.cloudfront.net"
  echo "  Patient (HTTPS): https://d1jw6e1qiegavd.cloudfront.net"
  echo "  API: http://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com"
else
  echo -e "${YELLOW}⚠️  Found $ISSUES issue(s) - review above${NC}"
fi

echo ""
echo "Next steps:"
echo "  1. Wait for CloudFront to finish deploying (~15-20 min)"
echo "  2. Test HTTPS URLs in browser"
echo "  3. Seed sample data: AUTH_TOKEN=<token> node infrastructure/seed-sample-data.mjs"
