#!/bin/bash
set -e

FUNCTION_NAME="qivr-ocr-processor"
REGION="ap-southeast-2"
ROLE_ARN="arn:aws:iam::818084701597:role/qivr-lambda-ocr-role"

echo "📦 Installing dependencies..."
npm install --production

echo "🗜️  Creating deployment package..."
zip -r function.zip index.mjs node_modules package.json

echo "🚀 Deploying Lambda function..."

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION
else
  echo "Creating new function..."
  aws lambda create-function \
    --function-name $FUNCTION_NAME \
    --runtime nodejs20.x \
    --role $ROLE_ARN \
    --handler index.handler \
    --zip-file fileb://function.zip \
    --timeout 60 \
    --memory-size 512 \
    --region $REGION \
    --environment "Variables={
      AWS_REGION=$REGION,
      DB_HOST=$(aws secretsmanager get-secret-value --secret-id qivr/production/database --region $REGION --query SecretString --output text | jq -r .host),
      DB_PORT=5432,
      DB_NAME=qivr,
      DB_USER=$(aws secretsmanager get-secret-value --secret-id qivr/production/database --region $REGION --query SecretString --output text | jq -r .username),
      DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id qivr/production/database --region $REGION --query SecretString --output text | jq -r .password)
    }"
fi

echo "✅ Lambda function deployed successfully!"
echo "Function ARN: $(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query Configuration.FunctionArn --output text)"

# Clean up
rm function.zip

echo ""
echo "Next steps:"
echo "1. Create IAM role with Textract, S3, and RDS permissions"
echo "2. Configure SQS trigger for the Lambda function"
echo "3. Test with: aws lambda invoke --function-name $FUNCTION_NAME --region $REGION output.json"
