#!/bin/bash
set -e

FUNCTION_NAME="qivr-ocr-processor"
REGION="ap-southeast-2"
ROLE_ARN="arn:aws:iam::818084701597:role/qivr-lambda-ocr-role"

echo "📦 Installing dependencies..."
npm install --omit=dev

echo "🗜️  Creating deployment package..."
zip -r function.zip index.mjs node_modules package.json

echo "🚀 Deploying Lambda function..."

# Get database credentials
DB_SECRET=$(aws secretsmanager get-secret-value --secret-id qivr/production/database --region $REGION --query SecretString --output text)
DB_HOST=$(echo $DB_SECRET | jq -r .host)
DB_USER=$(echo $DB_SECRET | jq -r .username)
DB_PASSWORD=$(echo $DB_SECRET | jq -r .password)

# Check if function exists
if aws lambda get-function --function-name $FUNCTION_NAME --region $REGION 2>/dev/null; then
  echo "Updating existing function..."
  aws lambda update-function-code \
    --function-name $FUNCTION_NAME \
    --zip-file fileb://function.zip \
    --region $REGION
    
  # Update environment variables
  aws lambda update-function-configuration \
    --function-name $FUNCTION_NAME \
    --environment "Variables={
      DB_HOST=$DB_HOST,
      DB_PORT=5432,
      DB_NAME=qivr,
      DB_USER=$DB_USER,
      DB_PASSWORD=$DB_PASSWORD
    }" \
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
      DB_HOST=$DB_HOST,
      DB_PORT=5432,
      DB_NAME=qivr,
      DB_USER=$DB_USER,
      DB_PASSWORD=$DB_PASSWORD
    }"
fi

echo "✅ Lambda function deployed successfully!"
echo "Function ARN: $(aws lambda get-function --function-name $FUNCTION_NAME --region $REGION --query Configuration.FunctionArn --output text)"

# Clean up
rm function.zip

echo ""
echo "Next steps:"
echo "1. Configure SQS trigger for the Lambda function"
echo "2. Test with: aws lambda invoke --function-name $FUNCTION_NAME --region $REGION output.json"
