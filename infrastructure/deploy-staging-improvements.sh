#!/bin/bash
set -e

echo "🚀 Deploying QIVR Staging Improvements"
echo "======================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "infrastructure/terraform" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

cd infrastructure/terraform

echo -e "${YELLOW}Step 1: Initializing Terraform${NC}"
terraform init

echo ""
echo -e "${YELLOW}Step 2: Planning infrastructure changes${NC}"
terraform plan -var-file=staging-improvements.tfvars -target=module.staging_improvements -out=tfplan

echo ""
echo -e "${YELLOW}Step 3: Review the plan above${NC}"
read -p "Do you want to apply these changes? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Step 4: Applying Terraform changes${NC}"
terraform apply tfplan

echo ""
echo -e "${GREEN}✅ Infrastructure deployed successfully!${NC}"
echo ""

# Get outputs
CLINIC_CF_URL=$(terraform output -raw clinic_dashboard_cloudfront_url 2>/dev/null || echo "N/A")
PATIENT_CF_URL=$(terraform output -raw patient_portal_cloudfront_url 2>/dev/null || echo "N/A")
CLINIC_CF_ID=$(terraform output -raw clinic_dashboard_cloudfront_id 2>/dev/null || echo "N/A")
PATIENT_CF_ID=$(terraform output -raw patient_portal_cloudfront_id 2>/dev/null || echo "N/A")

echo "📊 Deployment Summary"
echo "===================="
echo ""
echo "CloudFront URLs:"
echo "  Clinic Dashboard: $CLINIC_CF_URL"
echo "  Patient Portal:   $PATIENT_CF_URL"
echo ""
echo "CloudFront Distribution IDs:"
echo "  Clinic:  $CLINIC_CF_ID"
echo "  Patient: $PATIENT_CF_ID"
echo ""
echo -e "${YELLOW}Note: CloudFront distributions take 15-20 minutes to fully deploy${NC}"
echo ""

echo -e "${YELLOW}Step 5: Updating frontend environment variables${NC}"
cd ../..

# Update clinic dashboard API URL to use CloudFront (if custom domain configured)
echo "Update apps/clinic-dashboard/.env.production with CloudFront URL if needed"
echo "Update apps/patient-portal/.env.production with CloudFront URL if needed"

echo ""
echo -e "${GREEN}✅ All improvements deployed!${NC}"
echo ""
echo "Next steps:"
echo "1. Wait for CloudFront distributions to deploy (~15-20 min)"
echo "2. Test HTTPS access to frontends"
echo "3. Verify CloudWatch alarms in AWS Console"
echo "4. Check email for SNS subscription confirmation"
echo "5. Run seed data script to populate sample data"
echo ""
echo "To seed sample data:"
echo "  cd database"
echo "  psql <connection-string> -f seed-sample-data.sql"
