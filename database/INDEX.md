# Database Scripts Index

## ⚠️ LEGACY SCRIPTS - MOSTLY OUTDATED

**The backend uses EF Core Migrations for schema management.**

- Current migration: `20251108070500_InitialSaaSDatabase`
- Location: `backend/Qivr.Infrastructure/Migrations/`
- See: [README.md](README.md) for EF Core usage

**These SQL scripts are legacy and may not match current schema.**

Only use for:
- Quick manual data insertion (if you know what you're doing)
- Reference for old data structures

**For production/development, use EF Core migrations only.**

---

## Legacy Scripts (Use with Caution)

### Setup & Reset
- **fresh-start.sh** - Complete database reset and setup
- **reset-database.sql** - Drop all tables and reset
- **create-clinic.sql** - Create a new clinic tenant

### Seeding Data
- **seed-sample-data.sql** - Full sample dataset (recommended)
- **seed-rds-simple.sql** - Minimal RDS seed
- **seed-analytics-data.sql** - Analytics test data
- **seed-appointments-simple.sql** - Appointment test data

### Active Seeds (in `/seeds/`)
- **clinic-dashboard.sql** - Clinic dashboard test data
- **patient-dashboard.sql** - Patient dashboard test data

### Schema Management
- **patches/** - Database migration patches
  - `20251005_add_documents_and_messages.sql` - Documents & messages tables
- **schemas/** - Schema definitions

## Usage

**Fresh database setup:**
```bash
./fresh-start.sh
```

**Reset database:**
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f reset-database.sql
```

**Seed sample data:**
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f seed-sample-data.sql
```

**Create test clinic:**
```bash
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f create-clinic.sql
```

## Archived

### `/archive/old-scripts/`
Old utility scripts:
- fix-tenant-associations.sql
- manual-user-insert.sql
- add-oliver-user.sql
- check-tenant-pools.sql

### `/archive/old-seeds/`
Old seed file versions:
- seed-minimal.sql
- seed-clinic-data.sql
- seed-correct.sql
- seed-final.sql
- seed-simple.sql
- seed-working.sql
- add-cognito-users.sql

## Recommended Workflow

1. **Local dev:** `./fresh-start.sh` → `seed-sample-data.sql`
2. **Testing:** `reset-database.sql` → `seed-rds-simple.sql`
3. **New clinic:** `create-clinic.sql`
4. **Analytics testing:** `seed-analytics-data.sql`
