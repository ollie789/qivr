-- Run this against your database after applying migrations:

-- Test 1: Check dedupe table exists
SELECT 
    CASE 
        WHEN to_regclass('qivr.intake_dedupe') IS NOT NULL 
        THEN '✓ intake_dedupe table exists' 
        ELSE '✗ intake_dedupe table NOT found' 
    END as dedupe_table_check;

-- Test 2: Verify tenant context is transaction-local
-- This should be run within the application to test properly
-- Example test transaction:
BEGIN;
    SELECT set_config('app.tenant_id', 'test-tenant-123'::text, true) as set_result;
    SELECT current_setting('app.tenant_id', true) as tenant_in_transaction;
ROLLBACK;
-- After rollback, this should return empty/null:
SELECT current_setting('app.tenant_id', true) as tenant_after_rollback;

-- Test 3: Check if RLS policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'qivr' 
ORDER BY tablename, policyname
LIMIT 5;
