-- Migration: Complete Row-Level Security (RLS) Policies
-- Date: 2024-12-10
-- Description: Enable RLS on all tenant-scoped tables to ensure data isolation
-- CRITICAL: This migration ensures tenant data isolation at the database level

-- ============================================================================
-- PREREQUISITE: Ensure the tenant context function exists
-- ============================================================================

-- Function to get current tenant from session context
CREATE OR REPLACE FUNCTION qivr.get_current_tenant_id()
RETURNS uuid AS $$
BEGIN
    RETURN NULLIF(current_setting('app.tenant_id', true), '')::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Alternative function name for compatibility
CREATE OR REPLACE FUNCTION qivr.current_tenant_id()
RETURNS uuid AS $$
BEGIN
    RETURN qivr.get_current_tenant_id();
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ENABLE RLS ON ALL TENANT-SCOPED TABLES
-- ============================================================================

-- Appointments
ALTER TABLE qivr.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS appointments_tenant_isolation ON qivr.appointments;
CREATE POLICY appointments_tenant_isolation ON qivr.appointments
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Appointment Waitlist Entries
ALTER TABLE qivr.appointment_waitlist_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS appointment_waitlist_entries_tenant_isolation ON qivr.appointment_waitlist_entries;
CREATE POLICY appointment_waitlist_entries_tenant_isolation ON qivr.appointment_waitlist_entries
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Brand Themes
ALTER TABLE qivr.brand_themes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS brand_themes_tenant_isolation ON qivr.brand_themes;
CREATE POLICY brand_themes_tenant_isolation ON qivr.brand_themes
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Clinics
ALTER TABLE qivr.clinics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS clinics_tenant_isolation ON qivr.clinics;
CREATE POLICY clinics_tenant_isolation ON qivr.clinics
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Conversations
ALTER TABLE qivr.conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversations_tenant_isolation ON qivr.conversations;
CREATE POLICY conversations_tenant_isolation ON qivr.conversations
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Conversation Participants
ALTER TABLE qivr.conversation_participants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS conversation_participants_tenant_isolation ON qivr.conversation_participants;
CREATE POLICY conversation_participants_tenant_isolation ON qivr.conversation_participants
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Documents
ALTER TABLE qivr.documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS documents_tenant_isolation ON qivr.documents;
CREATE POLICY documents_tenant_isolation ON qivr.documents
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Evaluations (Intake)
ALTER TABLE qivr.evaluations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS evaluations_tenant_isolation ON qivr.evaluations;
CREATE POLICY evaluations_tenant_isolation ON qivr.evaluations
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Medical Allergies
ALTER TABLE qivr.medical_allergies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medical_allergies_tenant_isolation ON qivr.medical_allergies;
CREATE POLICY medical_allergies_tenant_isolation ON qivr.medical_allergies
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Medical Conditions
ALTER TABLE qivr.medical_conditions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medical_conditions_tenant_isolation ON qivr.medical_conditions;
CREATE POLICY medical_conditions_tenant_isolation ON qivr.medical_conditions
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Medical Immunizations
ALTER TABLE qivr.medical_immunizations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medical_immunizations_tenant_isolation ON qivr.medical_immunizations;
CREATE POLICY medical_immunizations_tenant_isolation ON qivr.medical_immunizations
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Medical Lab Results
ALTER TABLE qivr.medical_lab_results ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medical_lab_results_tenant_isolation ON qivr.medical_lab_results;
CREATE POLICY medical_lab_results_tenant_isolation ON qivr.medical_lab_results
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Medical Medications
ALTER TABLE qivr.medical_medications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medical_medications_tenant_isolation ON qivr.medical_medications;
CREATE POLICY medical_medications_tenant_isolation ON qivr.medical_medications
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Medical Vitals (Pain Assessments)
ALTER TABLE qivr.medical_vitals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medical_vitals_tenant_isolation ON qivr.medical_vitals;
CREATE POLICY medical_vitals_tenant_isolation ON qivr.medical_vitals
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Messages
ALTER TABLE qivr.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS messages_tenant_isolation ON qivr.messages;
CREATE POLICY messages_tenant_isolation ON qivr.messages
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Notification Preferences
ALTER TABLE qivr.notification_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notification_preferences_tenant_isolation ON qivr.notification_preferences;
CREATE POLICY notification_preferences_tenant_isolation ON qivr.notification_preferences
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Notifications
ALTER TABLE qivr.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS notifications_tenant_isolation ON qivr.notifications;
CREATE POLICY notifications_tenant_isolation ON qivr.notifications
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Pain Maps
ALTER TABLE qivr.pain_maps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS pain_maps_tenant_isolation ON qivr.pain_maps;
CREATE POLICY pain_maps_tenant_isolation ON qivr.pain_maps
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- PROM Booking Requests
ALTER TABLE qivr.prom_booking_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prom_booking_requests_tenant_isolation ON qivr.prom_booking_requests;
CREATE POLICY prom_booking_requests_tenant_isolation ON qivr.prom_booking_requests
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- PROM Instances
ALTER TABLE qivr.prom_instances ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prom_instances_tenant_isolation ON qivr.prom_instances;
CREATE POLICY prom_instances_tenant_isolation ON qivr.prom_instances
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- PROM Responses
ALTER TABLE qivr.prom_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prom_responses_tenant_isolation ON qivr.prom_responses;
CREATE POLICY prom_responses_tenant_isolation ON qivr.prom_responses
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- PROM Templates
ALTER TABLE qivr.prom_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prom_templates_tenant_isolation ON qivr.prom_templates;
CREATE POLICY prom_templates_tenant_isolation ON qivr.prom_templates
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Providers
ALTER TABLE qivr.providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS providers_tenant_isolation ON qivr.providers;
CREATE POLICY providers_tenant_isolation ON qivr.providers
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- Users
ALTER TABLE qivr.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS users_tenant_isolation ON qivr.users;
CREATE POLICY users_tenant_isolation ON qivr.users
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());

-- ============================================================================
-- BYPASS POLICIES FOR SERVICE ACCOUNT
-- ============================================================================
-- The application service account needs to bypass RLS for admin operations
-- This should be the qivr_admin role, not the regular qivr_user

-- Create admin role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'qivr_admin') THEN
        CREATE ROLE qivr_admin;
    END IF;
END
$$;

-- Grant bypass to admin role for all tables
ALTER TABLE qivr.appointments FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.appointment_waitlist_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.brand_themes FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.clinics FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.conversations FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.conversation_participants FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.documents FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.evaluations FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.medical_allergies FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.medical_conditions FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.medical_immunizations FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.medical_lab_results FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.medical_medications FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.medical_vitals FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.messages FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.notification_preferences FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.notifications FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.pain_maps FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.prom_booking_requests FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.prom_instances FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.prom_responses FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.prom_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.providers FORCE ROW LEVEL SECURITY;
ALTER TABLE qivr.users FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- NEW PROM INFRASTRUCTURE TABLES (Added 2024-12-10)
-- ============================================================================

-- Template Questions (normalized from JSON)
ALTER TABLE qivr.template_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS template_questions_tenant_isolation ON qivr.template_questions;
CREATE POLICY template_questions_tenant_isolation ON qivr.template_questions
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());
ALTER TABLE qivr.template_questions FORCE ROW LEVEL SECURITY;

-- Summary Score Definitions
ALTER TABLE qivr.summary_score_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS summary_score_definitions_tenant_isolation ON qivr.summary_score_definitions;
CREATE POLICY summary_score_definitions_tenant_isolation ON qivr.summary_score_definitions
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());
ALTER TABLE qivr.summary_score_definitions FORCE ROW LEVEL SECURITY;

-- PROM Item Responses (individual question answers)
ALTER TABLE qivr.prom_item_responses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prom_item_responses_tenant_isolation ON qivr.prom_item_responses;
CREATE POLICY prom_item_responses_tenant_isolation ON qivr.prom_item_responses
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());
ALTER TABLE qivr.prom_item_responses FORCE ROW LEVEL SECURITY;

-- PROM Summary Scores (calculated scores per instance)
ALTER TABLE qivr.prom_summary_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS prom_summary_scores_tenant_isolation ON qivr.prom_summary_scores;
CREATE POLICY prom_summary_scores_tenant_isolation ON qivr.prom_summary_scores
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());
ALTER TABLE qivr.prom_summary_scores FORCE ROW LEVEL SECURITY;

-- Treatment Progress Feedbacks
ALTER TABLE qivr.treatment_progress_feedbacks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS treatment_progress_feedbacks_tenant_isolation ON qivr.treatment_progress_feedbacks;
CREATE POLICY treatment_progress_feedbacks_tenant_isolation ON qivr.treatment_progress_feedbacks
    USING (tenant_id = qivr.get_current_tenant_id())
    WITH CHECK (tenant_id = qivr.get_current_tenant_id());
ALTER TABLE qivr.treatment_progress_feedbacks FORCE ROW LEVEL SECURITY;

-- Note: summary_score_question_mappings does NOT have tenant_id (it's a join table)
-- It inherits security through FK relationships to tenant-scoped tables

-- ============================================================================
-- VERIFICATION COMMENT
-- ============================================================================
-- Run this query after migration to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'qivr' ORDER BY tablename;

COMMENT ON FUNCTION qivr.get_current_tenant_id() IS
'Returns the current tenant ID from the session context (app.tenant_id).
Used by RLS policies to enforce tenant isolation.
Set via: SELECT set_config(''app.tenant_id'', ''<uuid>'', true)';
