#!/bin/bash
set -e

echo "🚀 Deploying Qivr OCR Processing Pipeline"
echo "=========================================="
echo ""

# Step 1: Setup IAM
echo "Step 1/3: Setting up IAM role and policies..."
./setup-iam.sh
echo ""

# Step 2: Deploy Lambda
echo "Step 2/3: Deploying Lambda function..."
./deploy.sh
echo ""

# Step 3: Setup SQS
echo "Step 3/3: Setting up SQS queue and trigger..."
./setup-sqs.sh
echo ""

echo "=========================================="
echo "✅ OCR Pipeline Deployment Complete!"
echo ""
echo "Test the pipeline:"
echo "1. Upload a document via the API"
echo "2. Check SQS queue for messages"
echo "3. Monitor Lambda logs: aws logs tail /aws/lambda/qivr-ocr-processor --follow"
echo "4. Run test: node scripts/tests/test-ocr-textract.mjs email password"
