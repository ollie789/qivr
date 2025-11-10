# Deployment Pipeline Fix

## Problem
CodeBuild was failing to deploy new ECS task definitions due to missing IAM permissions.

### Error
```
AccessDeniedException: User is not authorized to perform: ecs:RegisterTaskDefinition
```

## Root Cause
The `qivr-codebuild-role` IAM policy was missing critical ECS deployment permissions:
- `ecs:RegisterTaskDefinition` - Required to create new task definitions
- `ecs:DescribeTaskDefinition` - Required to read task definition details
- `iam:PassRole` - Required to pass ECS task roles to the service

## Solution
Updated `qivr-codebuild-policy` (v2) with comprehensive ECS deployment permissions:

```json
{
  "Effect": "Allow",
  "Action": [
    "ecs:RegisterTaskDefinition",
    "ecs:DescribeTaskDefinition",
    "ecs:UpdateService",
    "ecs:DescribeServices"
  ],
  "Resource": "*"
},
{
  "Effect": "Allow",
  "Action": ["iam:PassRole"],
  "Resource": [
    "arn:aws:iam::818084701597:role/qivr-ecs-task-role",
    "arn:aws:iam::818084701597:role/qivr-ecs-task-execution-role"
  ]
}
```

## Additional Fixes
1. **Moved buildspec.yml to root** - CodeBuild expects it in repository root, not aws/ subdirectory
2. **IAM policy stored in repo** - `aws/iam-policy-codebuild.json` for version control and documentation

## Deployment Flow
1. CodeBuild builds Docker image → pushes to ECR
2. CodeBuild registers new ECS task definition with latest image
3. CodeBuild updates ECS service to use new task definition
4. ECS performs rolling deployment (zero downtime)

## Long-term Benefits
- ✅ Automated deployments on every push to main
- ✅ Zero-downtime rolling updates
- ✅ Full CI/CD pipeline operational
- ✅ IAM permissions properly scoped and documented
- ✅ Infrastructure as code (buildspec.yml, IAM policies in repo)

## Files Changed
- `aws/iam-policy-codebuild.json` - IAM policy document (created)
- `buildspec.yml` - Moved from aws/ to root (relocated)
- IAM policy version updated from v1 → v2 in AWS

## Testing
After deployment completes, verify with:
```bash
node scripts/tests/test-live-system.mjs
```

Expected: 19/19 tests passing with TenantMiddleware fix deployed.
