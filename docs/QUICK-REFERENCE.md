# QIVR Quick Reference

## 🔗 URLs

### HTTPS (Production - Use These)
- **Clinic:** https://dwmqwnt4dy1td.cloudfront.net
- **Patient:** https://d1jw6e1qiegavd.cloudfront.net
- **API:** https://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com (Note: HTTPS not yet configured)

### AWS Console
- **CloudWatch:** https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#alarmsV2:
- **CloudFront:** https://console.aws.amazon.com/cloudfront/v3/home
- **ECS:** https://console.aws.amazon.com/ecs/v2/clusters/qivr_cluster/services

## 🛠️ Common Commands

### Check System Status
```bash
./infrastructure/verify-alignment.sh
```

### Deploy Backend
```bash
./infrastructure/deploy.sh
```

### Deploy Frontends
```bash
# Clinic
cd apps/clinic-dashboard && npm run build
aws s3 sync dist/ s3://qivr-clinic-dashboard-staging --delete
aws cloudfront create-invalidation --distribution-id E1S9SAZB57T3C3 --paths "/*"

# Patient
cd apps/patient-portal && npm run build
aws s3 sync dist/ s3://qivr-patient-portal-staging --delete
aws cloudfront create-invalidation --distribution-id E39OVJDZIZ22QL --paths "/*"
```

### View Logs
```bash
aws logs tail /ecs/qivr_cluster/qivr-api --follow --region ap-southeast-2
```

### Seed Sample Data
```bash
# Get JWT from browser dev tools after login
AUTH_TOKEN="Bearer <token>" node infrastructure/seed-sample-data.mjs
```

## 📊 Key Resources

| Resource | Identifier |
|----------|-----------|
| ECS Cluster | qivr_cluster |
| ECS Service | qivr-api |
| RDS Instance | qivr-dev-db |
| ALB | qivr-alb |
| Clinic S3 | qivr-clinic-dashboard-staging |
| Patient S3 | qivr-patient-portal-staging |
| Clinic CloudFront | E1S9SAZB57T3C3 |
| Patient CloudFront | E39OVJDZIZ22QL |
| SNS Topic | qivr-staging-alerts |

## 🔐 Cognito

| Pool | ID | Client ID |
|------|-----|-----------|
| Clinic | ap-southeast-2_jbutB4tj1 | 4l510mm689hhpgr12prbuch2og |
| Patient | ap-southeast-2_ZMcriKNGJ | 4kugfmvk56o3otd0grc4gddi8r |

## 📈 Monitoring

**7 CloudWatch Alarms:**
- API 5xx errors > 10
- API response time > 2s
- DB connections > 80
- DB CPU > 80%
- DB storage < 5GB
- ECS CPU > 80%
- ECS Memory > 85%

**Alerts:** oliver@qivr.io

## 🚨 Troubleshooting

### 401 Errors
- Auto-user creation should handle this
- Check logs for "Found user" or "Creating user"
- Verify Cognito token is valid

### Frontend Not Loading
- Check CloudFront status
- Verify S3 bucket has files
- Check browser console for errors

### API Not Responding
- Check ECS service: 2/2 tasks running
- Check ALB target health
- View logs for errors

### Database Issues
- Verify RDS status: available
- Check connection string in appsettings
- Review CloudWatch DB metrics

## 📚 Documentation

- **System Audit:** SYSTEM-AUDIT-2025-11-06.md
- **Alignment Report:** SYSTEM-ALIGNMENT.md
- **CloudFront Details:** CLOUDFRONT-DEPLOYED.md
- **Implementation Summary:** IMPLEMENTATION-SUMMARY.md
- **Next Steps:** NEXT-STEPS.md
- **Infrastructure Guide:** infrastructure/README.md

## 💡 Tips

- Always invalidate CloudFront after frontend deploys
- Check CloudWatch alarms daily
- Keep JWT tokens fresh (they expire)
- Use HTTPS URLs for production
- Run verify-alignment.sh before major changes
