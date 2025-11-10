# QIVR AWS Resource Inventory

## 🏷️ Tagging Strategy
All resources tagged with:
- **Project**: QIVR
- **Environment**: Production  
- **Owner**: QivrHealth
- **CostCenter**: Platform

## 📋 Tagged Resources

### ✅ Compute & Containers
- **ECS Cluster**: `qivr_cluster`
- **ECS Service**: `qivr-api`
- **ECR Repository**: `qivr-api`

### ✅ Storage & CDN
- **S3 Buckets**:
  - `qivr-clinic-dashboard-staging` (Frontend)
  - `qivr-patient-portal-staging` (Frontend)
  - `qivr-codepipeline-artifacts-818084701597` (CI/CD)

### ✅ Networking
- **Target Group**: `qivr-api-tg`
- **Load Balancer**: Auto-discovered and tagged

### ✅ CI/CD & IAM
- **CodeBuild Project**: `qivr-build`
- **IAM Roles**:
  - `qivr-codebuild-role`
  - `qivr-codepipeline-role`

### 🔄 Pending (Manual Tagging Required)
- **CloudFront Distributions**: E1S9SAZB57T3C3, E39OVJDZIZ22QL
- **RDS Database**: `qivr-dev-db`
- **VPC & Subnets**: Network infrastructure

## 💰 Cost Tracking

### View costs by project:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=TAG,Key=Project \
  --region us-east-1
```

### View costs by service:
```bash
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE \
  --region us-east-1
```

## 🎯 Benefits
- **Cost allocation** by project/team
- **Resource organization** in AWS Console
- **Automated billing** reports
- **Compliance** tracking
- **Resource lifecycle** management
