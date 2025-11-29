#!/bin/bash
# Local build script for Mac (handles ARM64 to AMD64 cross-compilation)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔨 Building Qivr API for linux/amd64...${NC}"

cd "$PROJECT_ROOT/backend"

# Ensure buildx is available
docker buildx version > /dev/null 2>&1 || {
    echo -e "${RED}Docker buildx not available. Please update Docker Desktop.${NC}"
    exit 1
}

# Create/use builder that supports multi-platform
docker buildx create --name qivr-builder --use 2>/dev/null || docker buildx use qivr-builder

# Build for linux/amd64 (ECS Fargate architecture)
docker buildx build \
    --platform linux/amd64 \
    --tag qivr-api:local \
    --load \
    .

echo -e "${GREEN}✅ Build complete: qivr-api:local${NC}"
echo ""
echo -e "${YELLOW}To run locally:${NC}"
echo "  docker run -p 8080:8080 --env-file .env qivr-api:local"
echo ""
echo -e "${YELLOW}To push to ECR:${NC}"
echo "  aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 818084701597.dkr.ecr.ap-southeast-2.amazonaws.com"
echo "  docker tag qivr-api:local 818084701597.dkr.ecr.ap-southeast-2.amazonaws.com/qivr-api:latest"
echo "  docker push 818084701597.dkr.ecr.ap-southeast-2.amazonaws.com/qivr-api:latest"
