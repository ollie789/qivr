# AWS CloudFront CDN Deployment Documentation

## 🎉 Deployment Status: COMPLETE

Your Qivr Healthcare Platform is now served through AWS CloudFront CDN with global edge locations.

## 📊 Deployment Details

| Property | Value |
|----------|-------|
| **CloudFront Distribution ID** | `E3FLVI4BERYZC1` |
| **CloudFront Domain** | `https://d32jbljwhg0xrt.cloudfront.net` |
| **S3 Bucket** | `qivr-static-assets-production-818084701597` |
| **AWS Region** | `us-east-1` (CloudFront is global) |
| **Stack Name** | `qivr-cdn-simple` |
| **Deployment Date** | September 8, 2025 |

## 🌐 Application URLs

- **Main CDN**: https://d32jbljwhg0xrt.cloudfront.net
- **Patient Portal**: https://d32jbljwhg0xrt.cloudfront.net/patient-portal/
- **Clinic Dashboard**: https://d32jbljwhg0xrt.cloudfront.net/clinic-dashboard/
- **Widget**: https://d32jbljwhg0xrt.cloudfront.net/widget/

## ✅ Features Enabled

### Performance
- ✅ **HTTP/2 and HTTP/3** support for multiplexing
- ✅ **Automatic Compression** (Gzip/Brotli)
- ✅ **Edge Caching** at 450+ locations worldwide
- ✅ **Optimized Cache Policies** for different asset types
- ✅ **Long-term caching** for static assets (JS, CSS, images)
- ✅ **No-cache headers** for HTML files

### Security
- ✅ **HTTPS Only** with TLS 1.2+ minimum
- ✅ **Origin Access Control (OAC)** - Latest S3 security
- ✅ **Security Headers**:
  - Strict-Transport-Security (HSTS)
  - X-Frame-Options: SAMEORIGIN
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection
  - Referrer-Policy
- ✅ **S3 Bucket Encryption** (AES256)
- ✅ **Private S3 Bucket** (no public access)

### Reliability
- ✅ **99.99% Availability SLA**
- ✅ **Automatic Failover**
- ✅ **S3 Versioning** enabled
- ✅ **30-day retention** for old versions

## 🚀 Quick Commands

### Deploy Updates
```bash
# Build and sync all apps
npm run build
./scripts/sync-to-s3.sh

# Sync specific app
aws s3 sync apps/patient-portal/dist s3://qivr-static-assets-production-818084701597/patient-portal/ --delete --region us-east-1
```

### Cache Invalidation
```bash
# Invalidate all files
aws cloudfront create-invalidation --distribution-id E3FLVI4BERYZC1 --paths "/*"

# Invalidate specific path
aws cloudfront create-invalidation --distribution-id E3FLVI4BERYZC1 --paths "/patient-portal/*"
```

### Monitor Performance
```bash
# Check distribution status
aws cloudfront get-distribution --id E3FLVI4BERYZC1 --query "Distribution.Status"

# View CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/CloudFront \
  --metric-name Requests \
  --dimensions Name=DistributionId,Value=E3FLVI4BERYZC1 \
  --start-time 2025-09-07T00:00:00Z \
  --end-time 2025-09-08T23:59:59Z \
  --period 3600 \
  --statistics Sum
```

### Stack Management
```bash
# Update stack
aws cloudformation update-stack \
  --stack-name qivr-cdn-simple \
  --template-body file://infrastructure/cloudfront/cloudfront-simple.yaml \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Delete stack (WARNING: Deletes everything)
aws cloudformation delete-stack --stack-name qivr-cdn-simple --region us-east-1
```

## 📈 Performance Metrics

Based on CloudFront's global network:
- **Average Latency**: ~50ms globally
- **Cache Hit Ratio**: Expected 85-95% for static assets
- **Data Transfer**: Optimized with compression
- **Availability**: 99.99% SLA

## 🔧 Configuration Files

### React Apps Configuration
Update your environment variables:
```env
VITE_CDN_URL=https://d32jbljwhg0xrt.cloudfront.net
VITE_CLOUDFRONT_ID=E3FLVI4BERYZC1
```

### Using CDN in React Components
```typescript
import { getCDNUrl, getOptimizedImageUrl } from '@/config/cdn.config';

// Get CDN URL for any asset
const assetUrl = getCDNUrl('/images/logo.png');

// Get optimized image with specific width
const imageUrl = getOptimizedImageUrl('/images/hero.jpg', { 
  width: 1920,
  format: 'webp'
});
```

## 🎯 Next Steps

### 1. Custom Domain (Optional)
To use `cdn.qivr.health` instead of the CloudFront domain:
1. Request an ACM certificate in us-east-1
2. Update the CloudFormation stack with the certificate ARN
3. Create a CNAME record pointing to the CloudFront domain

### 2. Image Optimization
Run the image optimization script to generate WebP/AVIF formats:
```bash
npm install sharp glob
node scripts/optimize-images.js
```

### 3. Monitoring
Set up CloudWatch dashboards to monitor:
- Request rates
- Cache hit/miss ratios
- Error rates
- Origin latency
- Data transfer

### 4. Cost Optimization
- Consider using CloudFront price classes to limit edge locations
- Monitor data transfer costs
- Use S3 Intelligent-Tiering for infrequently accessed files

## 📊 Cost Estimation

Based on typical usage:
- **CloudFront Data Transfer**: $0.085/GB (first 10TB)
- **S3 Storage**: $0.023/GB per month
- **CloudFront Requests**: $0.0075 per 10,000 HTTPS requests
- **Estimated Monthly Cost**: $50-200 for moderate traffic

## 🔒 Security Best Practices

1. **Never expose S3 bucket publicly** - Always use CloudFront OAC
2. **Enable AWS WAF** for DDoS protection (additional cost)
3. **Use signed URLs** for private content
4. **Enable CloudTrail** for audit logging
5. **Regular security reviews** of bucket policies

## 🆘 Troubleshooting

### Issue: 403 Forbidden
- Check S3 bucket policy allows CloudFront
- Verify OAC is properly configured
- Ensure files exist in S3

### Issue: Slow Performance
- Check cache hit ratio in CloudWatch
- Verify compression is enabled
- Consider closer edge locations

### Issue: CORS Errors
- Update S3 CORS configuration
- Check CloudFront CORS headers
- Verify origin request policies

## 📚 Resources

- [CloudFront Documentation](https://docs.aws.amazon.com/cloudfront/)
- [CloudFront Best Practices](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/best-practices.html)
- [S3 + CloudFront Integration](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/PrivateContent.html)
- [CloudWatch Metrics](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/monitoring-using-cloudwatch.html)

---

**Deployment completed successfully!** Your applications are now served globally with optimal performance and security through AWS CloudFront CDN.
