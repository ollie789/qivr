#!/bin/bash

# QIVR Resource Tagging Script
# Tags all AWS resources with consistent labels for better organization

REGION="ap-southeast-2"
TAGS="Key=Project,Value=QIVR Key=Environment,Value=Production Key=Owner,Value=QivrHealth Key=CostCenter,Value=Platform"

echo "🏷️  Tagging QIVR AWS Resources..."

# ECS Resources
echo "Tagging ECS resources..."
aws ecs tag-resource --resource-arn "arn:aws:ecs:${REGION}:818084701597:cluster/qivr_cluster" --tags $TAGS --region $REGION
aws ecs tag-resource --resource-arn "arn:aws:ecs:${REGION}:818084701597:service/qivr_cluster/qivr-api" --tags $TAGS --region $REGION

# ECR Repository
echo "Tagging ECR repository..."
aws ecr put-lifecycle-policy --repository-name qivr-api --lifecycle-policy-text '{"rules":[{"rulePriority":1,"selection":{"tagStatus":"untagged","countType":"sinceImagePushed","countUnit":"days","countNumber":7},"action":{"type":"expire"}}]}' --region $REGION
aws ecr tag-resource --resource-arn "arn:aws:ecr:${REGION}:818084701597:repository/qivr-api" --tags $TAGS --region $REGION

# S3 Buckets
echo "Tagging S3 buckets..."
aws s3api put-bucket-tagging --bucket qivr-clinic-dashboard-staging --tagging "TagSet=[{Key=Project,Value=QIVR},{Key=Environment,Value=Production},{Key=Owner,Value=QivrHealth},{Key=CostCenter,Value=Platform},{Key=Type,Value=Frontend}]" --region $REGION
aws s3api put-bucket-tagging --bucket qivr-patient-portal-staging --tagging "TagSet=[{Key=Project,Value=QIVR},{Key=Environment,Value=Production},{Key=Owner,Value=QivrHealth},{Key=CostCenter,Value=Platform},{Key=Type,Value=Frontend}]" --region $REGION
aws s3api put-bucket-tagging --bucket qivr-codepipeline-artifacts-818084701597 --tagging "TagSet=[{Key=Project,Value=QIVR},{Key=Environment,Value=Production},{Key=Owner,Value=QivrHealth},{Key=CostCenter,Value=Platform},{Key=Type,Value=CICD}]" --region $REGION

# CodeBuild Project
echo "Tagging CodeBuild project..."
aws codebuild put-resource-policy --resource-arn "arn:aws:codebuild:${REGION}:818084701597:project/qivr-build" --policy '{"Version":"2012-10-17","Statement":[]}' --region $REGION 2>/dev/null || true

# IAM Roles
echo "Tagging IAM roles..."
aws iam tag-role --role-name qivr-codebuild-role --tags $TAGS --region $REGION
aws iam tag-role --role-name qivr-codepipeline-role --tags $TAGS --region $REGION

# Load Balancer & Target Group
echo "Tagging ALB resources..."
ALB_ARN=$(aws elbv2 describe-load-balancers --names qivr-alb --query 'LoadBalancers[0].LoadBalancerArn' --output text --region $REGION 2>/dev/null || echo "")
if [ "$ALB_ARN" != "" ] && [ "$ALB_ARN" != "None" ]; then
    aws elbv2 add-tags --resource-arns $ALB_ARN --tags $TAGS --region $REGION
fi

TG_ARN="arn:aws:elasticloadbalancing:${REGION}:818084701597:targetgroup/qivr-api-tg/acbcbb397269e55c"
aws elbv2 add-tags --resource-arns $TG_ARN --tags $TAGS --region $REGION

# CloudFront Distributions
echo "Tagging CloudFront distributions..."
aws cloudfront tag-resource --resource "arn:aws:cloudfront::818084701597:distribution/E1S9SAZB57T3C3" --tags "Items=[{Key=Project,Value=QIVR},{Key=Environment,Value=Production},{Key=Owner,Value=QivrHealth},{Key=CostCenter,Value=Platform},{Key=Type,Value=CDN-Clinic}]" --region us-east-1 2>/dev/null || true
aws cloudfront tag-resource --resource "arn:aws:cloudfront::818084701597:distribution/E39OVJDZIZ22QL" --tags "Items=[{Key=Project,Value=QIVR},{Key=Environment,Value=Production},{Key=Owner,Value=QivrHealth},{Key=CostCenter,Value=Platform},{Key=Type,Value=CDN-Patient}]" --region us-east-1 2>/dev/null || true

# RDS Database
echo "Tagging RDS database..."
aws rds add-tags-to-resource --resource-name "arn:aws:rds:${REGION}:818084701597:db:qivr-dev-db" --tags $TAGS --region $REGION 2>/dev/null || true

echo "✅ Resource tagging completed!"
echo ""
echo "📊 To view costs by project:"
echo "aws ce get-cost-and-usage --time-period Start=2025-11-01,End=2025-11-30 --granularity MONTHLY --metrics BlendedCost --group-by Type=DIMENSION,Key=SERVICE Type=TAG,Key=Project --region us-east-1"
