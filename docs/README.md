# Qivr Documentation

## 📚 Essential Documentation

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Deployment Guide](DEPLOYMENT.md) - Production deployment instructions
- [Testing Guide](testing.md) - Running tests and test suite

### Architecture & Patterns
- [MVP Milestone](MVP-MILESTONE.md) - Complete architecture overview and feature list
- [React Query Patterns](REACT-QUERY-PATTERNS.md) - State management best practices
- [Cache Invalidation](CACHE-INVALIDATION-FIX.md) - Cache management implementation
- [Database Schema](DATABASE-SCHEMA.md) - Database structure and relationships

### Quick References
- [Quick Reference](QUICK-REFERENCE.md) - Common commands and workflows
- [API Routes](API-ROUTES.md) - API endpoint documentation

### Development Guides
- [Authentication](authentication.md) - Auth flow and Cognito setup
- [Development Setup](development.md) - Local development environment
- [Operations](operations.md) - Production operations guide
- [Security](security.md) - Security best practices

## 🏗️ Application Documentation

### Frontend Applications
- [Clinic Dashboard](../apps/clinic-dashboard/README.md)
- [Patient Portal](../apps/patient-portal/README.md)

### Backend
- [Backend API](../backend/README.md)

### Infrastructure
- [AWS Infrastructure](../aws/README.md)
- [Infrastructure Setup](../infrastructure/README.md)

### Database
- [Database Documentation](../database/README.md)

## 🧪 Testing

Main test suite: `scripts/tests/test-live-system.mjs`

Run tests:
```bash
npm run test
# or
node scripts/tests/test-live-system.mjs
```

## 📝 Notes

All archived documentation, old migration guides, and development session logs have been removed to keep the documentation clean and focused on current production architecture.

For historical context, refer to git history.
