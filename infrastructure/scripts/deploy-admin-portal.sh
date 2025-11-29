#!/bin/bash
set -e

# Deploy Admin Portal to S3 + CloudFront
# Usage: ./deploy-admin-portal.sh

REGION="ap-southeast-2"
BUCKET_NAME="qivr-admin-portal"
DISTRIBUTION_ID="E30RX4A147QBCE" # admin.qivr.pro

echo "🚀 Deploying QIVR Admin Portal..."

# Build the app
echo "📦 Building admin portal..."
cd "$(dirname "$0")/../../apps/admin-portal"
npm run build

# Check if S3 bucket exists, create if not
if ! aws s3api head-bucket --bucket "$BUCKET_NAME" 2>/dev/null; then
    echo "📁 Creating S3 bucket: $BUCKET_NAME"
    aws s3api create-bucket \
        --bucket "$BUCKET_NAME" \
        --region "$REGION" \
        --create-bucket-configuration LocationConstraint="$REGION"
    
    # Block public access (CloudFront will serve)
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"
    
    # Enable versioning
    aws s3api put-bucket-versioning \
        --bucket "$BUCKET_NAME" \
        --versioning-configuration Status=Enabled
fi

# Sync build to S3
echo "☁️ Uploading to S3..."
aws s3 sync dist/ "s3://$BUCKET_NAME/" \
    --delete \
    --cache-control "public, max-age=31536000" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload index.html with no-cache
aws s3 cp dist/index.html "s3://$BUCKET_NAME/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Check if CloudFront distribution exists
if [ -z "$DISTRIBUTION_ID" ]; then
    echo "⚠️  No CloudFront distribution ID set."
    echo "   Create one manually or update this script with the ID."
    echo ""
    echo "   To create CloudFront distribution:"
    echo "   1. Go to AWS Console > CloudFront"
    echo "   2. Create distribution with origin: $BUCKET_NAME.s3.$REGION.amazonaws.com"
    echo "   3. Set default root object: index.html"
    echo "   4. Add custom error response: 403/404 -> /index.html (200)"
    echo "   5. Add alternate domain: admin.qivr.pro"
    echo "   6. Attach SSL certificate for qivr.pro"
    echo ""
    echo "   Then update DISTRIBUTION_ID in this script."
else
    echo "🔄 Invalidating CloudFront cache..."
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*"
fi

echo "✅ Admin portal deployed!"
echo "   S3: s3://$BUCKET_NAME"
[ -n "$DISTRIBUTION_ID" ] && echo "   CloudFront: $DISTRIBUTION_ID"
