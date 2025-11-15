# Scripts

Essential utility scripts for Qivr platform.

## 🧪 Testing

### Main Test Suite
```bash
# Run comprehensive E2E tests
node scripts/tests/test-live-system.mjs

# Or use npm script
npm run test
```

## 🚀 Deployment

### Backend Deployment
```bash
# Deploy backend API to ECS
./scripts/deploy-backend.sh
```

### Full Deployment
```bash
# Deploy all components
./scripts/deploy.sh
```

## 🗄️ Database

### Development Database
```bash
# Manage local development database
./scripts/manage-dev-db.sh

# Run migrations
./scripts/dev-migrate.sh

# Seed development data
./scripts/seed-dev-data.sh
```

## 📦 Deployment Scripts

- `deploy.sh` - Full deployment (frontend + backend)
- `deploy-backend.sh` - Backend API deployment only
- `deployment/` - Deployment utilities and configurations

## 🗃️ Database Scripts

- `manage-dev-db.sh` - Local database management
- `dev-migrate.sh` - Run database migrations
- `seed-dev-data.sh` - Seed development data
- `database/` - Database-specific scripts

## 🧹 Cleanup

All old test scripts, audit scripts, and debug utilities have been removed. Only production-ready scripts remain.
