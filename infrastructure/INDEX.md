# Infrastructure Index

## Active Infrastructure

### Terraform (IaC)
- **terraform/** - All Terraform configurations
  - `main.tf` - Main config
  - `ecs.tf` - ECS cluster & services
  - `rds.tf` - PostgreSQL database
  - `cognito-clinic.tf` - Clinic user pool
  - `cognito-patient.tf` - Patient user pool
  - `cloudfront-waf.tf` - CDN & WAF
  - `monitoring.tf` - CloudWatch & alarms
  - `lambda-cognito.tf` - Cognito triggers
  - `staging-improvements.tf` - Staging env

### Docker Compose (Local Dev)
- **docker-compose.yml** - Local development stack
- **docker-compose.test.yml** - Test environment
- **localstack/** - LocalStack config for AWS emulation

### OpenTelemetry
- **otel-collector-config.yaml** - OTEL collector config
- **otel/** - OTEL configurations
- **OTEL-QUICK-REFERENCE.md** - OTEL setup guide

### CloudFront
- **cloudfront.tf** - CloudFront Terraform config

### Scripts (Active)
- **scripts/seed-rds.sh** - Seed RDS database
- **scripts/seed-sample-data.mjs** - Generate sample data
- **scripts/seed-clinic.sh** - Create test clinic
- **scripts/configure-redis.sh** - Redis setup
- **scripts/check-cloudfront-status.sh** - Check CF deployment

## Documentation
- **README.md** - Infrastructure overview
- **STAGING-IMPROVEMENTS-GUIDE.md** - Staging environment guide

## Archived

### `/archive/old-scripts/`
Old deployment and setup scripts (kept for reference):
- deploy-staging-improvements.sh
- verify-alignment.sh
- enable-otel.sh
- disable-redis-quick-fix.sh
- update-task-definition.sh
- verify-features.sh
- deploy-cloudfront.sh
- setup-monitoring.sh
- deploy.sh

### `/archive/old-configs/`
Old configuration files:
- enhanced-auto-create.cs
- lambda-auto-create-user.js
- otel-sidecar-container.json
- cloudfront-update.json

## Usage

**Deploy infrastructure:**
```bash
cd terraform
terraform init
terraform plan
terraform apply
```

**Local development:**
```bash
docker-compose up
```

**Seed database:**
```bash
./scripts/seed-rds.sh
```

**Check CloudFront:**
```bash
./scripts/check-cloudfront-status.sh
```
