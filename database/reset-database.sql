-- =====================================================
-- QIVR Database Reset Script
-- WARNING: This will DELETE ALL DATA
-- Only use in development/staging environments
-- =====================================================

-- Drop all tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS prom_responses CASCADE;
DROP TABLE IF EXISTS prom_instances CASCADE;
DROP TABLE IF EXISTS prom_templates CASCADE;
DROP TABLE IF EXISTS intake_form_responses CASCADE;
DROP TABLE IF EXISTS intake_forms CASCADE;
DROP TABLE IF EXISTS pain_maps CASCADE;
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS appointment_waitlist_entries CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS clinics CASCADE;
DROP TABLE IF EXISTS brand_themes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;
DROP TABLE IF EXISTS __EFMigrationsHistory CASCADE;

-- Verify all tables are dropped
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%';

-- Database is now clean and ready for fresh migrations
