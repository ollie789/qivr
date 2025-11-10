# Database Clean Start Plan

## Current Situation
- Multiple migrations from old auth system
- New tenant-based auth system implemented
- No meaningful production data
- Migration history is messy
- Deployment issues caused by migration conflicts

## Recommendation: Fresh Start

### Step 1: Backup Current State (Optional)
```bash
# Only if you want to keep any reference data
pg_dump -h <DB_HOST> -U <DB_USER> -d <DB_NAME> > backup_$(date +%Y%m%d).sql
```

### Step 2: Reset Database
```bash
# Connect to database
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -f database/reset-database.sql
```

### Step 3: Delete Old Migrations
```bash
# Remove all migration files
rm -rf backend/Qivr.Api/Migrations/*
```

### Step 4: Create Fresh Migration
```bash
cd backend/Qivr.Api
dotnet ef migrations add InitialCleanMigration
```

### Step 5: Apply Fresh Migration
```bash
# Locally first
dotnet ef database update

# Then deploy to production
# The ApplyMigrations=false will prevent auto-run
# You'll manually run migrations before deployment
```

### Step 6: Update Deployment Process
**Option A: Manual migrations (Current)**
```bash
# Before each deployment with schema changes:
dotnet ef database update --project backend/Qivr.Api
```

**Option B: Separate migration task (Recommended for production)**
- Create dedicated ECS task for migrations
- Runs once before deployment
- Exits after completion
- Keeps application startup fast

## Benefits of Fresh Start
✅ Clean migration history
✅ Matches current auth/tenant architecture
✅ No legacy code/tables
✅ Easier to understand and maintain
✅ Faster application startup
✅ No migration conflicts

## What Gets Reset
- All tables dropped and recreated
- Migration history cleared
- Fresh schema matching current models
- Clean tenant/auth structure

## What Stays
- Application code (unchanged)
- ECS configuration (unchanged)
- Cognito users (unchanged)
- S3 files (unchanged)

## Timeline
1. **Now**: Keep `ApplyMigrations=false` to stabilize deployments
2. **After build #48 deploys**: Verify application works
3. **Next session**: Execute fresh migration plan
4. **Going forward**: Clean, maintainable database

## Alternative: Keep Current DB
If you want to keep current data:
- Fix migrations incrementally
- Add missing columns/tables
- More complex, error-prone
- Not recommended for dev stage
