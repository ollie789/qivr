#!/bin/bash
set -e

echo "🔨 Building QIVR API locally..."

# Login to ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 818084701597.dkr.ecr.ap-southeast-2.amazonaws.com

# Build for AMD64 platform
cd backend
docker buildx build --platform linux/amd64 \
  -t 818084701597.dkr.ecr.ap-southeast-2.amazonaws.com/qivr-api:latest \
  --push .

echo "✅ Image pushed to ECR"

# Force ECS deployment
aws ecs update-service \
  --cluster qivr_cluster \
  --service qivr-api \
  --force-new-deployment \
  --region ap-southeast-2

echo "🚀 ECS deployment triggered"
