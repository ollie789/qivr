# QIVR TODO LIST

## 🚨 CRITICAL - Patient SES Integration
- **Issue**: Patient Cognito pool still using COGNITO_DEFAULT (50 emails/day limit)
- **Impact**: Patient registration/password reset will fail after 50/day
- **Solution**: Configure patient pool with verified SES identity
- **Status**: SES identity verification pending
- **Priority**: HIGH - blocks patient onboarding at scale

## 🔧 Patient Dashboard
- **Issue**: Patient dashboard overview endpoint returns 500 error
- **Impact**: Patient dashboard partially broken
- **Solution**: Fix Provider computed properties in LINQ queries
- **Status**: 95% complete, one endpoint remaining
- **Priority**: MEDIUM - workaround available

## 📋 Future Enhancements
- Multi-language patient portal support
- Advanced analytics missing endpoints
- Patient portal mobile app optimization
