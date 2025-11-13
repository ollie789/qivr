#!/bin/bash
set -e

BRANCH=$(git branch --show-current | sed 's/\//-/g')
PREVIEW_BUCKET="qivr-preview-${BRANCH}"
AWS_REGION="ap-southeast-2"

echo "🎨 Deploying PREVIEW for branch: $BRANCH"
echo "=========================================="

# Build clinic dashboard
echo "📦 Building clinic dashboard..."
cd apps/clinic-dashboard
npm ci
npm run build:preview

# Create bucket if doesn't exist
echo "🪣 Setting up S3 bucket..."
aws s3 mb s3://$PREVIEW_BUCKET --region $AWS_REGION 2>/dev/null || true

# Enable static website hosting
aws s3 website s3://$PREVIEW_BUCKET \
  --index-document index.html \
  --error-document index.html \
  --region $AWS_REGION

# Deploy
echo "🚀 Deploying to S3..."
aws s3 sync dist/ s3://$PREVIEW_BUCKET --delete --region $AWS_REGION

# Make public
echo "🔓 Making bucket public..."
aws s3api put-bucket-policy --bucket $PREVIEW_BUCKET --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"PublicReadGetObject\",
    \"Effect\": \"Allow\",
    \"Principal\": \"*\",
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::$PREVIEW_BUCKET/*\"
  }]
}" --region $AWS_REGION

PREVIEW_URL="http://$PREVIEW_BUCKET.s3-website-$AWS_REGION.amazonaws.com"

echo ""
echo "✅ PREVIEW DEPLOYED!"
echo "=========================================="
echo "🔗 Preview URL: $PREVIEW_URL"
echo "🌿 Branch: $BRANCH"
echo ""
echo "⚠️  Note: This uses PRODUCTION backend API"
echo "⚠️  To delete: aws s3 rb s3://$PREVIEW_BUCKET --force"
echo ""
