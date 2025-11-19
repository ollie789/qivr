#!/bin/bash
set -e

ROLE_NAME="qivr-lambda-ocr-role"
REGION="ap-southeast-2"
ACCOUNT_ID="818084701597"

echo "🔐 Creating IAM role for Lambda OCR processor..."

# Create trust policy
cat > trust-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name $ROLE_NAME \
  --assume-role-policy-document file://trust-policy.json \
  --description "Role for Qivr OCR Lambda function" \
  2>/dev/null || echo "Role already exists"

# Attach basic Lambda execution policy
aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole

# Create custom policy for Textract, S3, and SQS
cat > lambda-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "textract:DetectDocumentText",
        "textract:AnalyzeDocument"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::qivr-documents-production-$ACCOUNT_ID/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:$REGION:$ACCOUNT_ID:qivr-ocr-queue"
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:$REGION:$ACCOUNT_ID:secret:qivr/production/database*"
    }
  ]
}
EOF

# Create and attach custom policy
POLICY_ARN=$(aws iam create-policy \
  --policy-name qivr-lambda-ocr-policy \
  --policy-document file://lambda-policy.json \
  --query Policy.Arn --output text 2>/dev/null || \
  echo "arn:aws:iam::$ACCOUNT_ID:policy/qivr-lambda-ocr-policy")

aws iam attach-role-policy \
  --role-name $ROLE_NAME \
  --policy-arn $POLICY_ARN

# Clean up
rm trust-policy.json lambda-policy.json

echo "✅ IAM role created: arn:aws:iam::$ACCOUNT_ID:role/$ROLE_NAME"
echo ""
echo "Waiting 10 seconds for IAM propagation..."
sleep 10
