# Qivr Production Deployment Guide

## 🚀 Production Readiness Status

**All critical production requirements have been implemented:**
- ✅ Dev authentication removed
- ✅ AWS Secrets Manager integration configured
- ✅ RDS database provisioning scripts ready
- ✅ Database migration testing scripts prepared
- ✅ Critical path test coverage added

## 📋 Pre-Deployment Checklist

### 1. AWS Infrastructure Setup
```bash
# Navigate to infrastructure directory
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan -var-file=production.tfvars

# Apply infrastructure (creates RDS, VPC, etc.)
terraform apply -var-file=production.tfvars
```

### 2. Secrets Configuration
```bash
# Run the secrets setup script
cd infrastructure/scripts
./setup-secrets.sh

# This will prompt for:
# - Cognito credentials
# - SMTP credentials
# - MessageMedia API keys
# - Other service credentials
```

### 3. Database Setup
```bash
# Test migrations locally first
cd infrastructure/scripts
./test-migrations.sh

# If successful, apply to production RDS
dotnet ef database update \
  --project backend/Qivr.Infrastructure \
  --startup-project backend/Qivr.Api \
  --connection "$(aws secretsmanager get-secret-value \
    --secret-id qivr/production/database/master \
    --query SecretString --output text | jq -r '.connectionString')"
```

### 4. Run Tests
```bash
# Execute all tests before deployment
cd infrastructure/scripts
./run-tests.sh

# Ensure all tests pass and coverage meets threshold
```

## 🔧 Environment Variables Required

Set these in your deployment environment (ECS, Lambda, etc.):

```bash
# Core Settings
ENVIRONMENT=production
AWS_REGION=us-east-1

# Database (loaded from Secrets Manager)
CONNECTION_STRING=<from-secrets-manager>

# Authentication (loaded from Secrets Manager)
COGNITO_USER_POOL_ID=<from-secrets-manager>
COGNITO_CLIENT_ID=<from-secrets-manager>
COGNITO_CLIENT_SECRET=<from-secrets-manager>
JWT_SECRET_KEY=<from-secrets-manager>

# CORS Settings
CORS_ALLOWED_ORIGINS=https://app.qivr.health,https://clinic.qivr.health

# Security
Security__RequireHttps=true
```

## 🐳 Docker Deployment

### Build Images
```bash
# Backend
cd backend
docker build -t qivr-api:latest -f Dockerfile .
docker tag qivr-api:latest <your-ecr-repo>/qivr-api:latest
docker push <your-ecr-repo>/qivr-api:latest

# Frontend - Patient Portal
cd apps/patient-portal
docker build -t qivr-patient:latest -f Dockerfile .
docker tag qivr-patient:latest <your-ecr-repo>/qivr-patient:latest
docker push <your-ecr-repo>/qivr-patient:latest

# Frontend - Clinic Dashboard
cd apps/clinic-dashboard
docker build -t qivr-clinic:latest -f Dockerfile .
docker tag qivr-clinic:latest <your-ecr-repo>/qivr-clinic:latest
docker push <your-ecr-repo>/qivr-clinic:latest
```

## 🚀 Deployment Steps

### 1. Deploy Backend API
```bash
# Update ECS service with new image
aws ecs update-service \
  --cluster qivr-production \
  --service qivr-api \
  --force-new-deployment

# Monitor deployment
aws ecs wait services-stable \
  --cluster qivr-production \
  --services qivr-api
```

### 2. Deploy Frontend Applications
```bash
# Deploy Patient Portal
aws ecs update-service \
  --cluster qivr-production \
  --service qivr-patient-portal \
  --force-new-deployment

# Deploy Clinic Dashboard
aws ecs update-service \
  --cluster qivr-production \
  --service qivr-clinic-dashboard \
  --force-new-deployment
```

### 3. Verify Deployment
```bash
# Check API health
curl https://api.qivr.health/health

# Check frontend apps
curl -I https://app.qivr.health
curl -I https://clinic.qivr.health

# Monitor CloudWatch logs
aws logs tail /ecs/qivr-production/api --follow
```

## 🔄 Rollback Procedure

If issues occur:

```bash
# 1. Rollback ECS to previous task definition
PREVIOUS_REVISION=$(aws ecs describe-services \
  --cluster qivr-production \
  --services qivr-api \
  --query 'services[0].taskDefinition' \
  --output text | sed 's/.*://' | awk '{print $1-1}')

aws ecs update-service \
  --cluster qivr-production \
  --service qivr-api \
  --task-definition qivr-api:$PREVIOUS_REVISION

# 2. Rollback database if needed
# Use the migration rollback feature
dotnet ef database update <previous-migration-name> \
  --connection "<production-connection-string>"
```

## 📊 Post-Deployment Validation

### Health Checks
- [ ] API health endpoint returns 200
- [ ] Database connectivity verified
- [ ] Authentication flow working (Cognito)
- [ ] All frontend apps loading correctly
- [ ] No critical errors in CloudWatch logs

### Performance Checks
- [ ] API response times < 200ms (p95)
- [ ] Database query times < 100ms (p95)
- [ ] Frontend load times < 3s
- [ ] No memory leaks detected

### Security Checks
- [ ] SSL certificates valid
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] WAF rules blocking attacks
- [ ] No sensitive data in logs

## 🆘 Troubleshooting

### Common Issues

#### Backend won't start
```bash
# Check logs
aws logs get-log-events \
  --log-group-name /ecs/qivr-production/api \
  --log-stream-name <latest-stream>

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Secrets Manager permissions
```

#### Database connection failures
```bash
# Test connection from bastion host
psql -h <rds-endpoint> -U qivr_admin -d qivr_production

# Check security groups
aws ec2 describe-security-groups \
  --group-ids <rds-security-group>
```

#### Authentication not working
```bash
# Verify Cognito configuration
aws cognito-idp describe-user-pool \
  --user-pool-id <pool-id>

# Check JWT secret is set
aws secretsmanager get-secret-value \
  --secret-id qivr/production/jwt/secret
```

## 📞 Support Contacts

- **Infrastructure Issues**: infrastructure@qivr.health
- **Application Issues**: engineering@qivr.health
- **Security Issues**: security@qivr.health
- **On-Call**: Use PagerDuty

## 📝 Final Notes

1. **Always test in staging first** before production deployment
2. **Monitor closely** for the first 24 hours after deployment
3. **Keep rollback scripts ready** in case of issues
4. **Document any deviations** from this guide
5. **Update this guide** with lessons learned

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Status**: READY FOR PRODUCTION DEPLOYMENT
