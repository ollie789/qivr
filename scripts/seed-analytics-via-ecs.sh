#!/bin/bash
set -e

echo "🌱 Seeding analytics data via ECS task..."

# Get running task ID
TASK_ARN=$(aws ecs list-tasks \
  --cluster qivr_cluster \
  --service-name qivr-api \
  --region ap-southeast-2 \
  --query 'taskArns[0]' \
  --output text)

if [ -z "$TASK_ARN" ] || [ "$TASK_ARN" == "None" ]; then
  echo "❌ No running tasks found"
  exit 1
fi

TASK_ID=$(echo $TASK_ARN | awk -F/ '{print $NF}')
echo "📦 Using task: $TASK_ID"

# Copy SQL file to task
echo "📤 Uploading seed script..."
cat ../database/seed-analytics-data.sql | aws ecs execute-command \
  --cluster qivr_cluster \
  --task $TASK_ID \
  --container qivr-api \
  --region ap-southeast-2 \
  --interactive \
  --command "cat > /tmp/seed.sql"

# Execute SQL
echo "🚀 Executing seed script..."
aws ecs execute-command \
  --cluster qivr_cluster \
  --task $TASK_ID \
  --container qivr-api \
  --region ap-southeast-2 \
  --interactive \
  --command "PGPASSWORD='Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=' psql -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com -U qivr_user -d qivr -f /tmp/seed.sql"

echo "✅ Analytics data seeded successfully!"
