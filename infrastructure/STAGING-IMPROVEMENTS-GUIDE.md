# Staging Environment Improvements Guide

This guide walks through implementing the recommended improvements from the system audit:
1. CloudFront distributions for HTTPS + caching
2. CloudWatch monitoring and alarms
3. Sample data seeding

## Option 1: Automated Terraform Deployment (Recommended)

### Prerequisites
- Terraform installed
- AWS CLI configured
- Email address for alerts

### Steps

1. **Review the Terraform configuration**
   ```bash
   cd infrastructure/terraform
   cat staging-improvements.tf
   ```

2. **Update alert email**
   ```bash
   # Edit staging-improvements.tfvars
   echo 'alert_email = "your-email@example.com"' > staging-improvements.tfvars
   ```

3. **Deploy infrastructure**
   ```bash
   cd /Users/oliver/Projects/qivr
   ./infrastructure/deploy-staging-improvements.sh
   ```

4. **Wait for CloudFront deployment** (~15-20 minutes)

5. **Confirm SNS email subscription** (check your email)

6. **Update frontend environment variables** (optional - for custom domains)

## Option 2: Manual AWS Console Setup

### A. CloudFront for Clinic Dashboard

1. **Go to CloudFront Console** → Create Distribution

2. **Origin Settings:**
   - Origin Domain: `qivr-clinic-dashboard-staging.s3.ap-southeast-2.amazonaws.com`
   - Origin Access: Origin Access Identity (create new)
   - Name: `clinic-dashboard-oai`

3. **Default Cache Behavior:**
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Allowed HTTP Methods: GET, HEAD, OPTIONS
   - Cache Policy: CachingOptimized
   - Compress objects: Yes

4. **Settings:**
   - Price Class: Use Only North America and Europe
   - Default Root Object: `index.html`

5. **Custom Error Responses:**
   - Add: 404 → 200, `/index.html` (for SPA routing)
   - Add: 403 → 200, `/index.html`

6. **Create Distribution** → Note the CloudFront URL

7. **Update S3 Bucket Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontOAI",
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity <OAI-ID>"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::qivr-clinic-dashboard-staging/*"
       }
     ]
   }
   ```

### B. CloudFront for Patient Portal

Repeat steps A.1-A.7 but use:
- Origin Domain: `qivr-patient-portal-staging.s3.ap-southeast-2.amazonaws.com`
- Bucket: `qivr-patient-portal-staging`

### C. CloudWatch Alarms

1. **Go to CloudWatch Console** → Alarms → Create Alarm

2. **Create these alarms:**

   **API 5xx Errors:**
   - Metric: ApplicationELB → HTTPCode_Target_5XX_Count
   - LoadBalancer: qivr-alb
   - Statistic: Sum
   - Period: 5 minutes
   - Threshold: > 10
   - Action: Send SNS notification

   **API Response Time:**
   - Metric: ApplicationELB → TargetResponseTime
   - LoadBalancer: qivr-alb
   - Statistic: Average
   - Period: 5 minutes
   - Threshold: > 2 seconds
   - Action: Send SNS notification

   **Database Connections:**
   - Metric: RDS → DatabaseConnections
   - DBInstance: qivr-dev-db
   - Statistic: Average
   - Period: 5 minutes
   - Threshold: > 80
   - Action: Send SNS notification

   **Database CPU:**
   - Metric: RDS → CPUUtilization
   - DBInstance: qivr-dev-db
   - Statistic: Average
   - Period: 5 minutes
   - Threshold: > 80%
   - Action: Send SNS notification

   **ECS CPU:**
   - Metric: ECS → CPUUtilization
   - ServiceName: qivr-api-service
   - ClusterName: qivr-cluster
   - Statistic: Average
   - Period: 5 minutes
   - Threshold: > 80%
   - Action: Send SNS notification

   **ECS Memory:**
   - Metric: ECS → MemoryUtilization
   - ServiceName: qivr-api-service
   - ClusterName: qivr-cluster
   - Statistic: Average
   - Period: 5 minutes
   - Threshold: > 85%
   - Action: Send SNS notification

3. **Create SNS Topic** for notifications:
   - Name: `qivr-staging-alerts`
   - Add email subscription: your-email@example.com
   - Confirm subscription via email

### D. HTTPS for ALB (Optional - requires domain)

1. **Request ACM Certificate:**
   - Go to ACM Console (us-east-1 for CloudFront, ap-southeast-2 for ALB)
   - Request public certificate
   - Domain: `api.qivr.health` (or your domain)
   - Validation: DNS or Email
   - Wait for validation

2. **Add HTTPS Listener to ALB:**
   - Go to EC2 → Load Balancers → qivr-alb
   - Add Listener: HTTPS:443
   - Default SSL Certificate: Select ACM certificate
   - Forward to: qivr-api-target-group

3. **Update Security Group:**
   - Allow inbound HTTPS (443) from 0.0.0.0/0

## Seeding Sample Data

### Method 1: Via API (Recommended)

1. **Log into clinic dashboard** to get auth token:
   ```bash
   # Open browser dev tools → Network tab
   # Log in as test.doctor@clinic.com
   # Copy JWT token from Authorization header
   ```

2. **Run seed script:**
   ```bash
   cd infrastructure
   AUTH_TOKEN="<your-jwt-token>" node seed-sample-data.mjs
   ```

### Method 2: Direct SQL (Requires VPC Access)

1. **Connect to RDS via bastion or VPN**

2. **Run SQL script:**
   ```bash
   psql "host=qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com port=5432 dbname=qivr user=qivr_admin password=<password>" -f database/seed-sample-data.sql
   ```

## Verification

### CloudFront
```bash
# Test HTTPS access
curl -I https://<cloudfront-domain>.cloudfront.net

# Should return 200 OK with HTTPS
```

### Monitoring
1. Go to CloudWatch Console → Alarms
2. Verify all alarms are in "OK" state
3. Check email for SNS confirmation

### Sample Data
1. Log into clinic dashboard
2. Navigate to Patients → Should see 3 patients
3. Navigate to Appointments → Should see 5 appointments
4. Open patient record → Should see medical records

## Updating Frontend URLs

After CloudFront is deployed, update frontend configs to use HTTPS:

**apps/clinic-dashboard/.env.production:**
```env
VITE_API_URL=http://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com
# Or with custom domain:
# VITE_API_URL=https://api.qivr.health
```

**apps/patient-portal/.env.production:**
```env
VITE_API_URL=http://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com
# Or with custom domain:
# VITE_API_URL=https://api.qivr.health
```

Then redeploy frontends:
```bash
cd apps/clinic-dashboard && npm run build
aws s3 sync dist/ s3://qivr-clinic-dashboard-staging --delete

cd ../patient-portal && npm run build
aws s3 sync dist/ s3://qivr-patient-portal-staging --delete
```

## Troubleshooting

### CloudFront returns 403
- Check S3 bucket policy allows CloudFront OAI
- Verify Origin Access Identity is configured
- Check bucket is not blocking public access (OAI bypasses this)

### Alarms not triggering
- Verify SNS topic subscription is confirmed
- Check alarm threshold values are appropriate
- Test by generating load/errors

### Sample data script fails
- Verify AUTH_TOKEN is valid (not expired)
- Check API endpoints exist and are accessible
- Review API logs for errors

## Next Steps

1. **Custom Domains:**
   - Register domain (e.g., qivr.health)
   - Create Route53 hosted zone
   - Add CloudFront aliases
   - Request ACM certificates
   - Update DNS records

2. **Enhanced Security:**
   - Move database password to Secrets Manager
   - Enable WAF on CloudFront
   - Add rate limiting
   - Enable CloudTrail logging

3. **Separate Environments:**
   - Create production RDS instance
   - Duplicate infrastructure for prod
   - Set up CI/CD pipeline
   - Implement blue-green deployments

## Cost Estimate

- CloudFront: ~$5-20/month (depends on traffic)
- CloudWatch Alarms: $0.10/alarm/month = ~$0.60/month
- SNS: $0.50/month (first 1000 emails free)
- **Total: ~$6-21/month additional**

## Support

For issues or questions:
- Check CloudWatch Logs: `/ecs/qivr/api`
- Review ECS task logs
- Check ALB access logs
- Contact: oliver@qivr.io
