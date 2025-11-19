#!/bin/bash
set -e

echo "🔄 Applying Database Migrations to Production"
echo "=============================================="
echo ""

# Get VPC and subnet info for ECS task
VPC_ID=$(aws ec2 describe-vpcs --region ap-southeast-2 --filters "Name=tag:Name,Values=qivr-vpc" --query 'Vpcs[0].VpcId' --output text)
SUBNET_ID=$(aws ec2 describe-subnets --region ap-southeast-2 --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[0].SubnetId' --output text)
SECURITY_GROUP=$(aws ec2 describe-security-groups --region ap-southeast-2 --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=*ecs*" --query 'SecurityGroups[0].GroupId' --output text)

echo "📋 Pending Migrations:"
echo "  1. 20251119021937_AddPainAssessmentsAndVitalSigns"
echo "  2. 20251119044638_AddMessageCategoryAndContext"
echo ""

# Run migrations via ECS task
echo "🚀 Running migrations via ECS task..."
aws ecs run-task \
  --region ap-southeast-2 \
  --cluster qivr_cluster \
  --task-definition qivr-api:209 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNET_ID],securityGroups=[$SECURITY_GROUP],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "qivr-api",
      "command": ["dotnet", "ef", "database", "update", "--project", "Qivr.Infrastructure", "--startup-project", "Qivr.Api"]
    }]
  }' \
  --query 'tasks[0].taskArn' \
  --output text

echo ""
echo "✅ Migration task started!"
echo "📊 Check CloudWatch Logs for progress: /ecs/qivr-api"
echo ""
echo "To verify migrations were applied:"
echo "  aws ecs execute-command --region ap-southeast-2 --cluster qivr_cluster --task <TASK_ID> --container qivr-api --interactive --command '/bin/bash'"
