-- Secure Seed Data with BCrypt Hashed Passwords
-- All passwords are hashed versions of the original passwords

SET search_path TO qivr, public;

-- Clear existing data (for development only!)
TRUNCATE TABLE 
    audit_logs,
    auth_tokens,
    prom_instances,
    prom_templates,
    pain_maps,
    intake_submissions,
    appointments,
    evaluations,
    practitioners,
    patients,
    users,
    tenants
CASCADE;

-- Insert demo tenant (clinic)
INSERT INTO tenants (id, name, slug, settings, subscription_tier, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Demo Health Clinic', 'demo-clinic', 
     '{"timezone": "Australia/Sydney", "currency": "AUD", "language": "en"}', 'premium', true),
    ('22222222-2222-2222-2222-222222222222', 'Test Physio Center', 'test-physio',
     '{"timezone": "Australia/Melbourne", "currency": "AUD", "language": "en"}', 'basic', true);

-- Insert demo users with BCrypt hashed passwords
-- These are real BCrypt hashes - use BCrypt.Net to generate new ones if needed
-- Default passwords for demo:
-- admin@qivr.health: Admin123!
-- clinic@qivr.health: Clinic123!
-- patient@qivr.health: Patient123!

INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
VALUES
    -- Admin user - Password: Admin123!
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
     'admin@qivr.health', '$2a$10$8K1p/a0dL9pQ1cNVZPqJuuH1qgNOaFJSKMg5V5X4TsWdzE8uk7mTy', 
     'Admin', 'User', '+61400000001', 'admin', true, true),
    
    -- Clinic staff - Password: Clinic123!
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
     'clinic@qivr.health', '$2a$10$xQ3N9X3F7CNNnQKJRMWqHOXeGtGJ4cUgFYZpLQGZNHxY4kXHhFLDG', 
     'Dr. Sarah', 'Johnson', '+61400000002', 'clinician', true, true),
    
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
     'reception@qivr.health', '$2a$10$xQ3N9X3F7CNNnQKJRMWqHOXeGtGJ4cUgFYZpLQGZNHxY4kXHhFLDG', 
     'Jane', 'Smith', '+61400000003', 'receptionist', true, true),
    
    -- Patient users - Password: Patient123!
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
     'patient1@example.com', '$2a$10$YqW8jK5MOATxPSMcBzfBSu4XPYGpXsEqGqhPiSWJKkJXBCL5.VNTK', 
     'John', 'Doe', '+61400000004', 'patient', true, false),
    
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
     'patient2@example.com', '$2a$10$YqW8jK5MOATxPSMcBzfBSu4XPYGpXsEqGqhPiSWJKkJXBCL5.VNTK', 
     'Mary', 'Wilson', '+61400000005', 'patient', true, false);
