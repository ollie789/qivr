#!/bin/bash
set -e

REGION="ap-southeast-2"
CLUSTER="qivr_cluster"
TASK_DEF="qivr-api:14"
SUBNETS="subnet-035c889ba60bde3f2,subnet-0614b5b30fd21bfe9,subnet-07fb096166e2ac1e7"
SECURITY_GROUP="sg-017f8cb2fa095dcaa"

echo "Running seed script via ECS task..."

TASK_ARN=$(aws ecs run-task \
  --cluster "$CLUSTER" \
  --task-definition "$TASK_DEF" \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "qivr-api",
      "command": [
        "/bin/sh",
        "-c",
        "apt-get update && apt-get install -y postgresql-client && psql \"Host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com;Port=5432;Database=qivr;Username=qivr_user;Password=Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=;SslMode=Require\" -f /app/database/seed-data.sql"
      ]
    }]
  }' \
  --region "$REGION" \
  --query 'tasks[0].taskArn' \
  --output text)

echo "Task started: $TASK_ARN"
echo "Waiting for task to complete..."

aws ecs wait tasks-stopped --cluster "$CLUSTER" --tasks "$TASK_ARN" --region "$REGION"

echo "Task completed. Check logs for results."
