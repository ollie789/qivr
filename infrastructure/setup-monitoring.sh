#!/bin/bash
set -e

# Setup CloudWatch Monitoring for QIVR Staging
# Creates SNS topic and CloudWatch alarms

REGION="ap-southeast-2"
EMAIL="${1:-oliver@qivr.io}"
SNS_TOPIC_NAME="qivr-staging-alerts"

echo "🔔 Setting up CloudWatch Monitoring"
echo "===================================="
echo "Region: $REGION"
echo "Alert Email: $EMAIL"
echo ""

# Create SNS Topic
echo "Creating SNS topic..."
SNS_TOPIC_ARN=$(aws sns create-topic \
  --name "$SNS_TOPIC_NAME" \
  --region "$REGION" \
  --output text \
  --query 'TopicArn' 2>/dev/null || \
  aws sns list-topics --region "$REGION" --output text --query "Topics[?contains(TopicArn, '$SNS_TOPIC_NAME')].TopicArn | [0]")

echo "✅ SNS Topic: $SNS_TOPIC_ARN"

# Subscribe email
echo "Subscribing email to SNS topic..."
aws sns subscribe \
  --topic-arn "$SNS_TOPIC_ARN" \
  --protocol email \
  --notification-endpoint "$EMAIL" \
  --region "$REGION" > /dev/null

echo "✅ Email subscription created (check your inbox to confirm)"
echo ""

# Get resource identifiers
echo "Fetching AWS resource identifiers..."
ALB_ARN=$(aws elbv2 describe-load-balancers --region "$REGION" --query "LoadBalancers[?LoadBalancerName=='qivr-alb'].LoadBalancerArn | [0]" --output text)
ALB_SUFFIX=$(echo "$ALB_ARN" | sed 's/.*loadbalancer\///')
DB_INSTANCE="qivr-dev-db"
ECS_CLUSTER="qivr-cluster"
ECS_SERVICE="qivr-api-service"

echo "  ALB: $ALB_SUFFIX"
echo "  DB: $DB_INSTANCE"
echo "  ECS: $ECS_CLUSTER/$ECS_SERVICE"
echo ""

# Create CloudWatch Alarms
echo "Creating CloudWatch alarms..."

# API 5xx Errors
aws cloudwatch put-metric-alarm \
  --alarm-name "qivr-api-5xx-errors" \
  --alarm-description "Alert when API returns 5xx errors" \
  --metric-name "HTTPCode_Target_5XX_Count" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Sum" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 10 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions "Name=LoadBalancer,Value=$ALB_SUFFIX" \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"
echo "✅ Created alarm: API 5xx Errors"

# API Response Time
aws cloudwatch put-metric-alarm \
  --alarm-name "qivr-api-response-time" \
  --alarm-description "Alert when API response time is high" \
  --metric-name "TargetResponseTime" \
  --namespace "AWS/ApplicationELB" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 2 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions "Name=LoadBalancer,Value=$ALB_SUFFIX" \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"
echo "✅ Created alarm: API Response Time"

# Database Connections
aws cloudwatch put-metric-alarm \
  --alarm-name "qivr-db-connections-high" \
  --alarm-description "Alert when database connections are high" \
  --metric-name "DatabaseConnections" \
  --namespace "AWS/RDS" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions "Name=DBInstanceIdentifier,Value=$DB_INSTANCE" \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"
echo "✅ Created alarm: Database Connections"

# Database CPU
aws cloudwatch put-metric-alarm \
  --alarm-name "qivr-db-cpu-high" \
  --alarm-description "Alert when database CPU is high" \
  --metric-name "CPUUtilization" \
  --namespace "AWS/RDS" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions "Name=DBInstanceIdentifier,Value=$DB_INSTANCE" \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"
echo "✅ Created alarm: Database CPU"

# Database Storage
aws cloudwatch put-metric-alarm \
  --alarm-name "qivr-db-storage-low" \
  --alarm-description "Alert when database storage is low" \
  --metric-name "FreeStorageSpace" \
  --namespace "AWS/RDS" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 1 \
  --threshold 5368709120 \
  --comparison-operator "LessThanThreshold" \
  --dimensions "Name=DBInstanceIdentifier,Value=$DB_INSTANCE" \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"
echo "✅ Created alarm: Database Storage"

# ECS CPU
aws cloudwatch put-metric-alarm \
  --alarm-name "qivr-ecs-cpu-high" \
  --alarm-description "Alert when ECS CPU is high" \
  --metric-name "CPUUtilization" \
  --namespace "AWS/ECS" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 80 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions "Name=ServiceName,Value=$ECS_SERVICE" "Name=ClusterName,Value=$ECS_CLUSTER" \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"
echo "✅ Created alarm: ECS CPU"

# ECS Memory
aws cloudwatch put-metric-alarm \
  --alarm-name "qivr-ecs-memory-high" \
  --alarm-description "Alert when ECS memory is high" \
  --metric-name "MemoryUtilization" \
  --namespace "AWS/ECS" \
  --statistic "Average" \
  --period 300 \
  --evaluation-periods 2 \
  --threshold 85 \
  --comparison-operator "GreaterThanThreshold" \
  --dimensions "Name=ServiceName,Value=$ECS_SERVICE" "Name=ClusterName,Value=$ECS_CLUSTER" \
  --alarm-actions "$SNS_TOPIC_ARN" \
  --region "$REGION"
echo "✅ Created alarm: ECS Memory"

echo ""
echo "🎉 Monitoring setup complete!"
echo ""
echo "Summary:"
echo "  - SNS Topic: $SNS_TOPIC_NAME"
echo "  - Email: $EMAIL (check inbox to confirm subscription)"
echo "  - Alarms created: 7"
echo ""
echo "View alarms: https://console.aws.amazon.com/cloudwatch/home?region=$REGION#alarmsV2:"
echo ""
echo "Next steps:"
echo "1. Confirm email subscription (check your inbox)"
echo "2. Review alarms in CloudWatch console"
echo "3. Test by triggering an alarm condition"
