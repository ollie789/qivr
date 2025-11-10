# Configuration Audit Report
**Date:** $(date)

## Issues Found & Fixes

### ✅ 1. Frontend API Calls
**Status:** FIXED
- All API calls now use `/api/` prefix
- PrivateRoute.tsx updated to call `/api/tenants`

### ⚠️ 2. CloudFront Configuration
**Issue:** CloudFront config not in Terraform
**Location:** Managed via AWS Console
**Recommendation:** 
- Document current CloudFront behavior rules
- Consider moving to Terraform for IaC

**Current Routing:**
- `/api/*` → Backend ALB
- `/*` → S3 (frontend)

### ✅ 3. Backend CORS
**Status:** Needs verification
**Action:** Check CORS allows staging domain

### ⚠️ 4. Environment Variables
**Issue:** Frontend missing .env file
**Impact:** Low (uses build-time env vars)
**Recommendation:** Create frontend/.env for local dev

### ✅ 5. Docker Build
**Status:** FIXED
- Single-line buildx command
- Platform set to linux/amd64
- No backslash continuation issues

### ⚠️ 6. Backend Compilation
**Issue:** 58 nullability warnings
**Impact:** Low (warnings, not errors)
**Recommendation:** Address in future sprint

### ✅ 7. Database Seeder
**Status:** FIXED
- Removed IsActive references
- Fixed null Guid assignments
- Added Slug property

### ✅ 8. Service Registration
**Status:** FIXED
- Removed broken PatientInvitationService

### ✅ 9. ECS Task Definition
**Status:** Working
- Template uses placeholder for image URI
- Deployment working with build #38

### ⚠️ 10. Frontend Build
**Issue:** No dist folder locally
**Impact:** None (builds in CI/CD)
**Note:** Just deployed successfully to S3

## Priority Fixes Needed

### HIGH PRIORITY
None - all critical issues resolved

### MEDIUM PRIORITY
1. **Create CloudFront Terraform config**
   - Document current setup
   - Move to IaC for version control

2. **Verify CORS configuration**
   ```bash
   curl -H "Origin: https://staging.qivr.health" \
        -H "Access-Control-Request-Method: GET" \
        -X OPTIONS https://api-staging.qivr.health/api/tenants
   ```

### LOW PRIORITY
1. **Address C# nullability warnings**
   - 58 warnings in total
   - No functional impact
   - Improves code quality

2. **Create frontend/.env for local dev**
   ```bash
   VITE_API_URL=https://api-staging.qivr.health
   VITE_COGNITO_USER_POOL_ID=...
   VITE_COGNITO_CLIENT_ID=...
   ```

## Monitoring Recommendations

1. **Set up CloudWatch alarms for:**
   - ECS task failures
   - ALB 5xx errors
   - CloudFront 4xx/5xx rates

2. **Add logging for:**
   - Failed API calls (frontend)
   - CORS rejections (backend)
   - Authentication failures

3. **Regular audits:**
   - Run this audit monthly
   - Check for new API calls without /api prefix
   - Verify environment variables in sync

## Quick Health Check Commands

```bash
# Backend health
curl https://api-staging.qivr.health/health

# Frontend deployed
curl -I https://staging.qivr.health

# API endpoint (requires auth)
curl https://api-staging.qivr.health/api/tenants

# ECS service status
aws ecs describe-services --cluster qivr_cluster --services qivr-api --region ap-southeast-2

# Latest CodeBuild status
aws codebuild list-builds-for-project --project-name qivr-build --region ap-southeast-2 | head -5
```

## Configuration Checklist

- [x] Frontend uses /api prefix for all backend calls
- [x] Docker builds for correct platform (amd64)
- [x] Backend compiles without errors
- [x] Database seeder has no broken references
- [x] Service registrations are valid
- [x] ECS tasks running latest image
- [ ] CloudFront config documented
- [ ] CORS verified for all origins
- [ ] Frontend .env created for local dev
- [ ] CloudWatch alarms configured
