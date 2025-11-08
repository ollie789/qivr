#!/usr/bin/env bash
set -euo pipefail

# Inspect ECR image manifest to confirm multi-arch support.
# Usage:
#   AWS_ACCOUNT_ID=818084701597 AWS_REGION=ap-southeast-2 TAG=latest ./scripts/docker/inspect-ecr-image.sh

ACCOUNT_ID="${AWS_ACCOUNT_ID:?set AWS_ACCOUNT_ID}"
REGION="${AWS_REGION:-ap-southeast-2}"
REPO="${ECR_REPO:-qivr-api}"
TAG="${TAG:-latest}"

IMAGE="$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO:$TAG"

echo "Inspecting: $IMAGE"

docker buildx imagetools inspect "$IMAGE" | sed -n '1,120p'
