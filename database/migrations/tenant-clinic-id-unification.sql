-- PHASE 1.2: Update existing clinic records to use tenant ID as clinic ID
-- This makes clinic.Id = tenant.Id for all existing records

-- Backup existing data first
CREATE TABLE IF NOT EXISTS qivr.clinic_backup AS 
SELECT * FROM qivr.clinics;

-- Update clinic IDs to match tenant IDs
-- Note: This assumes 1:1 relationship between tenant and clinic
UPDATE qivr.clinics 
SET id = tenant_id 
WHERE id != tenant_id;

-- Update any foreign key references to use new clinic IDs
-- (Add specific FK updates here if needed)

-- Verify the changes
SELECT 
    'Clinics with matching tenant/clinic IDs' as check_type,
    COUNT(*) as count
FROM qivr.clinics 
WHERE id = tenant_id

UNION ALL

SELECT 
    'Clinics with mismatched IDs' as check_type,
    COUNT(*) as count  
FROM qivr.clinics 
WHERE id != tenant_id;

-- Log completion
INSERT INTO qivr.migration_log (migration_name, executed_at, description)
VALUES ('tenant-clinic-id-unification', NOW(), 'Phase 1.2: Updated clinic IDs to match tenant IDs');
