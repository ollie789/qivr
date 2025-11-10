# 🚀 QIVR CI/CD Quick Reference

## ⚡ Quick Commands
```bash
npm run deploy           # Full deployment
npm run deploy:backend   # Backend only
npm run deploy:frontend  # Frontend only
npm run status          # System health check
```

## 🔄 Automatic Deployments
- **Trigger**: Push to `main` branch
- **Manual**: GitHub Actions → "Deploy QIVR" → "Run workflow"

## 📍 Live URLs
- **Clinic Dashboard**: https://dwmqwnt4dy1td.cloudfront.net
- **Patient Portal**: https://d1jw6e1qiegavd.cloudfront.net

## 🔍 Monitoring
```bash
# Quick status
npm run status

# ECS service details
aws ecs describe-services --cluster qivr_cluster --services qivr-api --region ap-southeast-2

# View logs
aws logs tail /ecs/qivr-api --follow --region ap-southeast-2
```

## 🚨 Emergency Commands
```bash
# Force ECS redeploy
aws ecs update-service --cluster qivr_cluster --service qivr-api --force-new-deployment --region ap-southeast-2

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id E1S9SAZB57T3C3 --paths "/*" --region ap-southeast-2
aws cloudfront create-invalidation --distribution-id E39OVJDZIZ22QL --paths "/*" --region ap-southeast-2
```

## ✅ Deployment Checklist
- [ ] Code committed to `main`
- [ ] Tests passing
- [ ] GitHub Actions completed successfully
- [ ] Health checks passing
- [ ] URLs responding correctly
