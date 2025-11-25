-- Add indexes for analytics performance optimization
-- Run this migration to improve analytics query speed

-- Appointments indexes for dashboard metrics and trends
CREATE INDEX IF NOT EXISTS idx_appointments_tenant_scheduled 
ON appointments(tenant_id, scheduled_start) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_status 
ON appointments(tenant_id, status) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date_status 
ON appointments(tenant_id, scheduled_start, status) 
WHERE is_deleted = false;

-- PROM responses indexes for clinical analytics
CREATE INDEX IF NOT EXISTS idx_prom_responses_tenant_completed 
ON prom_responses(tenant_id, completed_at) 
WHERE completed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prom_responses_patient_completed 
ON prom_responses(patient_id, completed_at) 
WHERE completed_at IS NOT NULL;

-- PROM instances indexes for completion tracking
CREATE INDEX IF NOT EXISTS idx_prom_instances_tenant_created 
ON prom_instances(tenant_id, created_at, status);

-- Pain maps indexes for pain analytics
CREATE INDEX IF NOT EXISTS idx_pain_maps_tenant_created 
ON pain_maps(tenant_id, created_at);

CREATE INDEX IF NOT EXISTS idx_pain_maps_tenant_region 
ON pain_maps(tenant_id, body_region);

-- Users indexes for patient counting
CREATE INDEX IF NOT EXISTS idx_users_tenant_type_created 
ON users(tenant_id, user_type, created_at);

-- Evaluations indexes for top conditions
CREATE INDEX IF NOT EXISTS idx_evaluations_tenant_created 
ON evaluations(tenant_id, created_at, status);

CREATE INDEX IF NOT EXISTS idx_evaluations_tenant_complaint 
ON evaluations(tenant_id, chief_complaint) 
WHERE chief_complaint IS NOT NULL;

-- Verify indexes were created
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexname LIKE 'idx_%_tenant_%'
ORDER BY tablename, indexname;
