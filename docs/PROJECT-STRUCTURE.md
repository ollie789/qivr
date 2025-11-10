# Project Structure

## Directory Layout

```
qivr/
├── apps/                    # Application frontends
│   ├── clinic-dashboard/    # Clinic dashboard app
│   ├── patient-portal/      # Patient portal app
│   └── ...
├── backend/                 # .NET backend services
│   ├── Qivr.Api/           # Main API project
│   ├── Qivr.Core/          # Domain models
│   ├── Qivr.Infrastructure/ # Data access
│   └── Qivr.Services/      # Business logic
├── frontend/                # Legacy frontend (deprecated)
├── infrastructure/          # IaC and AWS configs
│   ├── cloudfront.tf       # CloudFront distribution
│   ├── *.json              # AWS config files
│   └── lambda-*.js         # Lambda functions
├── aws/                     # AWS-specific configs
│   ├── codebuild-policy.json
│   └── codepipeline-policy.json
├── database/                # Database scripts
│   ├── migrations/
│   └── *.sql               # Seed/setup scripts
├── scripts/                 # Utility scripts
│   ├── deploy*.sh          # Deployment scripts
│   ├── test-*.js           # Test scripts
│   └── *.sh                # Various utilities
├── docs/                    # Documentation
│   ├── PROJECT-STRUCTURE.md # This file
│   ├── QUICK-REFERENCE.md
│   ├── CONFIG-AUDIT-REPORT.md
│   └── *.md                # Various docs
├── archive/                 # Archived/obsolete files
│   └── 2025-11-10-cleanup/
├── buildspec.yml           # CodeBuild configuration
├── docker-compose.yml      # Local development
├── package.json            # Root package config
└── README.md               # Main readme
```

## Key Files

### Root Level
- `buildspec.yml` - CodeBuild CI/CD configuration
- `docker-compose.yml` - Local development environment
- `package.json` - Root npm configuration
- `task-definition-template.json` - ECS task definition template
- `.env` - Environment variables (not in git)

### Infrastructure
- `infrastructure/cloudfront.tf` - CloudFront CDN configuration
- `infrastructure/cloudfront-update.json` - CloudFront update payload
- `infrastructure/lambda-*.js` - Lambda function code

### Scripts
- `scripts/deploy-codebuild.sh` - Trigger CodeBuild deployment
- `scripts/test-auth.js` - Test authentication
- `scripts/analyze-structure.sh` - Analyze project structure

### Documentation
- `docs/QUICK-REFERENCE.md` - Quick command reference
- `docs/CONFIG-AUDIT-REPORT.md` - Configuration audit results
- `docs/MEDIUM-PRIORITY-FIXES.md` - Recent fixes documentation

## Cleanup History

### 2025-11-10
- Moved 60+ loose files from root to proper directories
- Archived obsolete task definitions
- Consolidated documentation in docs/
- Organized scripts in scripts/
- Moved SQL files to database/
- Moved AWS configs to aws/ and infrastructure/

## Guidelines

### Adding New Files

**Scripts:** → `scripts/`
**Documentation:** → `docs/`
**SQL:** → `database/`
**AWS Configs:** → `aws/` or `infrastructure/`
**Tests:** → `scripts/test-*.js`

### Naming Conventions

- Scripts: `kebab-case.sh`
- Docs: `UPPER-KEBAB-CASE.md`
- Configs: `kebab-case.json`
- SQL: `kebab-case.sql`

### What NOT to Commit

- `*.zip`, `*.tar.gz` (archives)
- `node_modules/`
- `.env` files
- `dist/`, `build/` directories
- Temporary test files
- Personal notes/scratch files

## Maintenance

Run cleanup check monthly:
```bash
./scripts/analyze-structure.sh
```

Archive old files:
```bash
mkdir -p archive/$(date +%Y-%m-%d)-description
mv old-file.* archive/$(date +%Y-%m-%d)-description/
```
