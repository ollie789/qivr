# AWS-Native CI/CD Setup

## Overview
Replaced GitHub Actions with AWS CodeBuild for seamless AWS integration.

## Components
- **CodeBuild Project**: `qivr-build`
- **IAM Roles**: `qivr-codebuild-role`, `qivr-codepipeline-role`
- **S3 Bucket**: `qivr-codepipeline-artifacts-818084701597`
- **Build Spec**: `buildspec.yml`

## Triggers
- **Manual**: `aws codebuild start-build --project-name qivr-build`
- **Automatic**: Webhook on GitHub pushes to main (requires GitHub token)

## Benefits
✅ No AWS secrets in GitHub  
✅ Native IAM role permissions  
✅ Fresh Docker builds (no caching issues)  
✅ Integrated CloudWatch logging  
✅ Cost-effective (pay per build)  

## Build Process
1. **Pre-build**: ECR login, set image tags
2. **Build**: Docker image + frontend apps
3. **Post-build**: Push to ECR, deploy to S3/ECS, invalidate CloudFront

## Monitoring
- **AWS Console**: CodeBuild → qivr-build
- **CloudWatch Logs**: `/aws/codebuild/qivr-build`
- **Build Status**: Check build history in console

## Manual Deployment
```bash
aws codebuild start-build --project-name qivr-build --region ap-southeast-2
```
