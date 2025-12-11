-- Migration: Create provider scheduling tables and add timezone
-- Run this on production database

-- Add timezone column to tenants if not exists
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'Australia/Sydney';

-- Create provider_schedules table
CREATE TABLE IF NOT EXISTS provider_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    is_working_day BOOLEAN NOT NULL DEFAULT true,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    break_start_time VARCHAR(5),
    break_end_time VARCHAR(5),
    location_id UUID,
    default_slot_duration_minutes INTEGER NOT NULL DEFAULT 30,
    buffer_minutes INTEGER NOT NULL DEFAULT 0,
    allows_telehealth BOOLEAN NOT NULL DEFAULT true,
    allows_in_person BOOLEAN NOT NULL DEFAULT true,
    max_appointments_per_day INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, day_of_week)
);

-- Create provider_time_offs table
CREATE TABLE IF NOT EXISTS provider_time_offs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    start_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_all_day BOOLEAN NOT NULL DEFAULT true,
    type VARCHAR(50) NOT NULL DEFAULT 'Vacation',
    reason VARCHAR(500),
    is_approved BOOLEAN NOT NULL DEFAULT true,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN NOT NULL DEFAULT false,
    recurrence_pattern VARCHAR(20),
    recurrence_end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create provider_schedule_overrides table
CREATE TABLE IF NOT EXISTS provider_schedule_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    date DATE NOT NULL,
    is_working_day BOOLEAN NOT NULL DEFAULT true,
    start_time VARCHAR(5),
    end_time VARCHAR(5),
    reason VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, date)
);

-- Initialize default schedules for all existing providers
INSERT INTO provider_schedules (id, tenant_id, provider_id, day_of_week, is_working_day, start_time, end_time, default_slot_duration_minutes, buffer_minutes, allows_telehealth, allows_in_person, max_appointments_per_day)
SELECT 
  gen_random_uuid(), p.tenant_id, p.id, d.day_of_week, 
  CASE WHEN d.day_of_week = 0 THEN false ELSE true END,
  CASE WHEN d.day_of_week = 0 THEN NULL WHEN d.day_of_week = 6 THEN '09:00' ELSE '09:00' END,
  CASE WHEN d.day_of_week = 0 THEN NULL WHEN d.day_of_week = 6 THEN '13:00' ELSE '17:00' END,
  30, 0, true, true, 0
FROM providers p
CROSS JOIN (SELECT generate_series(0, 6) as day_of_week) d
WHERE NOT EXISTS (
  SELECT 1 FROM provider_schedules ps 
  WHERE ps.provider_id = p.id AND ps.day_of_week = d.day_of_week
);
