# Qivr SQL Migrations

Manual SQL migration system for reliable, version-controlled schema changes.

## Quick Start

```bash
# Check current status
DB_PASSWORD='your-password' ./migrate.sh status

# Apply pending migrations
DB_PASSWORD='your-password' ./migrate.sh up

# Create a new migration
./migrate.sh new add_user_preferences
```

## Why Manual SQL?

EF Core migrations were causing deployment issues due to:

- Multiple migration folders with conflicting histories
- Missing migration tracking in the database
- Complex merge conflicts in Designer.cs files

Manual SQL migrations provide:

- Full control over schema changes
- Easy rollback planning
- Works with any CI/CD pipeline
- No ORM-specific tooling required

## Migration Workflow

### 1. Create a New Migration

```bash
./migrate.sh new descriptive_name
# Creates: migrations/YYYYMMDDHHMMSS_descriptive_name.sql
```

### 2. Write Your SQL

Edit the generated file:

```sql
-- Migration: add_user_preferences
-- Created: 2024-12-02T10:00:00Z
--
-- Description:
--   Add preferences JSONB column to users table
--
-- Rollback:
--   ALTER TABLE qivr.users DROP COLUMN IF EXISTS preferences;

BEGIN;

ALTER TABLE qivr.users
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

COMMIT;
```

### 3. Test Locally

```bash
# Against local DB
DB_HOST=localhost DB_PASSWORD=local ./migrate.sh up

# Check status
./migrate.sh status
```

### 4. Deploy

In CI/CD or deployment script:

```bash
DB_PASSWORD=$DB_PASSWORD ./migrate.sh up
```

## Commands

| Command                       | Description                     |
| ----------------------------- | ------------------------------- |
| `./migrate.sh status`         | Show applied/pending migrations |
| `./migrate.sh up`             | Apply all pending migrations    |
| `./migrate.sh up 1`           | Apply only the next migration   |
| `./migrate.sh new <name>`     | Create a new migration file     |
| `./migrate.sh mark <version>` | Mark as applied without running |
| `./migrate.sh init`           | Initialize tracking table       |

## Environment Variables

| Variable      | Default        | Description       |
| ------------- | -------------- | ----------------- |
| `DB_HOST`     | qivr-dev-db... | Database host     |
| `DB_PORT`     | 5432           | Database port     |
| `DB_NAME`     | qivr           | Database name     |
| `DB_USER`     | qivr_user      | Database user     |
| `DB_PASSWORD` | (required)     | Database password |

## Migration File Naming

Format: `YYYYMMDDHHMMSS_description.sql`

Examples:

- `20241202100000_add_user_preferences.sql`
- `20241202110000_create_audit_log_table.sql`
- `20241202120000_add_index_on_appointments.sql`

## Rollback Strategy

Include rollback SQL as comments in each migration:

```sql
-- Rollback:
--   DROP TABLE IF EXISTS qivr.new_table;
--   ALTER TABLE qivr.users DROP COLUMN IF EXISTS new_column;
```

To rollback manually:

1. Run the rollback SQL from the migration file
2. Delete the row from `qivr.schema_migrations`

## Best Practices

1. **One change per migration** - easier to rollback
2. **Use IF EXISTS/IF NOT EXISTS** - idempotent migrations
3. **Test locally first** - always test before deploying
4. **Include rollback SQL** - even as comments
5. **Use transactions** - wrap changes in BEGIN/COMMIT
6. **No data migrations in schema files** - separate concerns

## Tracking Table

Migrations are tracked in `qivr.schema_migrations`:

```sql
SELECT * FROM qivr.schema_migrations ORDER BY version;
```

| version | name            | applied_at | checksum    |
| ------- | --------------- | ---------- | ----------- |
| 000     | init_tracking   | 2024-12-02 | manual      |
| 001     | baseline_schema | 2024-12-02 | manual-mark |
