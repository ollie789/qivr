# QIVR TODO - Fresh List

**Date:** November 7, 2025, 10:53 AM AEDT  
**Current Status:** All infrastructure operational ✅

---

## ✅ WHAT'S WORKING

- Backend API: 2/2 tasks running
- Database: qivr-dev-db available
- CloudFront HTTPS: Both deployed
- Monitoring: 7 alarms active
- Features: PROMs, Documents, Messages, Appointments all implemented

---

## 🎯 WHAT TO DO NOW

### 1️⃣ Test & Verify (30 min)

**A. Test HTTPS Access**
```bash
# Open in browser
https://dwmqwnt4dy1td.cloudfront.net      # Clinic
https://d1jw6e1qiegavd.cloudfront.net     # Patient
```
- [ ] Clinic dashboard loads
- [ ] Patient portal loads
- [ ] Login works on both
- [ ] No console errors

**B. Seed Sample Data**
```bash
# 1. Log into clinic dashboard
# 2. Open DevTools → Network tab → Copy JWT token
# 3. Run:
cd /Users/oliver/Projects/qivr/infrastructure
AUTH_TOKEN="Bearer <your-token>" node seed-sample-data.mjs
```
- [ ] Script runs successfully
- [ ] 3 patients created
- [ ] 5 appointments created
- [ ] Data visible in dashboard

**C. Test Features End-to-End**
- [ ] Send PROM from clinic → Complete in patient portal
- [ ] Upload document in clinic → View in patient portal
- [ ] Send message from clinic → Reply from patient portal
- [ ] Create appointment in clinic → View in patient portal

---

### 2️⃣ Production Readiness (This Week)

**A. Update Cognito Callback URLs** ⏱️ 10 min
```bash
# Clinic
aws cognito-idp update-user-pool-client \
  --user-pool-id ap-southeast-2_jbutB4tj1 \
  --client-id 4l510mm689hhpgr12prbuch2og \
  --callback-urls "https://dwmqwnt4dy1td.cloudfront.net" \
  --logout-urls "https://dwmqwnt4dy1td.cloudfront.net" \
  --region ap-southeast-2

# Patient
aws cognito-idp update-user-pool-client \
  --user-pool-id ap-southeast-2_ZMcriKNGJ \
  --client-id 4kugfmvk56o3otd0grc4gddi8r \
  --callback-urls "https://d1jw6e1qiegavd.cloudfront.net" \
  --logout-urls "https://d1jw6e1qiegavd.cloudfront.net" \
  --region ap-southeast-2
```
- [ ] Update clinic callbacks
- [ ] Update patient callbacks
- [ ] Test login via HTTPS

**B. Enable Database Backups** ⏱️ 5 min
```bash
aws rds modify-db-instance \
  --db-instance-identifier qivr-dev-db \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --region ap-southeast-2
```
- [ ] Enable automated backups
- [ ] Verify backup window set

**C. Move Database Password to Secrets Manager** ⏱️ 30 min
```bash
# 1. Create secret
aws secretsmanager create-secret \
  --name qivr/database/password \
  --secret-string "Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=" \
  --region ap-southeast-2

# 2. Update backend to read from Secrets Manager (already configured)
# 3. Remove password from appsettings.Production.json
# 4. Redeploy backend
```
- [ ] Create secret
- [ ] Update backend config
- [ ] Test connection
- [ ] Remove plaintext password

---

### 3️⃣ Optional Enhancements

**A. Custom Domains** ⏱️ 2-3 hours
*Only if you have/want to register a domain*

**B. HTTPS on ALB** ⏱️ 1 hour
*Only if you set up custom domain for API*

**C. Separate Production Environment** ⏱️ 4+ hours
*Only when ready to go live with real users*

---

## 📋 Priority Order

**Today:**
1. Test HTTPS URLs (5 min)
2. Seed sample data (10 min)
3. Test all features (15 min)

**This Week:**
1. Update Cognito callbacks (10 min)
2. Enable database backups (5 min)
3. Move secrets to Secrets Manager (30 min)

**When Ready for Production:**
1. Custom domains
2. HTTPS on ALB
3. Separate prod environment
4. CI/CD pipeline

---

## 🚀 Quick Start Commands

```bash
# Verify everything is working
./infrastructure/verify-alignment.sh

# Test HTTPS
open https://dwmqwnt4dy1td.cloudfront.net
open https://d1jw6e1qiegavd.cloudfront.net

# Seed data (get token from browser first)
cd infrastructure
AUTH_TOKEN="Bearer <token>" node seed-sample-data.mjs

# Check logs
aws logs tail /ecs/qivr_cluster/qivr-api --follow --region ap-southeast-2

# View monitoring
open https://console.aws.amazon.com/cloudwatch/home?region=ap-southeast-2#alarmsV2:
```

---

## ✅ Success Checklist

**Immediate:**
- [ ] HTTPS URLs tested and working
- [ ] Sample data seeded
- [ ] All features tested end-to-end
- [ ] No errors in CloudWatch

**This Week:**
- [ ] Cognito callbacks updated
- [ ] Database backups enabled
- [ ] Secrets in Secrets Manager
- [ ] System ready for real users

---

## 📞 Need Help?

- Check logs: `aws logs tail /ecs/qivr_cluster/qivr-api --follow --region ap-southeast-2`
- Run verification: `./infrastructure/verify-alignment.sh`
- Review docs: `SYSTEM-ALIGNMENT.md`, `FEATURES-COMPLETE.md`

---

**Bottom Line:** System is operational. Just need to test, seed data, and do basic security hardening.
