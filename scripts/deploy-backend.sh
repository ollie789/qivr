#!/bin/bash
# Simple script to trigger CodeBuild deployment
set -e

echo "🚀 Triggering CodeBuild deployment..."

BUILD_ID=$(aws codebuild start-build \
  --project-name qivr-build \
  --region ap-southeast-2 \
  --query 'build.id' \
  --output text)

echo "✅ CodeBuild started: $BUILD_ID"
echo "📊 Monitor at: https://console.aws.amazon.com/codesuite/codebuild/projects/qivr-build/build/$BUILD_ID"
echo "🔍 Or check status with: aws codebuild batch-get-builds --ids $BUILD_ID --region ap-southeast-2"
