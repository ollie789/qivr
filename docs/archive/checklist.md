# Qivr Deployment Readiness Checklist

## 🔐 Environment Variables Required

### Backend API (.NET)
```bash
# Database
CONNECTION_STRING=               # PostgreSQL connection string
INTAKE_CONNECTION_STRING=         # Intake database connection (can be same as above)

# Authentication
JWT_SECRET_KEY=                  # Min 32 characters, use: openssl rand -base64 32
JWT_ISSUER=qivr.com
JWT_AUDIENCE=qivr-api
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_CLIENT_SECRET=
COGNITO_DOMAIN=
COGNITO_IDENTITY_POOL_ID=
AWS_REGION=us-east-1

# CORS
CORS_ALLOWED_ORIGINS=https://app.qivr.com,https://clinic.qivr.com

# AWS Services
S3_BUCKET_NAME=
SQS_QUEUE_URL=
BEDROCK_ACCESS_KEY=
BEDROCK_SECRET_KEY=

# Email (SES)
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@qivr.com

# SMS (MessageMedia)
MESSAGE_MEDIA_API_KEY=
MESSAGE_MEDIA_API_SECRET=
MESSAGE_MEDIA_FROM_NUMBER=

# Monitoring
OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317

# Application
APP_BASE_URL=https://app.qivr.com
DEFAULT_TENANT_ID=
ALLOWED_CLINIC_DOMAINS=*.qivr.com
```

### Frontend (React)
```bash
# API
API_URL=https://api.qivr.com

# AWS Cognito
AWS_REGION=us-east-1
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
COGNITO_IDENTITY_POOL_ID=
COGNITO_DOMAIN=

# Application
APP_VERSION=1.0.0
RECAPTCHA_SITE_KEY=
```

## ✅ Pre-Deployment Checklist

### AWS Infrastructure
- [ ] **VPC Configuration**
  - [ ] Private subnets for ECS tasks
  - [ ] Public subnets for ALB
  - [ ] NAT Gateway for outbound internet
  - [ ] Security groups configured

- [ ] **RDS PostgreSQL**
  - [ ] Multi-AZ deployment enabled
  - [ ] Automated backups configured (7+ days retention)
  - [ ] Performance Insights enabled
  - [ ] Encryption at rest enabled
  - [ ] Database migrations tested

- [ ] **ECS Fargate**
  - [ ] ECR repositories created
  - [ ] Task definitions validated
  - [ ] Service auto-scaling configured
  - [ ] Health checks passing

- [ ] **Application Load Balancer**
  - [ ] SSL certificate from ACM
  - [ ] Target groups configured
  - [ ] Health check paths verified
  - [ ] Stickiness enabled for sessions

- [ ] **CloudFront CDN**
  - [ ] Distribution created
  - [ ] Custom domain configured
  - [ ] SSL certificate attached
  - [ ] Cache behaviors optimized
  - [ ] WAF rules enabled

- [ ] **AWS Cognito**
  - [ ] User pools created (patient & clinic)
  - [ ] App clients configured
  - [ ] MFA enabled
  - [ ] Password policies set
  - [ ] Custom domain configured
  - [ ] Email/SMS templates customized

- [ ] **S3 Buckets**
  - [ ] Upload bucket created
  - [ ] Versioning enabled
  - [ ] Lifecycle policies configured
  - [ ] CORS configured
  - [ ] Encryption enabled

- [ ] **Secrets Manager**
  - [ ] All secrets stored
  - [ ] Rotation configured where applicable
  - [ ] IAM permissions set

- [ ] **CloudWatch**
  - [ ] Log groups created
  - [ ] Retention policies set
  - [ ] Dashboards configured
  - [ ] Alarms set up
  - [ ] SNS topics for alerts

### Security
- [ ] **WAF Rules**
  - [ ] Rate limiting configured
  - [ ] SQL injection protection
  - [ ] XSS protection
  - [ ] Geo-blocking (if needed)

- [ ] **IAM Roles**
  - [ ] ECS task execution role
  - [ ] ECS task role with minimal permissions
  - [ ] Lambda execution roles
  - [ ] Service-specific roles

- [ ] **Network Security**
  - [ ] Security groups reviewed
  - [ ] NACLs configured
  - [ ] VPC Flow Logs enabled
  - [ ] AWS GuardDuty enabled

- [ ] **Data Protection**
  - [ ] Encryption in transit (TLS 1.2+)
  - [ ] Encryption at rest (KMS)
  - [ ] Database encryption
  - [ ] S3 bucket encryption

### Application Configuration
- [ ] **Backend**
  - [ ] Remove all hardcoded values
  - [ ] Remove mock authentication
  - [ ] Remove test data
  - [ ] Production logging configured
  - [ ] Health endpoints working
  - [ ] OpenTelemetry configured

- [ ] **Frontend**
  - [ ] Environment variables set
  - [ ] API endpoints verified
  - [ ] Cognito configuration correct
  - [ ] Error boundaries in place
  - [ ] CSP headers configured

- [ ] **Database**
  - [ ] Migrations tested
  - [ ] Indexes optimized
  - [ ] Connection pooling configured
  - [ ] Read replicas (if needed)

### Monitoring & Observability
- [ ] **CloudWatch Metrics**
  - [ ] Application metrics
  - [ ] Infrastructure metrics
  - [ ] Custom metrics
  - [ ] Dashboards created

- [ ] **Distributed Tracing**
  - [ ] OpenTelemetry collector deployed
  - [ ] X-Ray integration
  - [ ] Trace sampling configured

- [ ] **Logging**
  - [ ] Centralized logging
  - [ ] Log aggregation
  - [ ] Log retention policies
  - [ ] Log analysis queries

- [ ] **Alerting**
  - [ ] Critical alerts configured
  - [ ] PagerDuty/Slack integration
  - [ ] Escalation policies
  - [ ] Runbooks created

### Testing
- [ ] **Load Testing**
  - [ ] API endpoints tested
  - [ ] Database performance verified
  - [ ] Auto-scaling tested
  - [ ] CDN caching verified

- [ ] **Security Testing**
  - [ ] Penetration testing completed
  - [ ] OWASP top 10 addressed
  - [ ] SSL/TLS configuration verified
  - [ ] Security headers validated

- [ ] **Integration Testing**
  - [ ] Cognito authentication flow
  - [ ] S3 file uploads
  - [ ] Email/SMS notifications
  - [ ] Payment processing (if applicable)

### Compliance & Documentation
- [ ] **HIPAA Compliance**
  - [ ] BAA signed with AWS
  - [ ] PHI encryption verified
  - [ ] Audit logging enabled
  - [ ] Access controls implemented

- [ ] **Documentation**
  - [ ] API documentation updated
  - [ ] Deployment guide created
  - [ ] Runbook prepared
  - [ ] Disaster recovery plan

- [ ] **Backup & Recovery**
  - [ ] Database backup strategy
  - [ ] S3 versioning/backup
  - [ ] Disaster recovery tested
  - [ ] RTO/RPO defined

## 🚀 Deployment Steps

1. **Infrastructure Provisioning**
   ```bash
   cd infrastructure/terraform
   terraform init
   terraform plan -var-file=production.tfvars
   terraform apply -var-file=production.tfvars
   ```

2. **Database Setup**
   ```bash
   # Run migrations
   cd database/migrations
   for f in *.sql; do psql $CONNECTION_STRING -f $f; done
   ```

3. **Build & Push Docker Images**
   ```bash
   # Backend
   cd backend
   docker build -t $ECR_REPO_API:latest .
   docker push $ECR_REPO_API:latest
   
   # Frontend
   cd frontend
   docker build -t $ECR_REPO_FRONTEND:latest .
   docker push $ECR_REPO_FRONTEND:latest
   ```

4. **Deploy ECS Services**
   ```bash
   # Update task definitions
   aws ecs update-service --cluster qivr-prod --service api --force-new-deployment
   aws ecs update-service --cluster qivr-prod --service frontend --force-new-deployment
   ```

5. **Verify Deployment**
   ```bash
   # Check health endpoints
   curl https://api.qivr.com/health
   curl https://app.qivr.com/health
   
   # Check CloudWatch logs
   aws logs tail /ecs/qivr-prod/api --follow
   ```

6. **Invalidate CloudFront Cache**
   ```bash
   aws cloudfront create-invalidation --distribution-id $DIST_ID --paths "/*"
   ```

## 🔄 Rollback Procedure

1. **Identify Issue**
   - Check CloudWatch alarms
   - Review application logs
   - Verify health checks

2. **Rollback ECS Services**
   ```bash
   # Rollback to previous task definition
   aws ecs update-service --cluster qivr-prod --service api \
     --task-definition api:$PREVIOUS_REVISION
   ```

3. **Database Rollback** (if needed)
   ```bash
   # Restore from snapshot
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier qivr-prod-restored \
     --db-snapshot-identifier $SNAPSHOT_ID
   ```

## 📊 Post-Deployment Verification

- [ ] All health checks passing
- [ ] Authentication flow working
- [ ] Database connectivity verified
- [ ] S3 uploads functional
- [ ] Email/SMS delivery working
- [ ] Monitoring dashboards updating
- [ ] No critical alarms firing
- [ ] Performance metrics acceptable
- [ ] Security scans passing

## 🆘 Emergency Contacts

- **On-Call Engineer**: [Phone/Slack]
- **AWS Support**: [Case URL]
- **Database Admin**: [Contact]
- **Security Team**: [Contact]

## 📝 Notes

- Always deploy to staging first
- Use blue-green deployments for zero downtime
- Keep rollback scripts ready
- Document any deviations from this checklist
- Update this document after each deployment
