#!/bin/bash
set -e

REGION="ap-southeast-2"
CLUSTER="qivr_cluster"
SERVICE="qivr-api"
TASK_FAMILY="qivr-api"

echo "🔍 Checking Redis cluster status..."
REDIS_STATUS=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id qivr-redis \
  --region $REGION \
  --query 'CacheClusters[0].CacheClusterStatus' \
  --output text)

if [ "$REDIS_STATUS" != "available" ]; then
  echo "⏳ Redis cluster is still $REDIS_STATUS. Waiting..."
  aws elasticache wait cache-cluster-available \
    --cache-cluster-id qivr-redis \
    --region $REGION
  echo "✅ Redis cluster is now available!"
fi

echo "📡 Getting Redis endpoint..."
REDIS_ENDPOINT=$(aws elasticache describe-cache-clusters \
  --cache-cluster-id qivr-redis \
  --show-cache-node-info \
  --region $REGION \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address' \
  --output text)

echo "✅ Redis endpoint: $REDIS_ENDPOINT:6379"
echo ""

echo "📥 Fetching current task definition..."
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition $TASK_FAMILY \
  --region $REGION \
  --query 'taskDefinition')

echo "📝 Creating new task definition with Redis..."
NEW_TASK_DEF=$(echo "$TASK_DEF" | jq --arg redis "$REDIS_ENDPOINT:6379" '
  .containerDefinitions[0].environment += [
    {
      "name": "REDIS_CONNECTION_STRING",
      "value": $redis
    },
    {
      "name": "Features__EnableRedisCache",
      "value": "true"
    }
  ] |
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
')

echo "📤 Registering new task definition..."
NEW_REVISION=$(echo "$NEW_TASK_DEF" | aws ecs register-task-definition \
  --region $REGION \
  --cli-input-json file:///dev/stdin \
  --query 'taskDefinition.revision' \
  --output text)

echo "✅ New task definition: $TASK_FAMILY:$NEW_REVISION"
echo ""

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
echo "✅ Deployment complete!"
echo ""
echo "📊 Monitor deployment:"
echo "   aws ecs describe-services --cluster $CLUSTER --services $SERVICE --region $REGION"
echo ""
echo "📋 View logs:"
echo "   aws logs tail /ecs/qivr-api --follow --region $REGION"
echo ""
echo "🔗 Redis endpoint: $REDIS_ENDPOINT:6379"
