# AWS Cognito Configuration

> This reference is only required when you disable the local mock provider. See [authentication.md](./authentication.md) for switching between DevAuth and Cognito.

## User Pools

### Patient Portal
- **User Pool Name**: qivr-patient-pool
- **User Pool ID**: ap-southeast-2_ZMcriKNGJ
- **App Client Name**: qivr-patient-portal
- **App Client ID**: 4kugfmvk56o3otd0grc4gddi8r
- **Client Type**: Public (no client secret)
- **Region**: ap-southeast-2

### Clinic Dashboard
- **User Pool Name**: qivr-clinic-pool
- **User Pool ID**: ap-southeast-2_jbutB4tj1
- **App Client Name**: qivr-clinic-dashboard  
- **App Client ID**: 4l510mm689hhpgr12prbuch2og
- **Client Type**: Public (no client secret)
- **Region**: ap-southeast-2

## Environment Variables

All necessary environment variables have been set up in:
- `.env` - Root configuration for backend
- `apps/patient-portal/.env` - Patient portal specific
- `apps/clinic-dashboard/.env` - Clinic dashboard specific

## Testing Authentication

### Create Test Users

1. **Patient Portal User**:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_ZMcriKNGJ \
  --username test-patient@example.com \
  --user-attributes Name=email,Value=test-patient@example.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --region ap-southeast-2
```

2. **Clinic Dashboard User**:
```bash
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_jbutB4tj1 \
  --username test-clinician@example.com \
  --user-attributes Name=email,Value=test-clinician@example.com Name=email_verified,Value=true Name="custom:role",Value="Clinician" \
  --temporary-password "TempPass123!" \
  --region ap-southeast-2
```

## Running the Application

1. **Start Backend Services**:
```bash
docker-compose up -d
cd backend
dotnet run
```

2. **Start Patient Portal** (in new terminal):
```bash
cd apps/patient-portal
npm run dev
# Opens at http://localhost:5173
```

3. **Start Clinic Dashboard** (in new terminal):
```bash
cd apps/clinic-dashboard
npm run dev  
# Opens at http://localhost:5174
```

## Authentication Flow

1. Users sign up/sign in through the respective portal
2. AWS Cognito handles authentication
3. JWT tokens are managed by AWS Amplify
4. Automatic token refresh is configured
5. Backend validates tokens using Cognito public keys

## Troubleshooting

- If you get CORS errors, ensure the backend is running and the API_URL is correct
- Check browser console for Amplify initialization errors
- Verify AWS credentials with `aws sts get-caller-identity`
- Check Cognito User Pool settings in AWS Console

## Next Steps

1. Configure password policies in Cognito console
2. Set up MFA if required
3. Configure email templates for verification
4. Add custom attributes as needed
5. Set up Identity Pool if federated access is needed
