# Qivr Database Migrations

This directory contains all database migrations for the Qivr platform.

## 📁 Structure

- `migrations/` - SQL migration files
- `run-migrations.sh` - Migration runner script
- `README.md` - This file

## 🚀 Running Migrations

### Prerequisites

1. PostgreSQL must be installed and running
2. Database credentials must be configured in `.env` file or environment variables

### Environment Variables

Create a `.env` file in the project root with:

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=qivr
DB_USER=postgres
DB_PASSWORD=postgres

# Optional: Use connection string instead
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qivr
```

### Execute Migrations

Run all pending migrations:

```bash
cd database
./run-migrations.sh
```

The script will:
- ✅ Create a migrations tracking table
- ✅ Execute migrations in order
- ✅ Skip already executed migrations
- ✅ Track execution time and checksums
- ✅ Handle errors gracefully

## 📝 Migration Files

### Current Migrations

1. **001_initial_schema.sql** - Base tables (tenants, users, patients, practitioners)
2. **002_evaluations_and_intake.sql** - Evaluation and intake forms
3. **003_create_calendar_tables.sql** - Calendar integration and appointments
4. **004_create_prom_tables.sql** - Patient-Reported Outcome Measures
5. **005_enhance_evaluations_table.sql** - Enhanced evaluation features

### Creating New Migrations

1. Create a new file in `migrations/` with naming pattern: `XXX_description.sql`
2. Start with a comment describing the migration
3. Use `IF NOT EXISTS` clauses for idempotency
4. Include indexes and constraints
5. Add comments for documentation

Example:

```sql
-- Migration: Add new feature
-- Description: Adds tables for new feature X
-- Date: 2024-01-15

CREATE TABLE IF NOT EXISTS feature_x (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feature_x_name ON feature_x(name);

COMMENT ON TABLE feature_x IS 'Feature X main table';
```

## 🔍 Checking Migration Status

View migration history:

```bash
psql -U postgres -d qivr -c "SELECT * FROM migrations ORDER BY executed_at DESC;"
```

## 🛠️ Troubleshooting

### Migration Failed

1. Check error message in output
2. Fix the issue in the migration file
3. Manually remove failed entry from migrations table:
   ```sql
   DELETE FROM migrations WHERE filename = 'XXX_failed_migration.sql';
   ```
4. Re-run migrations

### Connection Issues

Verify database connectivity:

```bash
psql -h localhost -U postgres -d qivr -c "SELECT 1;"
```

### Reset All Migrations (Development Only)

⚠️ **WARNING: This will delete all data!**

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS qivr;"
psql -U postgres -c "CREATE DATABASE qivr;"
./run-migrations.sh
```

## 📊 Database Schema Overview

### Core Tables
- `tenants` - Multi-tenant support
- `users` - System users
- `patients` - Patient records
- `practitioners` - Healthcare providers

### Calendar & Appointments
- `appointments` - Appointment records
- `calendar_tokens` - OAuth tokens
- `provider_availability` - Schedule templates

### Clinical Features
- `evaluations` - Patient evaluations with AI analysis
- `intake_forms` - Initial patient intake
- `prom_templates` - PROM questionnaires
- `prom_instances` - Patient PROM assignments

### Supporting Tables
- `audit_logs` - System audit trail
- `migrations` - Migration tracking

## 🔒 Security Notes

- All tables include tenant_id for data isolation
- Sensitive data should be encrypted at rest
- Use row-level security (RLS) in production
- Regular backups are essential

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Migration Best Practices](https://www.postgresql.org/docs/current/ddl.html)
- [Qivr API Documentation](../backend/README.md)
