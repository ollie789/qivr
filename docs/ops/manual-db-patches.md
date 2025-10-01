# Manual Database Patches

_Updated: 2025-10-05_

This folder tracks SQL patches to run against environments that might lag behind the EF Core migration history. Apply these only after confirming the schema drift in the target database.

## 2025-10-05 — Documents & Messages

**Problem**: Some RDS instances were provisioned before the `documents` and `messages` tables shipped in EF migrations. The clinic dashboard and messaging services expect both tables.

**Script**: `database/patches/20251005_add_documents_and_messages.sql`

### How to apply

1. Connect to the target PostgreSQL instance:
   ```bash
   psql "$DATABASE_URL" -f database/patches/20251005_add_documents_and_messages.sql
   ```
2. Verify the tables now exist:
   ```sql
   \dt public.documents
   \dt public.messages
   ```
3. (Optional) Check constraints and sample rows:
   ```sql
   \d+ public.documents
   \d+ public.messages
   SELECT COUNT(*) FROM public.documents;
   SELECT COUNT(*) FROM public.messages;
   ```

> The script is idempotent: it uses `CREATE TABLE IF NOT EXISTS` and only adds foreign keys/indexes if they are missing.

### Follow-up
- Once EF migrations catch up, this script can be retired.
- Keep a note in release notes when you run it in production.
