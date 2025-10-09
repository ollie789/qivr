#!/bin/bash

# AWS Staging Deployment Script for Qivr
# This script deploys the full stack to AWS staging environment

set -e

echo "🚀 Starting AWS Staging Deployment..."

# Configuration
export AWS_REGION="ap-southeast-2"
export ENVIRONMENT="staging"
export AWS_ACCOUNT_ID="818084701597"
export ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
export API_IMAGE_NAME="qivr-api"
export API_IMAGE_TAG="${ENVIRONMENT}-$(git rev-parse --short HEAD)"

# S3 Buckets for frontend apps
export CLINIC_BUCKET="qivr-clinic-dashboard-${ENVIRONMENT}"
export PATIENT_BUCKET="qivr-patient-portal-${ENVIRONMENT}"

# CloudFront distributions (will be created/updated)
export CLINIC_DISTRIBUTION_ID=""
export PATIENT_DISTRIBUTION_ID=""

echo "📦 Step 1: Building Backend API Docker Image..."
cd backend

# Create Dockerfile if it doesn't exist
if [ ! -f Dockerfile ]; then
cat > Dockerfile << 'EOF'
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY *.sln ./
COPY Qivr.Api/*.csproj ./Qivr.Api/
COPY Qivr.Core/*.csproj ./Qivr.Core/
COPY Qivr.Infrastructure/*.csproj ./Qivr.Infrastructure/
COPY Qivr.Services/*.csproj ./Qivr.Services/

# Restore dependencies
RUN dotnet restore

# Copy everything else
COPY . .

# Build and publish
WORKDIR /src/Qivr.Api
RUN dotnet publish -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app

# Install PostgreSQL client for migrations
RUN apt-get update && apt-get install -y postgresql-client && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5050/health || exit 1

EXPOSE 5050
ENTRYPOINT ["dotnet", "Qivr.Api.dll"]
EOF
fi

echo "🔐 Step 2: Authenticating with ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Create ECR repository if it doesn't exist
aws ecr describe-repositories --repository-names ${API_IMAGE_NAME} --region ${AWS_REGION} 2>/dev/null || \
  aws ecr create-repository --repository-name ${API_IMAGE_NAME} --region ${AWS_REGION}

echo "🏗️ Step 3: Building and pushing Docker image..."
docker build -t ${API_IMAGE_NAME}:${API_IMAGE_TAG} .
docker tag ${API_IMAGE_NAME}:${API_IMAGE_TAG} ${ECR_REGISTRY}/${API_IMAGE_NAME}:${API_IMAGE_TAG}
docker tag ${API_IMAGE_NAME}:${API_IMAGE_TAG} ${ECR_REGISTRY}/${API_IMAGE_NAME}:${ENVIRONMENT}
docker push ${ECR_REGISTRY}/${API_IMAGE_NAME}:${API_IMAGE_TAG}
docker push ${ECR_REGISTRY}/${API_IMAGE_NAME}:${ENVIRONMENT}

cd ..

echo "📦 Step 4: Building Frontend Applications..."

# Build Clinic Dashboard
echo "Building Clinic Dashboard..."
cd apps/clinic-dashboard

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://api-staging.qivr.health
VITE_COGNITO_REGION=${AWS_REGION}
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_jbutB4tj1
VITE_COGNITO_CLIENT_ID=4l510mm689hhpgr12prbuch2og
VITE_ENABLE_DEV_AUTH=false
EOF

npm install
npm run build

# Create S3 bucket for Clinic Dashboard if it doesn't exist
aws s3api head-bucket --bucket ${CLINIC_BUCKET} 2>/dev/null || \
  aws s3api create-bucket --bucket ${CLINIC_BUCKET} \
    --region ${AWS_REGION} \
    --create-bucket-configuration LocationConstraint=${AWS_REGION}

# Configure bucket for static website hosting
aws s3api put-bucket-website --bucket ${CLINIC_BUCKET} \
  --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'

# Configure bucket policy for public read
aws s3api put-bucket-policy --bucket ${CLINIC_BUCKET} --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'${CLINIC_BUCKET}'/*"
    }
  ]
}'

# Upload to S3
aws s3 sync dist/ s3://${CLINIC_BUCKET}/ --delete

cd ../..

# Build Patient Portal
echo "Building Patient Portal..."
cd apps/patient-portal

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=https://api-staging.qivr.health
VITE_COGNITO_REGION=${AWS_REGION}
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_ZMcriKNGJ
VITE_COGNITO_CLIENT_ID=4kugfmvk56o3otd0grc4gddi8r
VITE_ENABLE_DEV_AUTH=false
EOF

npm install
npm run build

# Create S3 bucket for Patient Portal if it doesn't exist
aws s3api head-bucket --bucket ${PATIENT_BUCKET} 2>/dev/null || \
  aws s3api create-bucket --bucket ${PATIENT_BUCKET} \
    --region ${AWS_REGION} \
    --create-bucket-configuration LocationConstraint=${AWS_REGION}

# Configure bucket for static website hosting
aws s3api put-bucket-website --bucket ${PATIENT_BUCKET} \
  --website-configuration '{"IndexDocument":{"Suffix":"index.html"},"ErrorDocument":{"Key":"index.html"}}'

# Configure bucket policy for public read
aws s3api put-bucket-policy --bucket ${PATIENT_BUCKET} --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'${PATIENT_BUCKET}'/*"
    }
  ]
}'

# Upload to S3
aws s3 sync dist/ s3://${PATIENT_BUCKET}/ --delete

cd ../..

echo "🌐 Step 5: Setting up CloudFront distributions..."

# Create CloudFront distribution for Clinic Dashboard
CLINIC_DIST_CONFIG=$(cat <<EOF
{
  "CallerReference": "qivr-clinic-${ENVIRONMENT}-$(date +%s)",
  "Comment": "Qivr Clinic Dashboard - ${ENVIRONMENT}",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${CLINIC_BUCKET}",
        "DomainName": "${CLINIC_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${CLINIC_BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
EOF
)

echo "${CLINIC_DIST_CONFIG}" > /tmp/clinic-dist-config.json
CLINIC_DISTRIBUTION=$(aws cloudfront create-distribution --distribution-config file:///tmp/clinic-dist-config.json --query 'Distribution.Id' --output text)
echo "Created CloudFront distribution for Clinic Dashboard: ${CLINIC_DISTRIBUTION}"

# Similar for Patient Portal
PATIENT_DIST_CONFIG=$(cat <<EOF
{
  "CallerReference": "qivr-patient-${ENVIRONMENT}-$(date +%s)",
  "Comment": "Qivr Patient Portal - ${ENVIRONMENT}",
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${PATIENT_BUCKET}",
        "DomainName": "${PATIENT_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "http-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${PATIENT_BUCKET}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "Compress": true,
    "MinTTL": 0,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "TrustedSigners": {
      "Enabled": false,
      "Quantity": 0
    }
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "Enabled": true
}
EOF
)

echo "${PATIENT_DIST_CONFIG}" > /tmp/patient-dist-config.json
PATIENT_DISTRIBUTION=$(aws cloudfront create-distribution --distribution-config file:///tmp/patient-dist-config.json --query 'Distribution.Id' --output text)
echo "Created CloudFront distribution for Patient Portal: ${PATIENT_DISTRIBUTION}"

echo "🚀 Step 6: Deploying API to ECS..."

# Update ECS task definition and service via Terraform
cd infrastructure/terraform

# Create terraform.tfvars for staging
cat > terraform.tfvars << EOF
environment = "staging"
aws_region = "${AWS_REGION}"
api_image = "${ECR_REGISTRY}/${API_IMAGE_NAME}:${ENVIRONMENT}"
database_url = "Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=;SslMode=Require"
cognito_region = "${AWS_REGION}"
cognito_user_pool_id_clinic = "ap-southeast-2_jbutB4tj1"
cognito_client_id_clinic = "4l510mm689hhpgr12prbuch2og"
cognito_user_pool_id_patient = "ap-southeast-2_ZMcriKNGJ"
cognito_client_id_patient = "4kugfmvk56o3otd0grc4gddi8r"
EOF

# Initialize and apply Terraform
terraform init
terraform plan -out=staging.tfplan
terraform apply staging.tfplan

cd ../..

echo "✅ Deployment Complete!"
echo ""
echo "📍 Access your staging environment at:"
echo "  Clinic Dashboard: https://${CLINIC_DISTRIBUTION}.cloudfront.net"
echo "  Patient Portal: https://${PATIENT_DISTRIBUTION}.cloudfront.net"
echo "  API Endpoint: https://api-staging.qivr.health"
echo ""
echo "⚠️  Note: CloudFront distributions may take 15-30 minutes to fully deploy"
echo ""
echo "🔑 Test Credentials:"
echo "  Clinic: clinic@test.com / Test123!"
echo "  Patient: patient@test.com / Test123!"
