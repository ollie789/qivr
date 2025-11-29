# Scripts

Utility scripts for development, deployment, and database management.

## Directory Structure

```
scripts/
├── Deployment
│   ├── deploy.sh              # Full deployment (frontend + backend)
│   ├── deploy-backend.sh      # Backend API deployment only
│   ├── build-local.sh         # Local build script
│   └── deployment/            # Deployment configurations
│
├── Database
│   ├── manage-dev-db.sh       # Local database management
│   ├── dev-migrate.sh         # Run database migrations
│   ├── apply-migrations.sh    # Apply migrations to remote DB
│   ├── seed-dev-data.sh       # Seed development data
│   └── database/              # Database-specific scripts
│
├── User Management
│   ├── create-user.sh         # Create user in Cognito
│   └── create-clinic-user.js  # Create clinic user
│
├── Testing
│   ├── run-tests.sh           # Run test suite
│   └── tests/                 # Test scripts
│
├── Infrastructure
│   ├── aws/                   # AWS-specific scripts
│   └── docker/                # Docker configurations
│
└── README.md
```

## Usage

### Deployment

```bash
# Full deployment
./scripts/deploy.sh

# Backend only
./scripts/deploy-backend.sh

# Local build
./scripts/build-local.sh
```

### Database

```bash
# Start/manage local database
./scripts/manage-dev-db.sh

# Run migrations
./scripts/dev-migrate.sh

# Apply migrations to remote
./scripts/apply-migrations.sh

# Seed development data
./scripts/seed-dev-data.sh
```

### Testing

```bash
# Run tests
./scripts/run-tests.sh

# Or use npm
npm run test
```

### User Management

```bash
# Create a user
./scripts/create-user.sh

# Create clinic user
node scripts/create-clinic-user.js
```

## Notes

- All scripts should be run from the project root
- Database scripts require PostgreSQL client tools
- Deployment scripts require AWS CLI configured
