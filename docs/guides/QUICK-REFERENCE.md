# Qivr Quick Reference

## URLs

### Production

| Service          | URL                      |
| ---------------- | ------------------------ |
| Clinic Dashboard | https://clinic.qivr.pro  |
| Patient Portal   | https://patient.qivr.pro |
| API              | https://api.qivr.pro     |
| Admin Portal     | https://admin.qivr.pro   |

### Local Development

| Service          | URL                           |
| ---------------- | ----------------------------- |
| Clinic Dashboard | http://localhost:3010         |
| Patient Portal   | http://localhost:3005         |
| API              | http://localhost:5050         |
| API Swagger      | http://localhost:5050/swagger |

## Common Commands

### Development

```bash
# Start all services
npm run dev

# Individual services
npm run clinic:dev      # Port 3010
npm run patient:dev     # Port 3005
npm run backend:dev     # Port 5050

# Database
npm run db:migrate
npm run db:seed
```

### Build & Test

```bash
npm run build           # Build all
npm run type-check      # TypeScript check
npm run lint            # Lint all
npm run test            # Run tests
```

### Deployment

```bash
npm run deploy              # Full deployment
npm run deploy:backend      # Backend only
npm run deploy:frontend     # Frontend only

# Manual frontend deploy
cd apps/clinic-dashboard && npm run build
aws s3 sync dist/ s3://qivr-clinic-dashboard-production --delete
aws cloudfront create-invalidation --distribution-id E1S9SAZB57T3C3 --paths "/*"
```

### Logs

```bash
# ECS logs
aws logs tail /ecs/qivr_cluster/qivr-api --follow --region ap-southeast-2

# Recent errors
aws logs filter-log-events --log-group-name /ecs/qivr_cluster/qivr-api \
  --filter-pattern "ERROR" --region ap-southeast-2
```

## AWS Resources

| Resource           | Identifier                       |
| ------------------ | -------------------------------- |
| ECS Cluster        | qivr_cluster                     |
| ECS Service        | qivr-api                         |
| RDS Instance       | qivr-production-db               |
| Clinic S3          | qivr-clinic-dashboard-production |
| Patient S3         | qivr-patient-portal-production   |
| Clinic CloudFront  | E1S9SAZB57T3C3                   |
| Patient CloudFront | E39OVJDZIZ22QL                   |

## Cognito Pools

| Pool    | Region         | Pool ID                  |
| ------- | -------------- | ------------------------ |
| Clinic  | ap-southeast-2 | ap-southeast-2_jbutB4tj1 |
| Patient | ap-southeast-2 | ap-southeast-2_ZMcriKNGJ |

## Database

```bash
# Connect to RDS (via SSM or bastion)
psql -h qivr-production-db.xxxxx.ap-southeast-2.rds.amazonaws.com \
     -U qivr_admin -d qivr

# Local postgres
psql -h localhost -U qivr_user -d qivr
```

## CI/CD

- **Build System:** AWS CodeBuild
- **Build Project:** qivr-build
- **Last Build SSM:** /qivr/last-successful-build

```bash
# Check last successful build
aws ssm get-parameter --name /qivr/last-successful-build --query 'Parameter.Value' --output text

# Trigger build
aws codebuild start-build --project-name qivr-build
```

## Monitoring

### CloudWatch Alarms

- API 5xx errors > 10
- API response time > 2s
- DB connections > 80
- DB CPU > 80%
- ECS CPU > 80%
- ECS Memory > 85%

### Health Check

```bash
curl https://api.qivr.pro/health
```

## Troubleshooting

### 401 Unauthorized

- Check Cognito token validity
- Verify X-Tenant-Id header
- Check user exists in database

### 500 Errors

- Check ECS logs for stack trace
- Verify database connectivity
- Check RDS CPU/connections

### Frontend Not Updating

- Clear CloudFront cache
- Check S3 sync completed
- Verify build succeeded

### Database Issues

```bash
# Check connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity
WHERE state = 'idle' AND query_start < now() - interval '1 hour';
```
