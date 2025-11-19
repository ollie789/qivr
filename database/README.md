# Database Migrations

## Manual Migrations Required

The following tables are missing from the production database and need to be created:

### Pain Assessments Table

Run: `add_pain_assessments.sql`

This creates the `pain_assessments` table required by the Medical Records API.

## How to Apply

Connect to RDS and run:

```bash
psql -h <RDS_ENDPOINT> -U qivradmin -d qivr_db -f add_pain_assessments.sql
```

Or use AWS Systems Manager Session Manager to connect to an ECS task and run migrations from there.
