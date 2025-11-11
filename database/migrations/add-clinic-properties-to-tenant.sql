-- Phase 3.1: Add clinic properties to Tenant table
-- This allows us to consolidate clinic data into the tenant entity

-- Add clinic properties to tenants table
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS description VARCHAR(1000),
ADD COLUMN IF NOT EXISTS address VARCHAR(500),
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing tenants to be active by default
UPDATE tenants SET is_active = true WHERE is_active IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN tenants.description IS 'Clinic description (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.address IS 'Clinic address (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.city IS 'Clinic city (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.state IS 'Clinic state (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.zip_code IS 'Clinic zip code (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.country IS 'Clinic country (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.phone IS 'Clinic phone (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.email IS 'Clinic email (Phase 3.1: Tenant-Clinic merge)';
COMMENT ON COLUMN tenants.is_active IS 'Clinic active status (Phase 3.1: Tenant-Clinic merge)';
