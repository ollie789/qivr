-- Migration: Add double-booking prevention constraints and functions
-- Description: Ensures appointment integrity with overlap detection

BEGIN;

-- Add unique constraint for provider time slots
ALTER TABLE qivr.appointments 
ADD COLUMN IF NOT EXISTS actual_start_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS actual_end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_cancelled BOOLEAN DEFAULT FALSE;

-- Create appointment slots table for better conflict detection
CREATE TABLE IF NOT EXISTS qivr.appointment_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES qivr.providers(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_id UUID REFERENCES qivr.appointments(id) ON DELETE CASCADE,
    is_blocked BOOLEAN DEFAULT FALSE,
    block_reason VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Exclude constraint to prevent overlapping slots for the same provider
    CONSTRAINT no_overlapping_slots EXCLUDE USING gist (
        provider_id WITH =,
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (appointment_id IS NOT NULL OR is_blocked = TRUE)
);

-- Create function to check appointment availability
CREATE OR REPLACE FUNCTION qivr.check_appointment_availability(
    p_provider_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_exclude_appointment_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_conflicts INTEGER;
BEGIN
    -- Check for conflicts with existing appointments
    SELECT COUNT(*)
    INTO v_conflicts
    FROM qivr.appointment_slots
    WHERE provider_id = p_provider_id
        AND tstzrange(start_time, end_time) && tstzrange(p_start_time, p_end_time)
        AND (appointment_id IS NOT NULL OR is_blocked = TRUE)
        AND (p_exclude_appointment_id IS NULL OR appointment_id != p_exclude_appointment_id);
    
    RETURN v_conflicts = 0;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to prevent double booking
CREATE OR REPLACE FUNCTION qivr.prevent_double_booking()
RETURNS TRIGGER AS $$
BEGIN
    -- Skip check if appointment is being cancelled
    IF NEW.is_cancelled = TRUE THEN
        RETURN NEW;
    END IF;
    
    -- Check availability before insert/update
    IF NOT qivr.check_appointment_availability(
        NEW.provider_id,
        NEW.start_time,
        NEW.start_time + INTERVAL '1 hour' * EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time))/3600,
        CASE WHEN TG_OP = 'UPDATE' THEN NEW.id ELSE NULL END
    ) THEN
        RAISE EXCEPTION 'Time slot conflict: Provider % is not available from % to %',
            NEW.provider_id, NEW.start_time, NEW.end_time;
    END IF;
    
    -- Create or update appointment slot
    IF TG_OP = 'INSERT' THEN
        INSERT INTO qivr.appointment_slots (provider_id, start_time, end_time, appointment_id)
        VALUES (NEW.provider_id, NEW.start_time, NEW.end_time, NEW.id);
    ELSIF TG_OP = 'UPDATE' AND (OLD.start_time != NEW.start_time OR OLD.end_time != NEW.end_time OR OLD.provider_id != NEW.provider_id) THEN
        UPDATE qivr.appointment_slots
        SET provider_id = NEW.provider_id,
            start_time = NEW.start_time,
            end_time = NEW.end_time
        WHERE appointment_id = NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on appointments table
DROP TRIGGER IF EXISTS prevent_double_booking_trigger ON qivr.appointments;
CREATE TRIGGER prevent_double_booking_trigger
    BEFORE INSERT OR UPDATE ON qivr.appointments
    FOR EACH ROW
    EXECUTE FUNCTION qivr.prevent_double_booking();

-- Create function to find available slots
CREATE OR REPLACE FUNCTION qivr.find_available_slots(
    p_provider_id UUID,
    p_date DATE,
    p_duration_minutes INTEGER DEFAULT 30,
    p_start_hour INTEGER DEFAULT 9,
    p_end_hour INTEGER DEFAULT 17
) RETURNS TABLE (
    slot_start TIMESTAMP WITH TIME ZONE,
    slot_end TIMESTAMP WITH TIME ZONE,
    is_available BOOLEAN
) AS $$
DECLARE
    v_current_slot TIMESTAMP WITH TIME ZONE;
    v_end_time TIMESTAMP WITH TIME ZONE;
    v_day_start TIMESTAMP WITH TIME ZONE;
    v_day_end TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Set day boundaries
    v_day_start := p_date::TIMESTAMP + INTERVAL '1 hour' * p_start_hour;
    v_day_end := p_date::TIMESTAMP + INTERVAL '1 hour' * p_end_hour;
    v_current_slot := v_day_start;
    
    -- Generate slots for the day
    WHILE v_current_slot < v_day_end LOOP
        v_end_time := v_current_slot + INTERVAL '1 minute' * p_duration_minutes;
        
        -- Check if slot is available
        RETURN QUERY
        SELECT 
            v_current_slot,
            v_end_time,
            qivr.check_appointment_availability(p_provider_id, v_current_slot, v_end_time);
        
        -- Move to next slot
        v_current_slot := v_current_slot + INTERVAL '15 minutes'; -- 15-minute increments
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create buffer time configuration table
CREATE TABLE IF NOT EXISTS qivr.booking_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES qivr.providers(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES qivr.clinics(id) ON DELETE CASCADE,
    rule_type VARCHAR(50) NOT NULL, -- 'buffer_before', 'buffer_after', 'max_daily', 'min_notice'
    rule_value INTEGER NOT NULL, -- minutes for buffers, count for max_daily, hours for min_notice
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_booking_rule UNIQUE (provider_id, clinic_id, rule_type)
);

-- Function to apply booking rules
CREATE OR REPLACE FUNCTION qivr.apply_booking_rules(
    p_provider_id UUID,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE
) RETURNS BOOLEAN AS $$
DECLARE
    v_buffer_before INTEGER;
    v_buffer_after INTEGER;
    v_min_notice INTEGER;
    v_max_daily INTEGER;
    v_daily_count INTEGER;
BEGIN
    -- Get booking rules for provider
    SELECT rule_value INTO v_buffer_before
    FROM qivr.booking_rules
    WHERE provider_id = p_provider_id 
        AND rule_type = 'buffer_before' 
        AND is_active = TRUE
    LIMIT 1;
    
    SELECT rule_value INTO v_buffer_after
    FROM qivr.booking_rules
    WHERE provider_id = p_provider_id 
        AND rule_type = 'buffer_after' 
        AND is_active = TRUE
    LIMIT 1;
    
    SELECT rule_value INTO v_min_notice
    FROM qivr.booking_rules
    WHERE provider_id = p_provider_id 
        AND rule_type = 'min_notice' 
        AND is_active = TRUE
    LIMIT 1;
    
    SELECT rule_value INTO v_max_daily
    FROM qivr.booking_rules
    WHERE provider_id = p_provider_id 
        AND rule_type = 'max_daily' 
        AND is_active = TRUE
    LIMIT 1;
    
    -- Check minimum notice
    IF v_min_notice IS NOT NULL AND 
       p_start_time < CURRENT_TIMESTAMP + INTERVAL '1 hour' * v_min_notice THEN
        RETURN FALSE;
    END IF;
    
    -- Check daily maximum
    IF v_max_daily IS NOT NULL THEN
        SELECT COUNT(*) INTO v_daily_count
        FROM qivr.appointments
        WHERE provider_id = p_provider_id
            AND DATE(start_time) = DATE(p_start_time)
            AND is_cancelled = FALSE;
        
        IF v_daily_count >= v_max_daily THEN
            RETURN FALSE;
        END IF;
    END IF;
    
    -- Check with buffers
    IF NOT qivr.check_appointment_availability(
        p_provider_id,
        p_start_time - COALESCE(INTERVAL '1 minute' * v_buffer_before, INTERVAL '0'),
        p_end_time + COALESCE(INTERVAL '1 minute' * v_buffer_after, INTERVAL '0')
    ) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_appointment_slots_provider ON qivr.appointment_slots(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointment_slots_time ON qivr.appointment_slots(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_time ON qivr.appointments(provider_id, start_time, end_time);

-- Add RLS policies
ALTER TABLE qivr.appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE qivr.booking_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY appointment_slots_tenant_isolation ON qivr.appointment_slots
    FOR ALL
    USING (
        provider_id IN (
            SELECT p.id FROM qivr.providers p
            JOIN qivr.clinics c ON p.clinic_id = c.id
            WHERE c.tenant_id = current_setting('app.tenant_id')::UUID
        )
    );

CREATE POLICY booking_rules_tenant_isolation ON qivr.booking_rules
    FOR ALL
    USING (
        clinic_id IN (
            SELECT c.id FROM qivr.clinics c
            WHERE c.tenant_id = current_setting('app.tenant_id')::UUID
        )
    );

-- Insert default booking rules
INSERT INTO qivr.booking_rules (provider_id, rule_type, rule_value, is_active)
SELECT 
    p.id,
    'buffer_after',
    15, -- 15 minutes buffer after appointments
    TRUE
FROM qivr.providers p
ON CONFLICT DO NOTHING;

COMMIT;
