# QIVR Operations Guide

**Last Updated:** November 7, 2025

---

## 🔗 Quick Access

### Production URLs
- **Clinic Dashboard:** https://dwmqwnt4dy1td.cloudfront.net
- **Patient Portal:** https://d1jw6e1qiegavd.cloudfront.net
- **API:** https://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com (Note: HTTPS not yet configured)

### AWS Console
- **CloudWatch Alarms:** https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#alarmsV2:
- **ECS Service:** https://console.aws.amazon.com/ecs/v2/clusters/qivr_cluster/services/qivr-api
- **RDS Database:** https://console.aws.amazon.com/rds/home?region=ap-southeast-2#database:id=qivr-dev-db
- **CloudFront:** https://console.aws.amazon.com/cloudfront/v3/home

---

## 🚀 Common Operations

### Deploy Backend
```bash
cd /Users/oliver/Projects/qivr
./infrastructure/deploy.sh
```

### Deploy Frontends
```bash
# Clinic Dashboard
cd apps/clinic-dashboard
npm run build
aws s3 sync dist/ s3://qivr-clinic-dashboard-staging --delete --region ap-southeast-2
aws cloudfront create-invalidation --distribution-id E1S9SAZB57T3C3 --paths "/*"

# Patient Portal
cd apps/patient-portal
npm run build
aws s3 sync dist/ s3://qivr-patient-portal-staging --delete --region ap-southeast-2
aws cloudfront create-invalidation --distribution-id E39OVJDZIZ22QL --paths "/*"
```

### View Logs
```bash
# API logs (live tail)
aws logs tail /ecs/qivr_cluster/qivr-api --follow --region ap-southeast-2

# Recent errors
aws logs tail /ecs/qivr_cluster/qivr-api --since 1h --region ap-southeast-2 | grep ERROR
```

### Check System Status
```bash
./infrastructure/verify-alignment.sh
```

### Seed Sample Data
```bash
# Get JWT token from browser after login, then:
cd infrastructure
AUTH_TOKEN="Bearer <token>" node seed-sample-data.mjs
```

---

## 📊 System Architecture

```
Users
  ↓
CloudFront (HTTPS)
  ├─ Clinic: dwmqwnt4dy1td.cloudfront.net
  └─ Patient: d1jw6e1qiegavd.cloudfront.net
  ↓
S3 Static Hosting
  ├─ qivr-clinic-dashboard-staging
  └─ qivr-patient-portal-staging
  ↓
ALB (HTTP)
  └─ qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com
  ↓
ECS Fargate (2 tasks)
  └─ Cluster: qivr_cluster
  └─ Service: qivr-api
  ↓
RDS PostgreSQL
  └─ qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com
```

---

## 🔧 Key Resources

| Resource | Identifier | Region |
|----------|-----------|--------|
| ECS Cluster | qivr_cluster | ap-southeast-2 |
| ECS Service | qivr-api | ap-southeast-2 |
| RDS Instance | qivr-dev-db | ap-southeast-2 |
| ALB | qivr-alb | ap-southeast-2 |
| Clinic S3 | qivr-clinic-dashboard-staging | ap-southeast-2 |
| Patient S3 | qivr-patient-portal-staging | ap-southeast-2 |
| Clinic CloudFront | E1S9SAZB57T3C3 | Global |
| Patient CloudFront | E39OVJDZIZ22QL | Global |
| Clinic Cognito | ap-southeast-2_jbutB4tj1 | ap-southeast-2 |
| Patient Cognito | ap-southeast-2_ZMcriKNGJ | ap-southeast-2 |
| SNS Alerts | qivr-staging-alerts | ap-southeast-2 |

---

## 📈 Monitoring

### CloudWatch Alarms (7 active)
- qivr-api-5xx-errors (> 10 in 5 min)
- qivr-api-response-time (> 2 seconds)
- qivr-db-connections-high (> 80)
- qivr-db-cpu-high (> 80%)
- qivr-db-storage-low (< 5 GB)
- qivr-ecs-cpu-high (> 80%)
- qivr-ecs-memory-high (> 85%)

**Alerts sent to:** oliver@qivr.io

### Check Alarm Status
```bash
aws cloudwatch describe-alarms --region ap-southeast-2 --alarm-name-prefix "qivr-"
```

---

## 🐛 Troubleshooting

### Backend Not Responding
```bash
# Check ECS service
aws ecs describe-services --cluster qivr_cluster --services qivr-api --region ap-southeast-2

# Check task health
aws ecs list-tasks --cluster qivr_cluster --service-name qivr-api --region ap-southeast-2

# View recent logs
aws logs tail /ecs/qivr_cluster/qivr-api --since 30m --region ap-southeast-2
```

### Frontend Not Loading
```bash
# Check S3 bucket
aws s3 ls s3://qivr-clinic-dashboard-staging/

# Check CloudFront status
aws cloudfront get-distribution --id E1S9SAZB57T3C3 --query 'Distribution.Status'

# Invalidate cache
aws cloudfront create-invalidation --distribution-id E1S9SAZB57T3C3 --paths "/*"
```

### Database Issues
```bash
# Check RDS status
aws rds describe-db-instances --db-instance-identifier qivr-dev-db --region ap-southeast-2

# Check connections
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name DatabaseConnections \
  --dimensions Name=DBInstanceIdentifier,Value=qivr-dev-db \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Average \
  --region ap-southeast-2
```

### 401 Unauthorized Errors
- Auto-user creation middleware should handle this
- Check logs for "Creating user" or "Found user"
- Verify Cognito token is valid (not expired)
- Ensure user has correct permissions

---

## 🔐 Security

### Database Connection
- **Host:** qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com
- **Port:** 5432
- **Database:** qivr
- **User:** qivr_user
- **Password:** Stored in appsettings.Production.json (TODO: Move to Secrets Manager)

### Cognito Pools
**Clinic Dashboard:**
- Pool ID: ap-southeast-2_jbutB4tj1
- Client ID: 4l510mm689hhpgr12prbuch2og

**Patient Portal:**
- Pool ID: ap-southeast-2_ZMcriKNGJ
- Client ID: 4kugfmvk56o3otd0grc4gddi8r

---

## 📋 TODO

### Immediate
- [ ] Test HTTPS URLs
- [ ] Seed sample data
- [ ] Test all features end-to-end

### This Week
- [ ] Update Cognito callbacks to CloudFront URLs
- [ ] Enable RDS automated backups
- [ ] Move database password to Secrets Manager

### Future
- [ ] Custom domains (clinic.qivr.health)
- [ ] HTTPS on ALB
- [ ] Separate production environment
- [ ] CI/CD pipeline

---

## 📞 Support

**Issues?**
1. Check CloudWatch logs
2. Run `./infrastructure/verify-alignment.sh`
3. Review alarm status
4. Check ECS task health

**Contact:** oliver@qivr.io
