# AWS Configuration Audit Report
## Date: October 1, 2025

## 🔴 CRITICAL ISSUES FOUND

### 1. **HARDCODED PASSWORD IN appsettings.Production.json**
- **File**: `/backend/Qivr.Api/appsettings.Production.json`
- **Line 3**: Contains hardcoded database password
- **Risk**: HIGH - Password exposed in source code
- **Action Required**: Remove immediately and use environment variable

### 2. **Missing Critical Environment Variables**
The following variables are referenced in code but NOT set in Elastic Beanstalk:

| Variable | Purpose | Current Status | Required Value |
|----------|---------|----------------|----------------|
| `JWT_SECRET_KEY` | JWT token signing | ❌ MISSING | Generate secure key |
| `SQS_QUEUE_URL` | Message queue | ❌ MISSING | Create SQS queue |
| `MESSAGE_MEDIA_API_KEY` | SMS service | ❌ MISSING | Get from MessageMedia |
| `MESSAGE_MEDIA_API_SECRET` | SMS service | ❌ MISSING | Get from MessageMedia |
| `S3_ACCESS_KEY` | File storage | ❌ MISSING | Use IAM role instead |
| `S3_SECRET_KEY` | File storage | ❌ MISSING | Use IAM role instead |
| `Intake__ConnectionString` | Intake DB | ❌ MISSING | Set to RDS connection |
| `Email__*` | Email config | ❌ MISSING | Configure SES/SendGrid |
| `Cognito__UserPoolClientSecret` | Auth secret | ❌ MISSING | Get from Cognito |

## ✅ Currently Configured Variables

| Variable | Status | Value Source |
|----------|--------|--------------|
| `ASPNETCORE_ENVIRONMENT` | ✅ Set | Production |
| `DATABASE_URL` | ✅ Set | RDS endpoint |
| `ConnectionStrings__DefaultConnection` | ✅ Set | RDS connection string |
| `COGNITO_REGION` | ✅ Set | ap-southeast-2 |
| `COGNITO_USER_POOL_ID` | ✅ Set | Cognito User Pool |
| `COGNITO_CLIENT_ID` | ✅ Set | Cognito Client |

## 🟡 AWS Secrets Manager Status

### Configured Secrets (Need Updates):
1. **qivr/development/database/master**
   - ❌ Host is "localhost" - should be RDS endpoint
   - ✅ Username/password configured

2. **qivr/development/jwt/secret**
   - ⚠️ Binary format - needs to be accessible string

3. **qivr/development/email/config**
   - ❌ Using localhost - needs AWS SES or SendGrid

4. **qivr/development/s3/config**
   - ❌ Using localhost/minioadmin - needs AWS S3 config

5. **qivr/development/sqs/config**
   - ❌ QueueUrl is empty - needs SQS queue URL

6. **qivr/development/sms/config**
   - ❌ API keys are empty - needs MessageMedia or Twilio

## 📋 Required Actions

### Immediate Actions:
1. **REMOVE hardcoded password from appsettings.Production.json**
2. **Generate JWT secret key**
3. **Create SQS queue for async processing**
4. **Update database secret with RDS endpoint**

### Configuration Script Needed:
```bash
# Set missing environment variables
aws elasticbeanstalk update-environment \
  --environment-name qivr-api-staging-prod \
  --region ap-southeast-2 \
  --option-settings \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=JWT_SECRET_KEY,Value="[GENERATE-256-BIT-KEY]" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__Provider,Value="ses" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=Email__FromEmail,Value="noreply@qivr.health" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=S3__BucketName,Value="qivr-uploads-staging" \
    Namespace=aws:elasticbeanstalk:application:environment,OptionName=App__BaseUrl,Value="http://qivr-patient-portal-staging.s3-website-ap-southeast-2.amazonaws.com"
```

## 🔐 Security Recommendations

1. **Use AWS Systems Manager Parameter Store** instead of environment variables for sensitive data
2. **Enable AWS Secrets Manager rotation** for database passwords
3. **Use IAM roles** instead of access keys for S3
4. **Implement secret versioning** for audit trails

## 📊 Configuration Sources Priority

The application should read configuration in this order:
1. AWS Secrets Manager (highest priority)
2. Environment Variables 
3. appsettings.Production.json
4. appsettings.json (lowest priority)

## 🚨 Critical Security Issues

### Issue #1: Exposed Database Password
```json
// appsettings.Production.json - LINE 3
"Password=Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY="
```
**This must be removed immediately!**

### Issue #2: No JWT Secret Configured
- JWT tokens cannot be validated without secret key
- Authentication will fail

### Issue #3: Secrets Not Properly Structured
- Most secrets in Secrets Manager have placeholder/localhost values
- Need to update with production values

## 📝 Complete Variable Mapping

| Config Key | Source | Current Value | Required Action |
|------------|--------|---------------|-----------------|
| **Database** |
| ConnectionStrings__DefaultConnection | ✅ Env Var | RDS connection | None |
| DATABASE_URL | ✅ Env Var | PostgreSQL URL | None |
| Intake__ConnectionString | ❌ Missing | - | Add env var |
| **Authentication** |
| JWT_SECRET_KEY | ❌ Missing | - | Generate & set |
| Cognito__Region | ✅ Env Var | ap-southeast-2 | None |
| Cognito__UserPoolId | ✅ Env Var | Configured | None |
| Cognito__UserPoolClientId | ✅ Env Var | Configured | None |
| Cognito__UserPoolClientSecret | ❌ Missing | - | Get from AWS |
| AWS__Cognito__PatientPool__* | ❌ Missing | - | Add env vars |
| **Messaging** |
| SQS_QUEUE_URL | ❌ Missing | - | Create queue |
| MESSAGE_MEDIA_API_KEY | ❌ Missing | - | Get API key |
| MESSAGE_MEDIA_API_SECRET | ❌ Missing | - | Get secret |
| **Storage** |
| S3__BucketName | ❌ Missing | - | Create bucket |
| S3__AccessKey | ❌ Not needed | - | Use IAM role |
| S3__SecretKey | ❌ Not needed | - | Use IAM role |
| **Email** |
| Email__Provider | ❌ Missing | - | Set to "ses" |
| Email__SmtpHost | ❌ Missing | - | SES endpoint |
| Email__FromEmail | ❌ Missing | - | Verified email |
| **Application** |
| App__BaseUrl | ❌ Missing | - | Frontend URL |
| CORS_ALLOWED_ORIGINS | ❌ Missing | - | Frontend URLs |

## 🛠️ Next Steps

1. **Run security fix script** (remove hardcoded password)
2. **Generate and set JWT secret**
3. **Create AWS resources** (SQS queue, S3 bucket)
4. **Update Secrets Manager** with production values
5. **Set all missing environment variables**
6. **Test authentication flow**

---
*This audit identified 9 critical missing configurations and 1 major security issue that need immediate attention.*