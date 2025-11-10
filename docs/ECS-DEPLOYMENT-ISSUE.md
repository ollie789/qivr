# ECS Deployment Issue - Root Cause Analysis

## Problem
ECS tasks were failing health checks and crashing on startup, preventing deployments from completing.

## Root Cause
The application was configured to automatically run Entity Framework migrations on startup:

```csharp
// Program.cs line 588-592
if (builder.Configuration.GetValue<bool>("ApplyMigrations", true)) // Default to true
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<QivrDbContext>();
    await dbContext.Database.MigrateAsync();
}
```

**The Issue:**
- `MigrateAsync()` tries to apply ALL migrations from scratch
- Production database already had tables from previous deployments
- Migration tried to `CREATE TABLE clinics` but table already existed
- PostgreSQL error: `42P07: relation "clinics" already exists`
- Application crashed before health check endpoint became available
- ECS marked tasks as unhealthy and kept old deployment running

## Error Log
```
[03:39:43 INF] Applying migration '20251108070500_InitialSaaSDatabase'
[03:39:44 ERR] Failed executing DbCommand (9ms)
CREATE TABLE clinics (...)
Npgsql.PostgresException (0x80004005): 42P07: relation "clinics" already exists
```

## Solution
Disabled automatic migrations in production by adding environment variable to task definition:

```json
{
  "name": "ApplyMigrations",
  "value": "false"
}
```

## Why This Happened
1. **Development Pattern**: Auto-migrations work great in development (fresh databases)
2. **Production Reality**: Database persists across deployments
3. **Missing Configuration**: No environment-specific migration strategy
4. **Default Behavior**: `ApplyMigrations` defaulted to `true` for all environments

## Long-term Solution
### For Production:
- ✅ Disable auto-migrations (`ApplyMigrations=false`)
- Run migrations manually or via CI/CD before deployment
- Use migration scripts with proper rollback strategies

### For Development:
- Keep auto-migrations enabled for local development
- Fresh database on each startup is acceptable

### Best Practices:
1. **Separate migration step** from application deployment
2. **Idempotent migrations** - check if changes already exist
3. **Blue-green deployments** - run migrations before switching traffic
4. **Database versioning** - track which migrations have been applied
5. **Rollback strategy** - have a plan for failed migrations

## Migration Strategy Going Forward

### Option 1: Manual Migrations (Current)
```bash
# Run before deploying new code
dotnet ef database update --project backend/Qivr.Api
```

### Option 2: CI/CD Migration Step
Add to buildspec.yml before ECS deployment:
```yaml
- echo "Running database migrations..."
- dotnet ef database update --project backend/Qivr.Api
```

### Option 3: Separate Migration Job
Create dedicated ECS task that runs migrations:
- Runs once before deployment
- Uses same database credentials
- Exits after migrations complete

## Files Changed
- `task-definition-template.json` - Added `ApplyMigrations=false`
- `docs/ECS-DEPLOYMENT-ISSUE.md` - This documentation

## Testing
After fix is deployed:
1. New tasks should start successfully
2. Health checks should pass
3. Deployment should complete
4. All 19 E2E tests should pass

## Related Issues
- TenantMiddleware fix (commit d111508) - blocked by this deployment issue
- Build pipeline IAM permissions - fixed in build #46
- Task definition registration - fixed in build #46
