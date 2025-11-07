#!/bin/bash

# Update ECS task definition with missing environment variables
# This script adds Redis connection and other required environment variables

set -e

REGION="ap-southeast-2"
TASK_FAMILY="qivr-api"

echo "Fetching current task definition..."
TASK_DEF=$(aws ecs describe-task-definition \
  --task-definition $TASK_FAMILY \
  --region $REGION \
  --query 'taskDefinition' \
  --output json)

echo "Creating new task definition with updated environment variables..."

# Extract the current container definition
CONTAINER_DEF=$(echo $TASK_DEF | jq '.containerDefinitions[0]')

# Add missing environment variables
UPDATED_CONTAINER=$(echo $CONTAINER_DEF | jq '.environment += [
  {
    "name": "REDIS_CONNECTION",
    "value": "localhost:6379"
  },
  {
    "name": "DEFAULT_CONNECTION",
    "value": "Host=$(DB_HOST);Port=$(DB_PORT);Database=$(DB_NAME);Username=$(DB_USERNAME);Password=$(DB_PASSWORD)"
  },
  {
    "name": "INTAKE_CONNECTION",
    "value": "Host=$(DB_HOST);Port=$(DB_PORT);Database=$(DB_NAME);Username=$(DB_USERNAME);Password=$(DB_PASSWORD)"
  }
]')

# Create new task definition JSON
NEW_TASK_DEF=$(echo $TASK_DEF | jq --argjson container "$UPDATED_CONTAINER" '
  .containerDefinitions[0] = $container |
  del(.taskDefinitionArn, .revision, .status, .requiresAttributes, .compatibilities, .registeredAt, .registeredBy)
')

echo "Registering new task definition..."
NEW_REVISION=$(aws ecs register-task-definition \
  --region $REGION \
  --cli-input-json "$NEW_TASK_DEF" \
  --query 'taskDefinition.revision' \
  --output text)

echo "New task definition registered: $TASK_FAMILY:$NEW_REVISION"

echo ""
echo "To update the service, run:"
echo "aws ecs update-service --cluster qivr_cluster --service qivr-api --task-definition $TASK_FAMILY:$NEW_REVISION --region $REGION --force-new-deployment"
