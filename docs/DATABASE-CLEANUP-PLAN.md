# Database Migration Cleanup Plan

## Current State Analysis

### Database Reality (AWS RDS)
- **Migration History**: 5 old migrations from Sept/Oct 2024
- **Schema**: Current tenant-clinic merged structure
- **Tables**: 30 tables including merged `tenants` table with clinic fields

### EF Migration Files
- `20251108070500_InitialSaaSDatabase.cs` - Creates old clinic structure
- `20251110110656_UpdateUserSchemaToMatchEntities.cs` - User schema updates  
- `20251111080408_TenantClinicMergeCompleted.cs` - No-op migration (already applied manually)

### The Problem
Manual PostgreSQL CLI changes during tenant-clinic merge created mismatch between:
- EF migration tracking (expects newer migrations)
- Actual database state (has manual changes + old migrations)

## Cleanup Strategy

### Phase 1: Reset Migration State
1. **Backup current database schema**
2. **Clear EF migration history** 
3. **Generate fresh initial migration** from current entities
4. **Mark as applied** without running

### Phase 2: Clean Codebase
1. **Remove outdated migration files**
2. **Clean up seed data** 
3. **Update database initialization**
4. **Document final schema**

### Phase 3: Validation
1. **Test fresh database creation**
2. **Verify existing data integrity**
3. **Update deployment scripts**

## Implementation Commands

```bash
# 1. Backup current schema
pg_dump -h [host] -U qivr_user -d qivr --schema-only > schema-backup.sql

# 2. Clear EF migrations
rm -rf backend/Qivr.Infrastructure/Migrations/*

# 3. Generate fresh migration
dotnet ef migrations add InitialCleanSchema --project backend/Qivr.Infrastructure

# 4. Mark as applied (don't run)
dotnet ef database update --project backend/Qivr.Infrastructure --connection "[conn]"
```

## Benefits
- ✅ Clean migration history
- ✅ EF state matches database reality  
- ✅ Proper documentation
- ✅ Future migrations work correctly
- ✅ Deployment consistency
