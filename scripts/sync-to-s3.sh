#!/bin/bash

# Sync assets to S3 bucket created by CloudFormation
# This script should be run after the CloudFormation stack is created

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

STACK_NAME="qivr-cdn-simple"
REGION="us-east-1"

echo -e "${GREEN}🔄 Syncing assets to S3...${NC}"

# Get stack outputs
echo -e "\n${YELLOW}Getting stack outputs...${NC}"
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue | [0]" \
  --output text)

DISTRIBUTION_ID=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue | [0]" \
  --output text)

DISTRIBUTION_DOMAIN=$(aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${REGION} \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomainName'].OutputValue | [0]" \
  --output text)

echo -e "${GREEN}S3 Bucket: ${BUCKET_NAME}${NC}"
echo -e "${GREEN}Distribution ID: ${DISTRIBUTION_ID}${NC}"
echo -e "${GREEN}Distribution Domain: ${DISTRIBUTION_DOMAIN}${NC}"

# Create test HTML file
echo -e "\n${YELLOW}Creating test index.html...${NC}"
cat > /tmp/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qivr CDN Test</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            margin-bottom: 20px;
        }
        .info {
            background: #f7f9fc;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
        }
        .info h2 {
            margin-top: 0;
            color: #667eea;
        }
        .status {
            display: inline-block;
            padding: 8px 16px;
            background: #10b981;
            color: white;
            border-radius: 20px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        code {
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
        }
        .metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .metric {
            text-align: center;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }
        .metric-label {
            color: #6b7280;
            margin-top: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="status">✅ CDN Active</div>
        <h1>🎉 Qivr CloudFront CDN Successfully Deployed!</h1>
        
        <div class="info">
            <h2>Distribution Information</h2>
            <p><strong>Distribution ID:</strong> <code>${DISTRIBUTION_ID}</code></p>
            <p><strong>Distribution Domain:</strong> <code>https://${DISTRIBUTION_DOMAIN}</code></p>
            <p><strong>S3 Bucket:</strong> <code>${BUCKET_NAME}</code></p>
            <p><strong>Region:</strong> <code>${REGION}</code></p>
            <p><strong>Deployment Time:</strong> <code>$(date)</code></p>
        </div>

        <div class="info">
            <h2>CDN Features</h2>
            <ul>
                <li>✅ HTTPS encryption with TLS 1.2+</li>
                <li>✅ HTTP/2 and HTTP/3 support</li>
                <li>✅ Automatic compression (Gzip/Brotli)</li>
                <li>✅ Global edge locations</li>
                <li>✅ Origin Access Control (OAC)</li>
                <li>✅ Security headers</li>
                <li>✅ CORS support</li>
                <li>✅ SPA routing support</li>
            </ul>
        </div>

        <div class="info">
            <h2>Performance Optimizations</h2>
            <ul>
                <li>🚀 Image optimization (WebP/AVIF support ready)</li>
                <li>🚀 Long-term caching for static assets</li>
                <li>🚀 Automatic minification</li>
                <li>🚀 Edge caching with 99.99% availability</li>
            </ul>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">~50ms</div>
                <div class="metric-label">Average Latency</div>
            </div>
            <div class="metric">
                <div class="metric-value">99.99%</div>
                <div class="metric-label">Availability SLA</div>
            </div>
            <div class="metric">
                <div class="metric-value">450+</div>
                <div class="metric-label">Edge Locations</div>
            </div>
            <div class="metric">
                <div class="metric-value">90+</div>
                <div class="metric-label">Countries</div>
            </div>
        </div>

        <div class="info" style="margin-top: 30px;">
            <h2>Next Steps</h2>
            <ol>
                <li>Upload your application assets to the S3 bucket</li>
                <li>Configure your application to use the CDN URL</li>
                <li>Set up a custom domain (optional)</li>
                <li>Monitor performance in CloudWatch</li>
            </ol>
        </div>
    </div>
</body>
</html>
EOF

# Upload test file
echo -e "\n${YELLOW}Uploading test file to S3...${NC}"
aws s3 cp /tmp/index.html s3://${BUCKET_NAME}/index.html \
  --content-type "text/html" \
  --cache-control "no-cache" \
  --region ${REGION}

# Check if built assets exist
if [ -d "apps/patient-portal/dist" ] || [ -d "apps/clinic-dashboard/dist" ] || [ -d "apps/widget/dist" ]; then
  echo -e "\n${YELLOW}Syncing application assets...${NC}"
  
  # Sync patient portal if it exists
  if [ -d "apps/patient-portal/dist" ]; then
    echo "Syncing patient portal..."
    aws s3 sync apps/patient-portal/dist s3://${BUCKET_NAME}/patient-portal/ \
      --delete \
      --cache-control "public, max-age=31536000" \
      --exclude "*.html" \
      --region ${REGION}
    
    aws s3 sync apps/patient-portal/dist s3://${BUCKET_NAME}/patient-portal/ \
      --delete \
      --cache-control "no-cache" \
      --exclude "*" \
      --include "*.html" \
      --region ${REGION}
  fi
  
  # Sync clinic dashboard if it exists
  if [ -d "apps/clinic-dashboard/dist" ]; then
    echo "Syncing clinic dashboard..."
    aws s3 sync apps/clinic-dashboard/dist s3://${BUCKET_NAME}/clinic-dashboard/ \
      --delete \
      --cache-control "public, max-age=31536000" \
      --exclude "*.html" \
      --region ${REGION}
    
    aws s3 sync apps/clinic-dashboard/dist s3://${BUCKET_NAME}/clinic-dashboard/ \
      --delete \
      --cache-control "no-cache" \
      --exclude "*" \
      --include "*.html" \
      --region ${REGION}
  fi
  
  # Sync widget if it exists  
  if [ -d "apps/widget/dist" ]; then
    echo "Syncing widget..."
    aws s3 sync apps/widget/dist s3://${BUCKET_NAME}/widget/ \
      --delete \
      --cache-control "public, max-age=31536000" \
      --exclude "*.html" \
      --region ${REGION}
    
    aws s3 sync apps/widget/dist s3://${BUCKET_NAME}/widget/ \
      --delete \
      --cache-control "no-cache" \
      --exclude "*" \
      --include "*.html" \
      --region ${REGION}
  fi
else
  echo -e "${YELLOW}No built assets found. Run 'npm run build' first to build the applications.${NC}"
fi

# Create CloudFront invalidation for test file
echo -e "\n${YELLOW}Creating CloudFront invalidation...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id ${DISTRIBUTION_ID} \
  --paths "/index.html" "/*" \
  --query "Invalidation.Id" \
  --output text)

echo -e "${GREEN}✓ Invalidation created: ${INVALIDATION_ID}${NC}"

# Output summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Assets Synced Successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\nYour CDN is now accessible at:"
echo -e "  ${GREEN}https://${DISTRIBUTION_DOMAIN}${NC}"
echo -e "\nApplication endpoints:"
echo -e "  Patient Portal: https://${DISTRIBUTION_DOMAIN}/patient-portal/"
echo -e "  Clinic Dashboard: https://${DISTRIBUTION_DOMAIN}/clinic-dashboard/"
echo -e "  Widget: https://${DISTRIBUTION_DOMAIN}/widget/"
echo -e "\nNote: It may take 5-10 minutes for the CDN to fully propagate globally."
echo -e "\nTo monitor the invalidation status:"
echo -e "  aws cloudfront get-invalidation --distribution-id ${DISTRIBUTION_ID} --id ${INVALIDATION_ID}"
