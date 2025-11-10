# QIVR Deployment Guide

## 🚀 Quick Deployment

### Manual Deployment
```bash
# Deploy everything
npm run deploy

# Deploy only backend
npm run deploy:backend

# Deploy only frontend
npm run deploy:frontend

# Check system status
npm run status
```

### Direct Script Usage
```bash
# Full deployment
./deploy.sh

# Backend only
./deploy.sh --backend-only

# Frontend only
./deploy.sh --frontend-only

# Check status
./status.sh
```

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy-streamlined.yml`) automatically deploys on push to `main`:

1. **Backend**: Builds Docker image → Pushes to ECR → Updates ECS service
2. **Frontend**: Builds React apps → Deploys to S3 → Invalidates CloudFront
3. **Health Check**: Verifies deployments are successful

### Required GitHub Secrets
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

## 📊 Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐
│   GitHub Repo   │───▶│  GitHub Actions  │
└─────────────────┘    └──────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
        ┌──────────────┐ ┌─────────────┐ ┌─────────────┐
        │     ECR      │ │     S3      │ │ CloudFront  │
        │ (Docker)     │ │ (Static)    │ │ (CDN)       │
        └──────────────┘ └─────────────┘ └─────────────┘
                │               │               │
                ▼               └───────────────┘
        ┌──────────────┐                       │
        │     ECS      │                       ▼
        │ (Containers) │               ┌─────────────┐
        └──────────────┘               │   Users     │
                │                      └─────────────┘
                ▼
        ┌──────────────┐
        │     RDS      │
        │ (Database)   │
        └──────────────┘
```

## 🔧 Current Infrastructure

### Backend
- **ECS Cluster**: `qivr_cluster`
- **ECS Service**: `qivr-api`
- **ECR Repository**: `qivr-api`
- **Region**: `ap-southeast-2`

### Frontend
- **Clinic Dashboard**:
  - S3 Bucket: `qivr-clinic-dashboard-staging`
  - CloudFront: `E1S9SAZB57T3C3`
  - URL: https://dwmqwnt4dy1td.cloudfront.net

- **Patient Portal**:
  - S3 Bucket: `qivr-patient-portal-staging`
  - CloudFront: `E39OVJDZIZ22QL`
  - URL: https://d1jw6e1qiegavd.cloudfront.net

## 🔍 Monitoring

### Check Deployment Status
```bash
# Quick status check
npm run status

# Detailed ECS service info
aws ecs describe-services --cluster qivr_cluster --services qivr-api --region ap-southeast-2

# View ECS logs
aws logs tail /ecs/qivr_cluster/qivr-api --follow --region ap-southeast-2

# Check CloudFront invalidations
aws cloudfront list-invalidations --distribution-id E1S9SAZB57T3C3 --region ap-southeast-2
```

### Health Endpoints
- **Frontend Health**: Check if URLs load successfully
- **Backend Health**: ECS service health checks (internal)

## 🚨 Troubleshooting

### Common Issues

1. **ECS Deployment Stuck**
   ```bash
   # Force new deployment
   aws ecs update-service --cluster qivr_cluster --service qivr-api --force-new-deployment --region ap-southeast-2
   ```

2. **CloudFront Cache Issues**
   ```bash
   # Create invalidation
   aws cloudfront create-invalidation --distribution-id E1S9SAZB57T3C3 --paths "/*" --region ap-southeast-2
   ```

3. **Docker Build Issues**
   ```bash
   # Clean Docker cache
   docker system prune -a
   ```

4. **ECR Authentication**
   ```bash
   # Re-authenticate with ECR
   aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 818084701597.dkr.ecr.ap-southeast-2.amazonaws.com
   ```

## 📋 Deployment Checklist

- [ ] Code changes committed and pushed
- [ ] Tests passing locally
- [ ] Environment variables updated if needed
- [ ] Database migrations ready (if applicable)
- [ ] Deployment script tested
- [ ] Monitoring setup for new deployment
- [ ] Rollback plan prepared

## 🔄 Rollback Process

If deployment fails:

1. **ECS Rollback**:
   ```bash
   # Get previous task definition
   aws ecs describe-services --cluster qivr_cluster --services qivr-api --region ap-southeast-2
   
   # Update to previous revision
   aws ecs update-service --cluster qivr_cluster --service qivr-api --task-definition qivr-api:PREVIOUS_REVISION --region ap-southeast-2
   ```

2. **Frontend Rollback**:
   - Restore previous S3 content from backup
   - Or redeploy previous git commit
