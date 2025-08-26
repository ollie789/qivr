# AWS Cognito Setup Guide for Qivr

This guide walks you through setting up AWS Cognito User Pools for the Qivr healthcare platform.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Infrastructure Deployment](#infrastructure-deployment)
- [OAuth Provider Setup](#oauth-provider-setup)
- [Email Configuration](#email-configuration)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

## Prerequisites

1. **AWS Account**: You need an AWS account with appropriate permissions
2. **AWS CLI**: Install and configure AWS CLI
   ```bash
   brew install awscli  # macOS
   aws configure
   ```
3. **Terraform**: Install Terraform
   ```bash
   brew install terraform  # macOS
   ```
4. **Domain Verification**: Verify your email domain in AWS SES

## Infrastructure Deployment

### 1. Deploy Cognito Infrastructure

Run the deployment script from the infrastructure directory:

```bash
cd infrastructure
./deploy.sh dev
```

This will:
- Create two Cognito User Pools (Patient and Clinic Staff)
- Configure custom attributes for healthcare data
- Set up identity pools for AWS resource access
- Generate .env files for both applications

### 2. Verify Deployment

After deployment, you'll receive:
- User Pool IDs
- App Client IDs
- Hosted UI domains
- Environment configuration files

## OAuth Provider Setup

### Google OAuth Setup

1. **Create Google OAuth Credentials**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google+ API
   - Create OAuth 2.0 credentials

2. **Configure OAuth Client**:
   ```
   Application Type: Web application
   Authorized JavaScript origins:
   - https://qivr-patient-dev.auth.ap-southeast-2.amazoncognito.com
   
   Authorized redirect URIs:
   - https://qivr-patient-dev.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
   ```

3. **Update Terraform Variables**:
   ```bash
   export TF_VAR_google_client_id="your-google-client-id"
   export TF_VAR_google_client_secret="your-google-client-secret"
   ```

### Facebook OAuth Setup

1. **Create Facebook App**:
   - Go to [Facebook Developers](https://developers.facebook.com)
   - Create new app
   - Add Facebook Login product

2. **Configure Facebook Login**:
   ```
   Valid OAuth Redirect URIs:
   - https://qivr-patient-dev.auth.ap-southeast-2.amazoncognito.com/oauth2/idpresponse
   ```

3. **Update Terraform Variables**:
   ```bash
   export TF_VAR_facebook_app_id="your-facebook-app-id"
   export TF_VAR_facebook_app_secret="your-facebook-app-secret"
   ```

4. **Re-run Terraform**:
   ```bash
   cd infrastructure/terraform
   terraform apply
   ```

## Email Configuration

### AWS SES Setup

1. **Verify Email Domain**:
   ```bash
   aws ses verify-domain-identity --domain qivr.health
   ```

2. **Verify Email Address** (for testing):
   ```bash
   aws ses verify-email-identity --email-address noreply@qivr.health
   ```

3. **Request Production Access**:
   - By default, SES is in sandbox mode
   - Request production access through AWS Console

### Custom Email Templates

Email templates are configured in Cognito for:
- Welcome emails
- Verification codes
- Password reset
- MFA setup

## User Pool Features

### Patient Portal Pool
- **MFA**: Optional (users can enable)
- **Sign-in**: Email address
- **Social Login**: Google, Facebook
- **Custom Attributes**:
  - tenant_id
  - date_of_birth
  - medicare_number
  - private_health_fund
  - emergency_contact

### Clinic Staff Pool
- **MFA**: Required (TOTP)
- **Sign-in**: Email address
- **Social Login**: Disabled for security
- **Custom Attributes**:
  - tenant_id (required)
  - clinic_id (required)
  - role (required)
  - employee_id
  - license_number
  - specialization
  - department

## Testing

### Test User Creation

1. **Create Patient User**:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id <patient-pool-id> \
     --username test.patient@example.com \
     --user-attributes \
       Name=email,Value=test.patient@example.com \
       Name=given_name,Value=Test \
       Name=family_name,Value=Patient \
     --temporary-password "TempPass123!"
   ```

2. **Create Clinic Staff User**:
   ```bash
   aws cognito-idp admin-create-user \
     --user-pool-id <clinic-pool-id> \
     --username dr.test@clinic.com \
     --user-attributes \
       Name=email,Value=dr.test@clinic.com \
       Name=given_name,Value=Dr \
       Name=family_name,Value=Test \
       Name=custom:tenant_id,Value=tenant-123 \
       Name=custom:clinic_id,Value=clinic-456 \
       Name=custom:role,Value=practitioner \
     --temporary-password "TempPass123!"
   ```

### Test Authentication Flow

1. **Start Applications**:
   ```bash
   # Terminal 1 - Patient Portal
   cd apps/patient-portal
   npm run dev
   
   # Terminal 2 - Clinic Dashboard
   cd apps/clinic-dashboard
   npm run dev
   ```

2. **Test Login**:
   - Patient Portal: http://localhost:3002
   - Clinic Dashboard: http://localhost:3001

## Lambda Functions

The infrastructure includes Lambda functions for:

### Pre-Signup
- Validates user registration
- Assigns tenant IDs
- Enforces business rules

### Post-Confirmation
- Creates user records in database
- Sends welcome emails
- Initializes user preferences

### Custom Message
- Customizes verification emails
- Formats SMS messages
- Handles multi-language support

## Security Best Practices

1. **Password Policy**:
   - Patients: 8+ characters, mixed case, numbers, symbols
   - Clinic Staff: 10+ characters, stricter requirements

2. **MFA**:
   - Required for all clinic staff
   - Optional but recommended for patients

3. **Token Expiration**:
   - Patient tokens: 1 hour access, 30 days refresh
   - Clinic tokens: 30 minutes access, 8 hours refresh

4. **Advanced Security**:
   - Compromised credentials detection
   - Adaptive authentication
   - Risk-based authentication

## Troubleshooting

### Common Issues

1. **"User pool does not exist"**
   - Ensure Terraform deployment completed successfully
   - Check AWS region matches configuration

2. **"Invalid redirect URI"**
   - Verify callback URLs in app client configuration
   - Ensure URLs match exactly (including trailing slashes)

3. **"Email not verified"**
   - Check SES configuration
   - Verify sender email is verified
   - Check spam folder for verification emails

4. **"MFA setup required"**
   - Clinic staff must set up MFA on first login
   - Use authenticator app (Google Authenticator, Authy)

### Debug Commands

```bash
# List user pools
aws cognito-idp list-user-pools --max-results 10

# Describe user pool
aws cognito-idp describe-user-pool --user-pool-id <pool-id>

# List users
aws cognito-idp list-users --user-pool-id <pool-id>

# Check user attributes
aws cognito-idp admin-get-user \
  --user-pool-id <pool-id> \
  --username <email>
```

## Production Checklist

- [ ] Verify custom domain for hosted UI
- [ ] Configure WAF rules for protection
- [ ] Enable CloudWatch logging
- [ ] Set up CloudWatch alarms
- [ ] Configure backup and recovery
- [ ] Review and adjust rate limits
- [ ] Enable account takeover protection
- [ ] Configure custom email sender
- [ ] Set up monitoring dashboards
- [ ] Document admin procedures

## Support

For issues or questions:
- Check AWS Cognito documentation
- Review CloudWatch logs
- Contact AWS support for infrastructure issues
