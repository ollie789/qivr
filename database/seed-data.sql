-- Seed Data for Development Environment
-- This creates test data for development and testing

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

-- Insert demo users
-- Password for all users: Demo123! (bcrypt hash)
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, is_active, email_verified)
VALUES
    -- Admin user
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111',
     'admin@qivr.health', '$2b$10$YourHashHere', 'Admin', 'User', '+61400000001', 'admin', true, true),
    
    -- Clinic staff
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
     'clinic@qivr.health', '$2b$10$YourHashHere', 'Dr. Sarah', 'Johnson', '+61400000002', 'clinician', true, true),
    
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', '11111111-1111-1111-1111-111111111111',
     'reception@qivr.health', '$2b$10$YourHashHere', 'Jane', 'Smith', '+61400000003', 'receptionist', true, true),
    
    -- Patient users
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111',
     'patient1@example.com', '$2b$10$YourHashHere', 'John', 'Doe', '+61400000004', 'patient', true, true),
    
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
     'patient2@example.com', '$2b$10$YourHashHere', 'Mary', 'Wilson', '+61400000005', 'patient', true, true);

-- Insert practitioners
INSERT INTO practitioners (id, tenant_id, user_id, employee_id, license_number, specialization, qualifications)
VALUES
    ('11111111-2222-3333-4444-555555555555', '11111111-1111-1111-1111-111111111111',
     'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'EMP001', 'PHY123456', 'Physiotherapy',
     ARRAY['Bachelor of Physiotherapy', 'Masters in Sports Medicine']),
    
    ('22222222-3333-4444-5555-666666666666', '11111111-1111-1111-1111-111111111111',
     'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'EMP002', 'PHY789012', 'Chiropractic',
     ARRAY['Doctor of Chiropractic']);

-- Insert patients
INSERT INTO patients (id, tenant_id, user_id, first_name, last_name, email, phone, date_of_birth, gender, address, city, state, postcode)
VALUES
    ('11111111-1111-2222-3333-444444444444', '11111111-1111-1111-1111-111111111111',
     'dddddddd-dddd-dddd-dddd-dddddddddddd', 'John', 'Doe', 'patient1@example.com', '+61400000004',
     '1985-05-15', 'Male', '123 Main St', 'Sydney', 'NSW', '2000'),
    
    ('22222222-2222-3333-4444-555555555555', '11111111-1111-1111-1111-111111111111',
     'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Mary', 'Wilson', 'patient2@example.com', '+61400000005',
     '1990-08-22', 'Female', '456 Oak Ave', 'Melbourne', 'VIC', '3000'),
    
    ('33333333-3333-4444-5555-666666666666', '11111111-1111-1111-1111-111111111111',
     NULL, 'Bob', 'Anderson', 'bob@example.com', '+61400000006',
     '1978-03-10', 'Male', '789 Pine Rd', 'Brisbane', 'QLD', '4000');

-- Insert evaluations
INSERT INTO evaluations (id, tenant_id, patient_id, practitioner_id, status, responses, urgency_level)
VALUES
    ('aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111',
     '11111111-1111-2222-3333-444444444444', '11111111-2222-3333-4444-555555555555',
     'completed', '{"chief_complaint": "Back pain", "pain_level": 7, "duration": "2 weeks"}', 'medium'),
    
    ('bbbbbbbb-2222-3333-4444-cccccccccccc', '11111111-1111-1111-1111-111111111111',
     '22222222-2222-3333-4444-555555555555', '11111111-2222-3333-4444-555555555555',
     'pending', '{"chief_complaint": "Neck stiffness", "pain_level": 5, "duration": "3 days"}', 'low');

-- Insert appointments
INSERT INTO appointments (id, tenant_id, patient_id, practitioner_id, evaluation_id, scheduled_start, scheduled_end, status, type)
VALUES
    ('11111111-aaaa-bbbb-cccc-dddddddddddd', '11111111-1111-1111-1111-111111111111',
     '11111111-1111-2222-3333-444444444444', '11111111-2222-3333-4444-555555555555',
     'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb',
     CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '1 day' + INTERVAL '1 hour',
     'scheduled', 'Initial Consultation'),
    
    ('22222222-bbbb-cccc-dddd-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
     '22222222-2222-3333-4444-555555555555', '11111111-2222-3333-4444-555555555555',
     NULL,
     CURRENT_TIMESTAMP + INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '2 days' + INTERVAL '30 minutes',
     'scheduled', 'Follow-up');

-- Insert PROM templates
INSERT INTO prom_templates (id, tenant_id, name, description, category, questions, scoring_method, frequency)
VALUES
    ('11111111-aaaa-1111-2222-333333333333', '11111111-1111-1111-1111-111111111111',
     'Pain Assessment Scale', 'Standard pain assessment questionnaire', 'Pain Management',
     '[
       {"id": "q1", "text": "Rate your current pain level", "type": "scale", "min": 0, "max": 10},
       {"id": "q2", "text": "How does pain affect your daily activities?", "type": "radio", 
        "options": ["Not at all", "Slightly", "Moderately", "Severely", "Completely"]}
     ]',
     '{"type": "sum", "max_score": 15}', 'Daily'),
    
    ('22222222-bbbb-2222-3333-444444444444', '11111111-1111-1111-1111-111111111111',
     'Mobility Assessment', 'Assessment of patient mobility and function', 'Physical Function',
     '[
       {"id": "m1", "text": "Can you walk without assistance?", "type": "boolean"},
       {"id": "m2", "text": "How far can you walk?", "type": "radio",
        "options": ["< 100m", "100-500m", "500m-1km", "> 1km"]}
     ]',
     '{"type": "percentage"}', 'Weekly');

-- Insert PROM instances
INSERT INTO prom_instances (id, tenant_id, template_id, patient_id, scheduled_for, due_date, status)
VALUES
    ('11111111-1111-aaaa-bbbb-cccccccccccc', '11111111-1111-1111-1111-111111111111',
     '11111111-aaaa-1111-2222-333333333333', '11111111-1111-2222-3333-444444444444',
     CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending'),
    
    ('22222222-2222-bbbb-cccc-dddddddddddd', '11111111-1111-1111-1111-111111111111',
     '22222222-bbbb-2222-3333-444444444444', '22222222-2222-3333-4444-555555555555',
     CURRENT_TIMESTAMP + INTERVAL '1 day', CURRENT_TIMESTAMP + INTERVAL '8 days', 'pending');

-- Insert some completed intake submissions
INSERT INTO intake_submissions (id, tenant_id, evaluation_id, patient_name, patient_email, patient_phone, 
                                condition_type, pain_level, severity, status)
VALUES
    ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111',
     'aaaaaaaa-1111-2222-3333-bbbbbbbbbbbb', 'John Doe', 'patient1@example.com', '+61400000004',
     'Back Pain', 7, 'high', 'reviewed'),
    
    ('bbbbbbbb-cccc-dddd-eeee-ffffffffffff', '11111111-1111-1111-1111-111111111111',
     'bbbbbbbb-2222-3333-4444-cccccccccccc', 'Mary Wilson', 'patient2@example.com', '+61400000005',
     'Neck Stiffness', 5, 'medium', 'pending');

-- Output confirmation
SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as tenant_count FROM tenants;
SELECT COUNT(*) as user_count FROM users;
SELECT COUNT(*) as patient_count FROM patients;
SELECT COUNT(*) as appointment_count FROM appointments;
