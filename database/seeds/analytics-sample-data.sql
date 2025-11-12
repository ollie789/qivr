-- Sample data for analytics functionality
-- This file contains the test data we added during development

-- Insert sample provider (if not exists)
INSERT INTO providers (id, tenant_id, name, specialization, email, phone, created_at, updated_at)
VALUES (
    'prov_sample_001',
    'tenant_qivr_demo',
    'Dr. Sarah Johnson',
    'General Practice',
    'sarah.johnson@clinic.com',
    '+1-555-0123',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Insert sample appointments for analytics
INSERT INTO appointments (id, tenant_id, patient_id, provider_id, appointment_date, status, appointment_type, duration_minutes, notes, created_at, updated_at)
VALUES 
    ('appt_sample_001', 'tenant_qivr_demo', 'patient_001', 'prov_sample_001', '2024-11-10 09:00:00', 'Completed', 'Consultation', 30, 'Regular checkup completed', NOW(), NOW()),
    ('appt_sample_002', 'tenant_qivr_demo', 'patient_002', 'prov_sample_001', '2024-11-10 14:30:00', 'Completed', 'Follow-up', 15, 'Follow-up visit completed', NOW(), NOW()),
    ('appt_sample_003', 'tenant_qivr_demo', 'patient_003', 'prov_sample_001', '2024-11-11 10:15:00', 'NoShow', 'Consultation', 30, 'Patient did not show up', NOW(), NOW()),
    ('appt_sample_004', 'tenant_qivr_demo', 'patient_004', 'prov_sample_001', '2024-11-12 11:00:00', 'Scheduled', 'Consultation', 30, 'Upcoming appointment', NOW(), NOW()),
    ('appt_sample_005', 'tenant_qivr_demo', 'patient_005', 'prov_sample_001', '2024-11-12 15:30:00', 'Scheduled', 'Follow-up', 15, 'Upcoming follow-up', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Update tenant settings with clinic and operations configuration
UPDATE tenants 
SET 
    name = 'Qivr Demo Clinic',
    address = '123 Healthcare Ave, Medical District, City 12345',
    phone = '+1-555-CLINIC',
    email = 'contact@qivrdemo.com',
    settings = '{
        "operations": {
            "workingHours": {
                "monday": {"start": "09:00", "end": "17:00", "enabled": true},
                "tuesday": {"start": "09:00", "end": "17:00", "enabled": true},
                "wednesday": {"start": "09:00", "end": "17:00", "enabled": true},
                "thursday": {"start": "09:00", "end": "17:00", "enabled": true},
                "friday": {"start": "09:00", "end": "17:00", "enabled": true},
                "saturday": {"start": "09:00", "end": "13:00", "enabled": false},
                "sunday": {"start": "09:00", "end": "13:00", "enabled": false}
            },
            "appointmentDuration": 30,
            "bufferTime": 15,
            "maxAdvanceBooking": 90,
            "allowOnlineBooking": true,
            "requireConfirmation": true,
            "sendReminders": true,
            "reminderHours": 24
        }
    }'
WHERE id = 'tenant_qivr_demo';
