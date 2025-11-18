#!/bin/bash
set -e

echo "Installing dependencies..."
npm install

echo "Creating deployment package..."
zip -r function.zip index.mjs node_modules package.json

echo "Deploying Lambda function..."
aws lambda update-function-code \
  --function-name qivr-document-ocr \
  --zip-file fileb://function.zip \
  --region ap-southeast-2

echo "Deployment complete!"
