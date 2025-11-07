# QIVR Infrastructure

Infrastructure as Code and deployment scripts for QIVR platform.

## Quick Start

### 1. Set Up Monitoring (✅ Completed)
```bash
./setup-monitoring.sh oliver@qivr.io
```
Creates CloudWatch alarms and SNS alerts.

### 2. Deploy CloudFront (Optional)
```bash
./deploy-staging-improvements.sh
```
Adds HTTPS and CDN caching to frontends.

### 3. Seed Sample Data
```bash
# Get JWT token from browser dev tools after logging in
AUTH_TOKEN="<token>" node seed-sample-data.mjs
```
Creates demo patients, appointments, and records.

## Files

### Deployment Scripts
- `setup-monitoring.sh` - CloudWatch alarms (✅ executed)
- `deploy-staging-improvements.sh` - CloudFront + monitoring via Terraform
- `seed-sample-data.mjs` - Seed demo data via API
- `deploy.sh` - Main deployment script for backend
- `enable-otel.sh` - Enable OpenTelemetry tracing

### Configuration
- `terraform/` - Infrastructure as Code
  - `staging-improvements.tf` - CloudFront distributions + monitoring
  - `ecs.tf` - ECS cluster and services
  - `rds.tf` - PostgreSQL database
  - `cognito-*.tf` - Authentication
  - `monitoring.tf` - Comprehensive monitoring setup
  - `cloudfront-waf.tf` - CDN and security

### Documentation
- `STAGING-IMPROVEMENTS-GUIDE.md` - Step-by-step manual setup guide
- `OTEL-QUICK-REFERENCE.md` - OpenTelemetry configuration

## Current Status

### ✅ Working
- ECS Fargate API (2 tasks)
- RDS PostgreSQL database
- Cognito authentication (2 pools)
- Auto-user creation middleware
- CloudWatch monitoring (7 alarms)
- SNS email alerts

### ⏳ Ready to Deploy
- CloudFront distributions (HTTPS + caching)
- Sample data seeding

### 📋 Planned
- Custom domains (clinic.qivr.health, patient.qivr.health)
- HTTPS for ALB
- Separate production environment

## Architecture

```
Users
  ↓
S3 Frontends (HTTP) → [CloudFront ready to deploy]
  ↓
ALB (HTTP) → [HTTPS ready to configure]
  ↓
ECS Fargate (2 tasks) ✅ Monitored
  ↓
RDS PostgreSQL ✅ Monitored
```

## Monitoring

**View Alarms:** [CloudWatch Console](https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#alarmsV2:)

**Alarms:**
- API 5xx errors > 10
- API response time > 2s
- DB connections > 80
- DB CPU > 80%
- DB storage < 5GB
- ECS CPU > 80%
- ECS Memory > 85%

**Alerts:** oliver@qivr.io (confirm SNS subscription in email)

## Common Tasks

### Deploy Backend
```bash
./deploy.sh
```

### View API Logs
```bash
aws logs tail /ecs/qivr/api --follow --region ap-southeast-2
```

### Check Service Health
```bash
aws ecs describe-services \
  --cluster qivr-cluster \
  --services qivr-api-service \
  --region ap-southeast-2
```

### Deploy Frontend
```bash
# Clinic Dashboard
cd ../apps/clinic-dashboard
npm run build
aws s3 sync dist/ s3://qivr-clinic-dashboard-staging --delete

# Patient Portal
cd ../apps/patient-portal
npm run build
aws s3 sync dist/ s3://qivr-patient-portal-staging --delete
```

## Resources

- **API:** http://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com
- **Clinic Dashboard:** http://qivr-clinic-dashboard-staging.s3-website-ap-southeast-2.amazonaws.com
- **Patient Portal:** http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com
- **Database:** qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com

## Cost Estimate

- ECS Fargate: ~$30/month
- RDS db.t3.micro: ~$15/month
- ALB: ~$20/month
- S3 + Transfer: ~$5/month
- CloudWatch: ~$1/month
- **Total: ~$71/month**

With CloudFront: +$5-20/month (traffic dependent)

## Support

Issues? Check:
1. CloudWatch Logs: `/ecs/qivr/api`
2. ECS task status
3. ALB target health
4. RDS instance status

Contact: oliver@qivr.io
