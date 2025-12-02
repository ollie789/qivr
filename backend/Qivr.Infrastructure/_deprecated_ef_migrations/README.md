# Deprecated EF Core Migrations

These EF Core migrations have been replaced by manual SQL migrations.

**DO NOT USE THESE FILES.**

See `/backend/sql/` for the new migration system.

## Why Deprecated?

1. Multiple conflicting migration folders
2. Missing migration tracking in production
3. Complex merge conflicts
4. Deployment reliability issues

## New System

All schema changes now use manual SQL migrations:

```bash
cd /backend/sql
./migrate.sh status
./migrate.sh up
./migrate.sh new my_change
```

## Can I Delete These?

Keep them for historical reference, but they will never be used again.
The `_deprecated_` prefix ensures EF Core won't detect them.
