#!/bin/bash

# Qivr Production Deployment Script
# This script orchestrates the complete production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"

echo -e "${BLUE}=====================================${NC}"
echo -e "${BLUE}🚀 Qivr Production Deployment${NC}"
echo -e "${BLUE}=====================================${NC}"

# Function to check prerequisites
check_prerequisites() {
    echo -e "\n${YELLOW}Checking prerequisites...${NC}"
    
    local missing=0
    
    # Check AWS CLI
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}✗ AWS CLI not installed${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ AWS CLI installed${NC}"
    fi
    
    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}✗ Terraform not installed${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ Terraform installed${NC}"
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}✗ Docker not installed${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ Docker installed${NC}"
    fi
    
    # Check .NET SDK
    if ! command -v dotnet &> /dev/null; then
        echo -e "${RED}✗ .NET SDK not installed${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ .NET SDK installed${NC}"
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js not installed${NC}"
        missing=1
    else
        echo -e "${GREEN}✓ Node.js installed${NC}"
    fi
    
    if [ $missing -eq 1 ]; then
        echo -e "\n${RED}Please install missing prerequisites before continuing.${NC}"
        exit 1
    fi
}

# Function to setup AWS infrastructure
setup_infrastructure() {
    echo -e "\n${YELLOW}Setting up AWS infrastructure...${NC}"
    
    cd "$PROJECT_ROOT/infrastructure/terraform"
    
    # Initialize Terraform
    echo -e "${BLUE}Initializing Terraform...${NC}"
    terraform init
    
    # Plan infrastructure
    echo -e "${BLUE}Planning infrastructure changes...${NC}"
    terraform plan -var-file=production.tfvars -out=tfplan
    
    # Ask for confirmation
    echo -e "\n${YELLOW}Review the plan above. Deploy infrastructure? (yes/no)${NC}"
    read -r response
    if [[ "$response" != "yes" ]]; then
        echo -e "${RED}Infrastructure deployment cancelled.${NC}"
        exit 1
    fi
    
    # Apply infrastructure
    echo -e "${BLUE}Applying infrastructure changes...${NC}"
    terraform apply tfplan
    
    echo -e "${GREEN}✓ Infrastructure setup complete${NC}"
}

# Function to setup secrets
setup_secrets() {
    echo -e "\n${YELLOW}Setting up AWS Secrets Manager...${NC}"
    
    cd "$PROJECT_ROOT/infrastructure/scripts"
    
    # Run secrets setup
    ./setup-secrets.sh
    
    echo -e "${GREEN}✓ Secrets configuration complete${NC}"
}

# Function to run database migrations
run_migrations() {
    echo -e "\n${YELLOW}Running database migrations...${NC}"
    
    # Get database connection from Secrets Manager
    DB_SECRET=$(aws secretsmanager get-secret-value \
        --secret-id qivr/production/database/master \
        --query SecretString \
        --output text)
    
    DB_HOST=$(echo $DB_SECRET | jq -r '.host')
    DB_PORT=$(echo $DB_SECRET | jq -r '.port')
    DB_NAME=$(echo $DB_SECRET | jq -r '.dbname')
    DB_USER=$(echo $DB_SECRET | jq -r '.username')
    DB_PASSWORD=$(echo $DB_SECRET | jq -r '.password')
    
    CONNECTION_STRING="Host=$DB_HOST;Port=$DB_PORT;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASSWORD;SslMode=Require"
    
    cd "$PROJECT_ROOT/backend"
    
    # Apply migrations
    dotnet ef database update \
        --project Qivr.Infrastructure \
        --startup-project Qivr.Api \
        --connection "$CONNECTION_STRING"
    
    echo -e "${GREEN}✓ Database migrations complete${NC}"
}

# Function to build and push Docker images
build_and_push_images() {
    echo -e "\n${YELLOW}Building and pushing Docker images...${NC}"
    
    # Get ECR repository URLs
    ECR_REGISTRY=$(aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin)
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    ECR_BASE="$ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com"
    
    # Build and push backend
    echo -e "${BLUE}Building backend API...${NC}"
    cd "$PROJECT_ROOT/backend"
    docker build -t qivr-api:latest -f Dockerfile .
    docker tag qivr-api:latest "$ECR_BASE/qivr-api:latest"
    docker push "$ECR_BASE/qivr-api:latest"
    
    # Build and push patient portal
    echo -e "${BLUE}Building patient portal...${NC}"
    cd "$PROJECT_ROOT/apps/patient-portal"
    docker build -t qivr-patient:latest -f Dockerfile .
    docker tag qivr-patient:latest "$ECR_BASE/qivr-patient:latest"
    docker push "$ECR_BASE/qivr-patient:latest"
    
    # Build and push clinic dashboard
    echo -e "${BLUE}Building clinic dashboard...${NC}"
    cd "$PROJECT_ROOT/apps/clinic-dashboard"
    docker build -t qivr-clinic:latest -f Dockerfile .
    docker tag qivr-clinic:latest "$ECR_BASE/qivr-clinic:latest"
    docker push "$ECR_BASE/qivr-clinic:latest"
    
    echo -e "${GREEN}✓ Docker images built and pushed${NC}"
}

# Function to deploy ECS services
deploy_services() {
    echo -e "\n${YELLOW}Deploying ECS services...${NC}"
    
    # Update backend service
    echo -e "${BLUE}Updating backend API service...${NC}"
    aws ecs update-service \
        --cluster qivr-production \
        --service qivr-api \
        --force-new-deployment \
        --region us-east-1
    
    # Update patient portal service
    echo -e "${BLUE}Updating patient portal service...${NC}"
    aws ecs update-service \
        --cluster qivr-production \
        --service qivr-patient-portal \
        --force-new-deployment \
        --region us-east-1
    
    # Update clinic dashboard service
    echo -e "${BLUE}Updating clinic dashboard service...${NC}"
    aws ecs update-service \
        --cluster qivr-production \
        --service qivr-clinic-dashboard \
        --force-new-deployment \
        --region us-east-1
    
    echo -e "${GREEN}✓ ECS services updated${NC}"
    
    # Wait for services to stabilize
    echo -e "${YELLOW}Waiting for services to stabilize...${NC}"
    aws ecs wait services-stable \
        --cluster qivr-production \
        --services qivr-api qivr-patient-portal qivr-clinic-dashboard \
        --region us-east-1
    
    echo -e "${GREEN}✓ All services are stable${NC}"
}

# Function to run tests
run_tests() {
    echo -e "\n${YELLOW}Running production tests...${NC}"
    
    cd "$PROJECT_ROOT/infrastructure/scripts"
    
    # Run test suite
    ./run-tests.sh
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}Tests failed! Please review before continuing.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All tests passed${NC}"
}

# Function to verify deployment
verify_deployment() {
    echo -e "\n${YELLOW}Verifying deployment...${NC}"
    
    # Check API health
    echo -e "${BLUE}Checking API health...${NC}"
    API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.qivr.health/health)
    if [ "$API_HEALTH" = "200" ]; then
        echo -e "${GREEN}✓ API is healthy${NC}"
    else
        echo -e "${RED}✗ API health check failed (HTTP $API_HEALTH)${NC}"
        exit 1
    fi
    
    # Check patient portal
    echo -e "${BLUE}Checking patient portal...${NC}"
    PATIENT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://app.qivr.health)
    if [ "$PATIENT_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Patient portal is accessible${NC}"
    else
        echo -e "${RED}✗ Patient portal check failed (HTTP $PATIENT_STATUS)${NC}"
        exit 1
    fi
    
    # Check clinic dashboard
    echo -e "${BLUE}Checking clinic dashboard...${NC}"
    CLINIC_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://clinic.qivr.health)
    if [ "$CLINIC_STATUS" = "200" ]; then
        echo -e "${GREEN}✓ Clinic dashboard is accessible${NC}"
    else
        echo -e "${RED}✗ Clinic dashboard check failed (HTTP $CLINIC_STATUS)${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✓ Deployment verification complete${NC}"
}

# Main deployment flow
main() {
    echo -e "${YELLOW}Starting production deployment...${NC}"
    echo -e "${YELLOW}Environment: PRODUCTION${NC}"
    echo -e "${YELLOW}Time: $(date)${NC}"
    
    # Confirm production deployment
    echo -e "\n${RED}⚠️  WARNING: This will deploy to PRODUCTION!${NC}"
    echo -e "${YELLOW}Are you sure you want to continue? (type 'deploy-production' to confirm)${NC}"
    read -r confirmation
    if [[ "$confirmation" != "deploy-production" ]]; then
        echo -e "${RED}Deployment cancelled.${NC}"
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Run tests first
    echo -e "\n${YELLOW}Do you want to run tests before deployment? (yes/no)${NC}"
    read -r run_tests_response
    if [[ "$run_tests_response" == "yes" ]]; then
        run_tests
    fi
    
    # Setup infrastructure
    echo -e "\n${YELLOW}Do you want to setup/update infrastructure? (yes/no)${NC}"
    read -r infra_response
    if [[ "$infra_response" == "yes" ]]; then
        setup_infrastructure
    fi
    
    # Setup secrets
    echo -e "\n${YELLOW}Do you want to setup/update secrets? (yes/no)${NC}"
    read -r secrets_response
    if [[ "$secrets_response" == "yes" ]]; then
        setup_secrets
    fi
    
    # Run migrations
    echo -e "\n${YELLOW}Do you want to run database migrations? (yes/no)${NC}"
    read -r migrations_response
    if [[ "$migrations_response" == "yes" ]]; then
        run_migrations
    fi
    
    # Build and push images
    build_and_push_images
    
    # Deploy services
    deploy_services
    
    # Verify deployment
    verify_deployment
    
    # Success!
    echo -e "\n${GREEN}=====================================${NC}"
    echo -e "${GREEN}🎉 Production Deployment Complete!${NC}"
    echo -e "${GREEN}=====================================${NC}"
    echo -e "${GREEN}Time: $(date)${NC}"
    echo -e "\n${YELLOW}Post-deployment checklist:${NC}"
    echo -e "  1. Monitor CloudWatch logs for errors"
    echo -e "  2. Check application performance metrics"
    echo -e "  3. Verify all features are working"
    echo -e "  4. Update status page if needed"
    echo -e "\n${BLUE}Monitoring links:${NC}"
    echo -e "  - CloudWatch: https://console.aws.amazon.com/cloudwatch"
    echo -e "  - API Health: https://api.qivr.health/health"
    echo -e "  - Patient Portal: https://app.qivr.health"
    echo -e "  - Clinic Dashboard: https://clinic.qivr.health"
}

# Run main function
main "$@"
