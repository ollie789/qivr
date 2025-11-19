#!/bin/bash
set -e

QUEUE_NAME="qivr-ocr-queue"
FUNCTION_NAME="qivr-ocr-processor"
REGION="ap-southeast-2"
ACCOUNT_ID="818084701597"

echo "📬 Creating SQS queue..."

# Create SQS queue
QUEUE_URL=$(aws sqs create-queue \
  --queue-name $QUEUE_NAME \
  --region $REGION \
  --attributes VisibilityTimeout=300,MessageRetentionPeriod=86400 \
  --query QueueUrl --output text 2>/dev/null || \
  aws sqs get-queue-url --queue-name $QUEUE_NAME --region $REGION --query QueueUrl --output text)

echo "Queue URL: $QUEUE_URL"

# Get queue ARN
QUEUE_ARN=$(aws sqs get-queue-attributes \
  --queue-url $QUEUE_URL \
  --attribute-names QueueArn \
  --region $REGION \
  --query Attributes.QueueArn --output text)

echo "Queue ARN: $QUEUE_ARN"

# Add Lambda trigger
echo "🔗 Connecting SQS to Lambda..."

aws lambda create-event-source-mapping \
  --function-name $FUNCTION_NAME \
  --batch-size 10 \
  --event-source-arn $QUEUE_ARN \
  --region $REGION \
  2>/dev/null || echo "Event source mapping already exists"

echo "✅ SQS queue configured and connected to Lambda"
echo ""
echo "Queue URL: $QUEUE_URL"
echo "Update your .NET API with this queue URL in environment variables"
