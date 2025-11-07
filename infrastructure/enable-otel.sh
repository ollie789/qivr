#!/bin/bash
set -e

# Enable OpenTelemetry for QIVR API
# This script updates the ECS task definition to include OTEL collector sidecar

CLUSTER_NAME="qivr_cluster"
SERVICE_NAME="qivr-api"
REGION="ap-southeast-2"
TASK_FAMILY="qivr-api"

echo "🔍 Fetching current task definition..."
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition "$TASK_FAMILY" \
  --region "$REGION" \
  --query 'taskDefinition' \
  --output json)

echo "📝 Creating new task definition with OTEL collector..."

# Extract current task definition and add OTEL collector container
NEW_TASK_DEF=$(echo "$TASK_DEF" | jq '
  # Remove fields that cannot be used in registration
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy) |
  
  # Add OTEL collector container
  .containerDefinitions += [{
    "name": "otel-collector",
    "image": "public.ecr.aws/aws-observability/aws-otel-collector:latest",
    "essential": false,
    "cpu": 256,
    "memory": 512,
    "portMappings": [
      {
        "containerPort": 4317,
        "protocol": "tcp"
      }
    ],
    "environment": [
      {
        "name": "AWS_REGION",
        "value": "ap-southeast-2"
      },
      {
        "name": "ENVIRONMENT",
        "value": "production"
      }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/qivr-otel-collector",
        "awslogs-region": "ap-southeast-2",
        "awslogs-stream-prefix": "otel",
        "awslogs-create-group": "true"
      }
    }
  }] |
  
  # Update main container to enable OTEL
  .containerDefinitions |= map(
    if .name == "qivr-api" then
      .environment += [
        {
          "name": "OPENTELEMETRY__ENDPOINT",
          "value": "http://localhost:4317"
        }
      ]
    else
      .
    end
  )
')

echo "📤 Registering new task definition..."
NEW_REVISION=$(echo "$NEW_TASK_DEF" | aws ecs register-task-definition \
  --cli-input-json file:///dev/stdin \
  --region "$REGION" \
  --query 'taskDefinition.revision' \
  --output text)

echo "✅ Registered task definition revision: $NEW_REVISION"

echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --task-definition "${TASK_FAMILY}:${NEW_REVISION}" \
  --force-new-deployment \
  --region "$REGION" \
  --no-cli-pager

echo "✅ Service update initiated"
echo ""
echo "📊 Monitor deployment:"
echo "  aws ecs describe-services --cluster $CLUSTER_NAME --services $SERVICE_NAME --region $REGION"
echo ""
echo "📝 View OTEL collector logs:"
echo "  aws logs tail /ecs/qivr-otel-collector --follow --region $REGION"
echo ""
echo "📈 View traces in CloudWatch:"
echo "  aws logs tail /aws/ecs/qivr-api-traces --follow --region $REGION"
