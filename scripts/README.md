# Scripts Directory

## Main Scripts (in root)
- `install.sh` - Initial setup and dependency installation
- `start-all.sh` - Start all services (backend API and frontend apps)
- `stop-all.sh` - Stop all running services

## Development Scripts
- `dev-migrate.sh` - Run database migrations
- `manage-dev-db.sh` - Manage local PostgreSQL database
- `test-auth-db.sh` - Test database authentication

## Test Scripts (in tests/)
- `test-api-direct.mjs` - Direct API testing
- `test-auth-flow.mjs` - Authentication flow testing
- `test-all-endpoints.sh` - Test all API endpoints
- `test-api-migration.ts` - API migration testing
- `run-api-tests.sh` - Run API test suite

## Archive Directory
Contains deprecated scripts related to:
- AWS Cognito setup (now using DevAuth for local development)
- Old startup scripts
- Legacy configuration scripts

## Usage

### Initial Setup
```bash
./install.sh
```

### Start Development Environment
```bash
./start-all.sh
```

### Stop All Services
```bash
./stop-all.sh
```

### Run Database Migrations
```bash
./scripts/dev-migrate.sh
```