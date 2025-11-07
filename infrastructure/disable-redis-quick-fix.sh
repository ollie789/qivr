#!/bin/bash

# Quick fix: Disable Redis caching until ElastiCache is provisioned
# This will use in-memory cache instead

set -e

REGION="ap-southeast-2"
CLUSTER="qivr_cluster"
SERVICE="qivr-api"
TASK_FAMILY="qivr-api"

echo "🔧 Disabling Redis to use in-memory cache..."
echo ""

# Get current task definition
echo "📥 Fetching current task definition..."
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition $TASK_FAMILY \
  --region $REGION \
  --query 'taskDefinition')

# Create new task definition with Redis disabled
echo "📝 Creating new task definition with Redis disabled..."
NEW_TASK_DEF=$(echo "$TASK_DEF" | jq '
  .containerDefinitions[0].environment += [
    {
      "name": "Features__EnableRedisCache",
      "value": "false"
    }
  ] |
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
')

# Register new task definition
echo "📤 Registering new task definition..."
NEW_REVISION=$(echo "$NEW_TASK_DEF" | aws ecs register-task-definition \
  --region $REGION \
  --cli-input-json file:///dev/stdin \
  --query 'taskDefinition.revision' \
  --output text)

echo "✅ New task definition registered: $TASK_FAMILY:$NEW_REVISION"
echo ""

# Update service
echo "🚀 Updating ECS service..."
aws ecs update-service \
  --cluster $CLUSTER \
  --service $SERVICE \
  --task-definition "$TASK_FAMILY:$NEW_REVISION" \
  --force-new-deployment \
  --region $REGION \
  --query 'service.serviceName' \
  --output text

echo ""
echo "✅ Service update initiated!"
echo ""
echo "📊 Monitor deployment:"
echo "   aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION"
echo ""
echo "📋 View logs:"
echo "   aws logs tail /ecs/qivr-api --follow --region $REGION"
echo ""
echo "⚠️  Note: This uses in-memory cache. For production, set up ElastiCache Redis."
