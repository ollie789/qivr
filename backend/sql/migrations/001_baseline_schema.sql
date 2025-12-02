--
-- PostgreSQL database dump
--


-- Dumped from database version 15.7
-- Dumped by pg_dump version 15.15 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: qivr; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA qivr;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: appointment_waitlist_entries; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.appointment_waitlist_entries (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    provider_id uuid,
    appointment_type character varying(100) NOT NULL,
    notes text,
    preferred_dates text NOT NULL,
    status text NOT NULL,
    metadata text NOT NULL,
    fulfilled_at timestamp with time zone,
    matched_appointment_id uuid,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: appointments; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.appointments (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    clinic_id uuid,
    evaluation_id uuid,
    external_calendar_id text,
    appointment_type text NOT NULL,
    status text NOT NULL,
    scheduled_start timestamp with time zone NOT NULL,
    scheduled_end timestamp with time zone NOT NULL,
    actual_start timestamp with time zone,
    actual_end timestamp with time zone,
    location_type text NOT NULL,
    location_details text NOT NULL,
    notes text,
    cancellation_reason text,
    cancelled_at timestamp with time zone,
    cancelled_by uuid,
    reminder_sent_at timestamp with time zone,
    is_paid boolean NOT NULL,
    paid_at timestamp with time zone,
    payment_method text,
    payment_reference text,
    payment_amount numeric,
    payment_notes text,
    provider_id1 uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    tenant_id uuid NOT NULL,
    event_type character varying(100) NOT NULL,
    subject_type character varying(50) NOT NULL,
    subject_id uuid,
    actor_id uuid,
    actor_email character varying(255),
    ip_address character varying(45),
    user_agent character varying(500),
    correlation_id character varying(100),
    metadata jsonb DEFAULT '{}'::jsonb,
    occurred_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: brand_themes; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.brand_themes (
    id uuid NOT NULL,
    name text NOT NULL,
    is_active boolean NOT NULL,
    logo_url text,
    favicon_url text,
    primary_color text,
    secondary_color text,
    accent_color text,
    typography text NOT NULL,
    custom_css text,
    widget_config text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: clinics; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.clinics (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1000),
    address character varying(500),
    city character varying(100),
    state character varying(50),
    zip_code character varying(20),
    country character varying(100),
    phone character varying(20),
    email character varying(255),
    is_active boolean NOT NULL,
    metadata text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: conversation_participants; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.conversation_participants (
    id uuid NOT NULL,
    conversation_id uuid NOT NULL,
    user_id uuid NOT NULL,
    user_name text NOT NULL,
    role text NOT NULL,
    joined_at timestamp with time zone NOT NULL,
    left_at timestamp with time zone,
    last_read_at timestamp with time zone,
    unread_count integer NOT NULL,
    is_muted boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: conversations; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.conversations (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    provider_id uuid,
    subject character varying(200) NOT NULL,
    type text NOT NULL,
    status text NOT NULL,
    priority text NOT NULL,
    last_message_at timestamp with time zone NOT NULL,
    closed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: documents; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.documents (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    uploaded_by uuid,
    file_name character varying(255) NOT NULL,
    document_type character varying(100) NOT NULL,
    content_type character varying(50) NOT NULL,
    file_size_bytes bigint NOT NULL,
    storage_path text NOT NULL,
    description character varying(500) NOT NULL,
    is_archived boolean NOT NULL,
    archived_at timestamp with time zone,
    is_confidential boolean NOT NULL,
    requires_review boolean NOT NULL,
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    tags text NOT NULL,
    metadata text NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: evaluation_number_seq; Type: SEQUENCE; Schema: qivr; Owner: -
--

CREATE SEQUENCE qivr.evaluation_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluations; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.evaluations (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    evaluation_number text NOT NULL,
    chief_complaint text,
    symptoms text[] NOT NULL,
    medical_history text NOT NULL,
    questionnaire_responses text NOT NULL,
    ai_summary text,
    ai_risk_flags text[] NOT NULL,
    ai_processed_at timestamp with time zone,
    clinician_notes text,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    status text NOT NULL,
    urgency text,
    provider_id uuid,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: intake_dedupe; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.intake_dedupe (
    message_id character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: TABLE intake_dedupe; Type: COMMENT; Schema: qivr; Owner: -
--

COMMENT ON TABLE qivr.intake_dedupe IS 'Deduplication table for intake message processing';


--
-- Name: COLUMN intake_dedupe.message_id; Type: COMMENT; Schema: qivr; Owner: -
--

COMMENT ON COLUMN qivr.intake_dedupe.message_id IS 'Unique message identifier to prevent duplicate processing';


--
-- Name: COLUMN intake_dedupe.created_at; Type: COMMENT; Schema: qivr; Owner: -
--

COMMENT ON COLUMN qivr.intake_dedupe.created_at IS 'Timestamp when the message was first processed';


--
-- Name: intake_submissions; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.intake_submissions (
    id uuid NOT NULL,
    evaluation_id uuid NOT NULL,
    patient_name text NOT NULL,
    patient_email text NOT NULL,
    condition_type text,
    pain_level integer NOT NULL,
    severity text NOT NULL,
    status text NOT NULL,
    submitted_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: medical_allergies; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.medical_allergies (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    allergen character varying(200) NOT NULL,
    type character varying(50) NOT NULL,
    severity character varying(50) NOT NULL,
    reaction text NOT NULL,
    diagnosed_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: medical_conditions; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.medical_conditions (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    condition character varying(200) NOT NULL,
    icd10_code character varying(20),
    diagnosed_date timestamp with time zone NOT NULL,
    status character varying(50) NOT NULL,
    managed_by character varying(200) NOT NULL,
    last_reviewed timestamp with time zone NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: medical_immunizations; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.medical_immunizations (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    vaccine character varying(200) NOT NULL,
    date timestamp with time zone NOT NULL,
    next_due timestamp with time zone,
    provider character varying(200) NOT NULL,
    facility character varying(200) NOT NULL,
    lot_number character varying(100),
    series character varying(100),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: medical_lab_results; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.medical_lab_results (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    result_date timestamp with time zone NOT NULL,
    category character varying(200) NOT NULL,
    test_name character varying(200) NOT NULL,
    value text NOT NULL,
    unit character varying(50) NOT NULL,
    reference_range character varying(100) NOT NULL,
    status character varying(50) NOT NULL,
    ordered_by character varying(200) NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: medical_medications; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.medical_medications (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    dosage character varying(100) NOT NULL,
    frequency character varying(100) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone,
    status character varying(50) NOT NULL,
    prescribed_by character varying(200) NOT NULL,
    instructions text,
    refills_remaining integer,
    last_filled timestamp with time zone,
    pharmacy character varying(200),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: medical_vitals; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.medical_vitals (
    id uuid NOT NULL,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    recorded_at timestamp with time zone NOT NULL,
    systolic integer NOT NULL,
    diastolic integer NOT NULL,
    heart_rate integer NOT NULL,
    temperature_celsius numeric NOT NULL,
    weight_kilograms numeric NOT NULL,
    height_centimetres numeric NOT NULL,
    oxygen_saturation integer NOT NULL,
    respiratory_rate integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.messages (
    id uuid NOT NULL,
    conversation_id uuid,
    sender_id uuid NOT NULL,
    direct_recipient_id uuid NOT NULL,
    sender_name text,
    sender_role text,
    direct_subject text,
    direct_message_type text,
    direct_priority text,
    content text NOT NULL,
    sent_at timestamp with time zone NOT NULL,
    read_at timestamp with time zone,
    is_read boolean NOT NULL,
    edited_at timestamp with time zone,
    is_deleted boolean NOT NULL,
    attachment_id uuid,
    is_system_message boolean NOT NULL,
    parent_message_id uuid,
    related_appointment_id uuid,
    deleted_by_recipient boolean NOT NULL,
    deleted_by_sender boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: notification_preferences; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.notification_preferences (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    email_enabled boolean NOT NULL,
    sms_enabled boolean NOT NULL,
    push_enabled boolean NOT NULL,
    in_app_enabled boolean NOT NULL,
    appointment_reminders boolean NOT NULL,
    prom_reminders boolean NOT NULL,
    evaluation_notifications boolean NOT NULL,
    clinic_announcements boolean NOT NULL,
    system_notifications boolean NOT NULL,
    reminder_hours_before integer NOT NULL,
    preferred_time_zone text NOT NULL,
    quiet_hours_start integer,
    quiet_hours_end integer,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.notifications (
    id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    sender_id uuid,
    type character varying(50) NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    channel text NOT NULL,
    priority text NOT NULL,
    data text,
    scheduled_for timestamp with time zone,
    sent_at timestamp with time zone,
    read_at timestamp with time zone,
    reminder_sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: pain_maps; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.pain_maps (
    id uuid NOT NULL,
    evaluation_id uuid NOT NULL,
    body_region text NOT NULL,
    anatomical_code text,
    coordinate_x real NOT NULL,
    coordinate_y real NOT NULL,
    coordinate_z real NOT NULL,
    pain_intensity integer NOT NULL,
    pain_type text,
    pain_quality text[] NOT NULL,
    onset_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL,
    avatar_type text,
    body_subdivision text,
    view_orientation text,
    depth_indicator text,
    submission_source text,
    drawing_data_json jsonb
);


--
-- Name: prom_booking_requests; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.prom_booking_requests (
    id uuid NOT NULL,
    prom_instance_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    preferred_date timestamp with time zone NOT NULL,
    alternative_date timestamp with time zone,
    time_preference character varying(50) NOT NULL,
    reason_for_visit text NOT NULL,
    notes text,
    status character varying(50) NOT NULL,
    requested_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: prom_instances; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.prom_instances (
    id uuid NOT NULL,
    template_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    status text NOT NULL,
    scheduled_for timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    due_date timestamp with time zone NOT NULL,
    response_data text,
    score numeric,
    reminder_sent_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: prom_responses; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.prom_responses (
    id uuid NOT NULL,
    patient_id uuid NOT NULL,
    prom_instance_id uuid NOT NULL,
    appointment_id uuid,
    prom_type text NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    score numeric NOT NULL,
    severity text NOT NULL,
    answers text NOT NULL,
    notes text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: prom_templates; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.prom_templates (
    id uuid NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    frequency text NOT NULL,
    questions text NOT NULL,
    scoring_method text,
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL,
    key text DEFAULT ''::text NOT NULL,
    scoring_rules text,
    version integer DEFAULT 0 NOT NULL
);


--
-- Name: providers; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.providers (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    clinic_id uuid NOT NULL,
    title character varying(50),
    specialty character varying(100),
    license_number character varying(50),
    npi_number character varying(50),
    is_active boolean NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL
);


--
-- Name: tenants; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.tenants (
    id uuid NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    status integer NOT NULL,
    plan text NOT NULL,
    timezone text NOT NULL,
    locale text NOT NULL,
    settings text NOT NULL,
    metadata text NOT NULL,
    deleted_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: qivr; Owner: -
--

CREATE TABLE qivr.users (
    id uuid NOT NULL,
    cognito_sub text NOT NULL,
    email text NOT NULL,
    email_verified boolean NOT NULL,
    phone text,
    phone_verified boolean NOT NULL,
    first_name text,
    last_name text,
    date_of_birth timestamp with time zone,
    gender text,
    user_type text NOT NULL,
    roles text[] NOT NULL,
    avatar_url text,
    preferences text NOT NULL,
    consent text NOT NULL,
    last_login_at timestamp with time zone,
    created_by text,
    updated_by text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    tenant_id uuid NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: intake_dedupe intake_dedupe_pkey; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.intake_dedupe
    ADD CONSTRAINT intake_dedupe_pkey PRIMARY KEY (message_id);


--
-- Name: appointment_waitlist_entries pk_appointment_waitlist_entries; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointment_waitlist_entries
    ADD CONSTRAINT pk_appointment_waitlist_entries PRIMARY KEY (id);


--
-- Name: appointments pk_appointments; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT pk_appointments PRIMARY KEY (id);


--
-- Name: brand_themes pk_brand_themes; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.brand_themes
    ADD CONSTRAINT pk_brand_themes PRIMARY KEY (id);


--
-- Name: clinics pk_clinics; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.clinics
    ADD CONSTRAINT pk_clinics PRIMARY KEY (id);


--
-- Name: conversation_participants pk_conversation_participants; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.conversation_participants
    ADD CONSTRAINT pk_conversation_participants PRIMARY KEY (id);


--
-- Name: conversations pk_conversations; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.conversations
    ADD CONSTRAINT pk_conversations PRIMARY KEY (id);


--
-- Name: documents pk_documents; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.documents
    ADD CONSTRAINT pk_documents PRIMARY KEY (id);


--
-- Name: evaluations pk_evaluations; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.evaluations
    ADD CONSTRAINT pk_evaluations PRIMARY KEY (id);


--
-- Name: intake_submissions pk_intake_submissions; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.intake_submissions
    ADD CONSTRAINT pk_intake_submissions PRIMARY KEY (id);


--
-- Name: medical_allergies pk_medical_allergies; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_allergies
    ADD CONSTRAINT pk_medical_allergies PRIMARY KEY (id);


--
-- Name: medical_conditions pk_medical_conditions; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_conditions
    ADD CONSTRAINT pk_medical_conditions PRIMARY KEY (id);


--
-- Name: medical_immunizations pk_medical_immunizations; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_immunizations
    ADD CONSTRAINT pk_medical_immunizations PRIMARY KEY (id);


--
-- Name: medical_lab_results pk_medical_lab_results; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_lab_results
    ADD CONSTRAINT pk_medical_lab_results PRIMARY KEY (id);


--
-- Name: medical_medications pk_medical_medications; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_medications
    ADD CONSTRAINT pk_medical_medications PRIMARY KEY (id);


--
-- Name: medical_vitals pk_medical_vitals; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_vitals
    ADD CONSTRAINT pk_medical_vitals PRIMARY KEY (id);


--
-- Name: messages pk_messages; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.messages
    ADD CONSTRAINT pk_messages PRIMARY KEY (id);


--
-- Name: notification_preferences pk_notification_preferences; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.notification_preferences
    ADD CONSTRAINT pk_notification_preferences PRIMARY KEY (id);


--
-- Name: notifications pk_notifications; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.notifications
    ADD CONSTRAINT pk_notifications PRIMARY KEY (id);


--
-- Name: pain_maps pk_pain_maps; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.pain_maps
    ADD CONSTRAINT pk_pain_maps PRIMARY KEY (id);


--
-- Name: prom_booking_requests pk_prom_booking_requests; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_booking_requests
    ADD CONSTRAINT pk_prom_booking_requests PRIMARY KEY (id);


--
-- Name: prom_instances pk_prom_instances; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_instances
    ADD CONSTRAINT pk_prom_instances PRIMARY KEY (id);


--
-- Name: prom_responses pk_prom_responses; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_responses
    ADD CONSTRAINT pk_prom_responses PRIMARY KEY (id);


--
-- Name: prom_templates pk_prom_templates; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_templates
    ADD CONSTRAINT pk_prom_templates PRIMARY KEY (id);


--
-- Name: providers pk_providers; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.providers
    ADD CONSTRAINT pk_providers PRIMARY KEY (id);


--
-- Name: tenants pk_tenants; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.tenants
    ADD CONSTRAINT pk_tenants PRIMARY KEY (id);


--
-- Name: users pk_users; Type: CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.users
    ADD CONSTRAINT pk_users PRIMARY KEY (id);


--
-- Name: idx_intake_dedupe_created_at; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX idx_intake_dedupe_created_at ON qivr.intake_dedupe USING btree (created_at);


--
-- Name: ix_appointment_waitlist_entries_matched_appointment_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointment_waitlist_entries_matched_appointment_id ON qivr.appointment_waitlist_entries USING btree (matched_appointment_id);


--
-- Name: ix_appointment_waitlist_entries_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointment_waitlist_entries_patient_id ON qivr.appointment_waitlist_entries USING btree (patient_id);


--
-- Name: ix_appointment_waitlist_entries_provider_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointment_waitlist_entries_provider_id ON qivr.appointment_waitlist_entries USING btree (provider_id);


--
-- Name: ix_appointment_waitlist_entries_tenant_patient_status; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointment_waitlist_entries_tenant_patient_status ON qivr.appointment_waitlist_entries USING btree (tenant_id, patient_id, status);


--
-- Name: ix_appointment_waitlist_entries_tenant_status; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointment_waitlist_entries_tenant_status ON qivr.appointment_waitlist_entries USING btree (tenant_id, status);


--
-- Name: ix_appointments_cancelled_by; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointments_cancelled_by ON qivr.appointments USING btree (cancelled_by);


--
-- Name: ix_appointments_clinic_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointments_clinic_id ON qivr.appointments USING btree (clinic_id);


--
-- Name: ix_appointments_evaluation_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointments_evaluation_id ON qivr.appointments USING btree (evaluation_id);


--
-- Name: ix_appointments_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointments_patient_id ON qivr.appointments USING btree (patient_id);


--
-- Name: ix_appointments_provider_id1; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointments_provider_id1 ON qivr.appointments USING btree (provider_id1);


--
-- Name: ix_appointments_tenant_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_appointments_tenant_id ON qivr.appointments USING btree (tenant_id);


--
-- Name: ix_audit_logs_correlation_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_audit_logs_correlation_id ON qivr.audit_logs USING btree (correlation_id);


--
-- Name: ix_audit_logs_event_type; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_audit_logs_event_type ON qivr.audit_logs USING btree (event_type);


--
-- Name: ix_audit_logs_occurred_at; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_audit_logs_occurred_at ON qivr.audit_logs USING btree (occurred_at);


--
-- Name: ix_audit_logs_subject; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_audit_logs_subject ON qivr.audit_logs USING btree (subject_type, subject_id);


--
-- Name: ix_audit_logs_tenant_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_audit_logs_tenant_id ON qivr.audit_logs USING btree (tenant_id);


--
-- Name: ix_brand_themes_tenant_id_name; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_brand_themes_tenant_id_name ON qivr.brand_themes USING btree (tenant_id, name);


--
-- Name: ix_clinics_tenant_id_name; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_clinics_tenant_id_name ON qivr.clinics USING btree (tenant_id, name);


--
-- Name: ix_conversation_participants_conversation_id_user_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_conversation_participants_conversation_id_user_id ON qivr.conversation_participants USING btree (conversation_id, user_id);


--
-- Name: ix_conversations_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_conversations_patient_id ON qivr.conversations USING btree (patient_id);


--
-- Name: ix_conversations_provider_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_conversations_provider_id ON qivr.conversations USING btree (provider_id);


--
-- Name: ix_conversations_tenant_id_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_conversations_tenant_id_patient_id ON qivr.conversations USING btree (tenant_id, patient_id);


--
-- Name: ix_documents_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_documents_patient_id ON qivr.documents USING btree (patient_id);


--
-- Name: ix_documents_tenant_confidential; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_documents_tenant_confidential ON qivr.documents USING btree (tenant_id, is_confidential) WHERE (is_archived = false);


--
-- Name: ix_documents_tenant_patient_created; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_documents_tenant_patient_created ON qivr.documents USING btree (tenant_id, patient_id, created_at DESC) WHERE (is_archived = false);


--
-- Name: ix_documents_tenant_review; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_documents_tenant_review ON qivr.documents USING btree (tenant_id, requires_review, created_at DESC) WHERE ((is_archived = false) AND (requires_review = true));


--
-- Name: ix_documents_tenant_type; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_documents_tenant_type ON qivr.documents USING btree (tenant_id, document_type) WHERE (is_archived = false);


--
-- Name: ix_evaluations_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_evaluations_patient_id ON qivr.evaluations USING btree (patient_id);


--
-- Name: ix_evaluations_provider_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_evaluations_provider_id ON qivr.evaluations USING btree (provider_id);


--
-- Name: ix_evaluations_reviewed_by; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_evaluations_reviewed_by ON qivr.evaluations USING btree (reviewed_by);


--
-- Name: ix_evaluations_tenant_id_evaluation_number; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_evaluations_tenant_id_evaluation_number ON qivr.evaluations USING btree (tenant_id, evaluation_number);


--
-- Name: ix_intake_submissions_evaluation_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_intake_submissions_evaluation_id ON qivr.intake_submissions USING btree (evaluation_id);


--
-- Name: ix_medical_allergies_tenant_patient_allergen; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_medical_allergies_tenant_patient_allergen ON qivr.medical_allergies USING btree (tenant_id, patient_id, allergen);


--
-- Name: ix_medical_conditions_tenant_patient_condition; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_medical_conditions_tenant_patient_condition ON qivr.medical_conditions USING btree (tenant_id, patient_id, condition);


--
-- Name: ix_medical_immunizations_tenant_patient_date; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_medical_immunizations_tenant_patient_date ON qivr.medical_immunizations USING btree (tenant_id, patient_id, date);


--
-- Name: ix_medical_lab_results_tenant_patient_category_date; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_medical_lab_results_tenant_patient_category_date ON qivr.medical_lab_results USING btree (tenant_id, patient_id, category, result_date);


--
-- Name: ix_medical_medications_tenant_patient_status; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_medical_medications_tenant_patient_status ON qivr.medical_medications USING btree (tenant_id, patient_id, status);


--
-- Name: ix_medical_vitals_tenant_patient_recorded; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_medical_vitals_tenant_patient_recorded ON qivr.medical_vitals USING btree (tenant_id, patient_id, recorded_at);


--
-- Name: ix_messages_attachment_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_messages_attachment_id ON qivr.messages USING btree (attachment_id);


--
-- Name: ix_messages_conversation_id_sent_at; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_messages_conversation_id_sent_at ON qivr.messages USING btree (conversation_id, sent_at);


--
-- Name: ix_messages_direct_recipient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_messages_direct_recipient_id ON qivr.messages USING btree (direct_recipient_id);


--
-- Name: ix_messages_parent_message_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_messages_parent_message_id ON qivr.messages USING btree (parent_message_id);


--
-- Name: ix_messages_sender_id_direct_recipient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_messages_sender_id_direct_recipient_id ON qivr.messages USING btree (sender_id, direct_recipient_id);


--
-- Name: ix_notification_preferences_tenant_id_user_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_notification_preferences_tenant_id_user_id ON qivr.notification_preferences USING btree (tenant_id, user_id);


--
-- Name: ix_notification_preferences_user_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_notification_preferences_user_id ON qivr.notification_preferences USING btree (user_id);


--
-- Name: ix_notifications_recipient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_notifications_recipient_id ON qivr.notifications USING btree (recipient_id);


--
-- Name: ix_notifications_sender_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_notifications_sender_id ON qivr.notifications USING btree (sender_id);


--
-- Name: ix_notifications_tenant_id_recipient_id_created_at; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_notifications_tenant_id_recipient_id_created_at ON qivr.notifications USING btree (tenant_id, recipient_id, created_at);


--
-- Name: ix_pain_maps_evaluation_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_pain_maps_evaluation_id ON qivr.pain_maps USING btree (evaluation_id);


--
-- Name: ix_prom_booking_requests_prom_instance_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_booking_requests_prom_instance_id ON qivr.prom_booking_requests USING btree (prom_instance_id);


--
-- Name: ix_prom_booking_requests_tenant_id_prom_instance_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_booking_requests_tenant_id_prom_instance_id ON qivr.prom_booking_requests USING btree (tenant_id, prom_instance_id);


--
-- Name: ix_prom_instances_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_instances_patient_id ON qivr.prom_instances USING btree (patient_id);


--
-- Name: ix_prom_instances_template_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_instances_template_id ON qivr.prom_instances USING btree (template_id);


--
-- Name: ix_prom_instances_tenant_id_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_instances_tenant_id_patient_id ON qivr.prom_instances USING btree (tenant_id, patient_id);


--
-- Name: ix_prom_responses_appointment_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_responses_appointment_id ON qivr.prom_responses USING btree (appointment_id);


--
-- Name: ix_prom_responses_patient_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_responses_patient_id ON qivr.prom_responses USING btree (patient_id);


--
-- Name: ix_prom_responses_prom_instance_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_responses_prom_instance_id ON qivr.prom_responses USING btree (prom_instance_id);


--
-- Name: ix_prom_responses_tenant_id_patient_id_completed_at; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_prom_responses_tenant_id_patient_id_completed_at ON qivr.prom_responses USING btree (tenant_id, patient_id, completed_at);


--
-- Name: ix_prom_templates_tenant_id_key_version; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_prom_templates_tenant_id_key_version ON qivr.prom_templates USING btree (tenant_id, key, version);


--
-- Name: ix_prom_templates_tenant_id_name; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_prom_templates_tenant_id_name ON qivr.prom_templates USING btree (tenant_id, name);


--
-- Name: ix_providers_clinic_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_providers_clinic_id ON qivr.providers USING btree (clinic_id);


--
-- Name: ix_providers_tenant_active; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_providers_tenant_active ON qivr.providers USING btree (tenant_id, is_active) WHERE (is_active = true);


--
-- Name: ix_providers_tenant_id_user_id_clinic_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_providers_tenant_id_user_id_clinic_id ON qivr.providers USING btree (tenant_id, user_id, clinic_id);


--
-- Name: ix_providers_tenant_specialty; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_providers_tenant_specialty ON qivr.providers USING btree (tenant_id, specialty) WHERE (is_active = true);


--
-- Name: ix_providers_user_id; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_providers_user_id ON qivr.providers USING btree (user_id);


--
-- Name: ix_tenants_created_deleted; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_tenants_created_deleted ON qivr.tenants USING btree (created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: ix_tenants_plan_lower; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_tenants_plan_lower ON qivr.tenants USING btree (lower(plan));


--
-- Name: ix_tenants_slug; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_tenants_slug ON qivr.tenants USING btree (slug);


--
-- Name: ix_tenants_status_deleted; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_tenants_status_deleted ON qivr.tenants USING btree (status) WHERE (deleted_at IS NULL);


--
-- Name: ix_users_cognito_sub; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_users_cognito_sub ON qivr.users USING btree (cognito_sub);


--
-- Name: ix_users_tenant_created; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_users_tenant_created ON qivr.users USING btree (tenant_id, created_at DESC) WHERE (deleted_at IS NULL);


--
-- Name: ix_users_tenant_id_email; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX ix_users_tenant_id_email ON qivr.users USING btree (tenant_id, email);


--
-- Name: ix_users_tenant_type; Type: INDEX; Schema: qivr; Owner: -
--

CREATE INDEX ix_users_tenant_type ON qivr.users USING btree (tenant_id, user_type) WHERE (deleted_at IS NULL);


--
-- Name: no_double_booking; Type: INDEX; Schema: qivr; Owner: -
--

CREATE UNIQUE INDEX no_double_booking ON qivr.appointments USING btree (provider_id, scheduled_start, scheduled_end);


--
-- Name: appointments fk_appointments_clinics_clinic_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT fk_appointments_clinics_clinic_id FOREIGN KEY (clinic_id) REFERENCES qivr.clinics(id);


--
-- Name: appointments fk_appointments_evaluations_evaluation_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT fk_appointments_evaluations_evaluation_id FOREIGN KEY (evaluation_id) REFERENCES qivr.evaluations(id) ON DELETE SET NULL;


--
-- Name: appointments fk_appointments_providers_provider_id1; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT fk_appointments_providers_provider_id1 FOREIGN KEY (provider_id1) REFERENCES qivr.providers(id) ON DELETE CASCADE;


--
-- Name: appointments fk_appointments_tenants_tenant_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT fk_appointments_tenants_tenant_id FOREIGN KEY (tenant_id) REFERENCES qivr.tenants(id) ON DELETE CASCADE;


--
-- Name: appointments fk_appointments_users_cancelled_by; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT fk_appointments_users_cancelled_by FOREIGN KEY (cancelled_by) REFERENCES qivr.users(id) ON DELETE SET NULL;


--
-- Name: appointments fk_appointments_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT fk_appointments_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: appointments fk_appointments_users_provider_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointments
    ADD CONSTRAINT fk_appointments_users_provider_id FOREIGN KEY (provider_id) REFERENCES qivr.users(id) ON DELETE RESTRICT;


--
-- Name: audit_logs fk_audit_logs_tenant; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.audit_logs
    ADD CONSTRAINT fk_audit_logs_tenant FOREIGN KEY (tenant_id) REFERENCES qivr.tenants(id) ON DELETE CASCADE;


--
-- Name: brand_themes fk_brand_themes_tenants_tenant_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.brand_themes
    ADD CONSTRAINT fk_brand_themes_tenants_tenant_id FOREIGN KEY (tenant_id) REFERENCES qivr.tenants(id) ON DELETE CASCADE;


--
-- Name: conversation_participants fk_conversation_participants_conversations_conversation_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.conversation_participants
    ADD CONSTRAINT fk_conversation_participants_conversations_conversation_id FOREIGN KEY (conversation_id) REFERENCES qivr.conversations(id) ON DELETE CASCADE;


--
-- Name: conversations fk_conversations_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.conversations
    ADD CONSTRAINT fk_conversations_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: conversations fk_conversations_users_provider_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.conversations
    ADD CONSTRAINT fk_conversations_users_provider_id FOREIGN KEY (provider_id) REFERENCES qivr.users(id) ON DELETE SET NULL;


--
-- Name: documents fk_documents_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.documents
    ADD CONSTRAINT fk_documents_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: evaluations fk_evaluations_providers_provider_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.evaluations
    ADD CONSTRAINT fk_evaluations_providers_provider_id FOREIGN KEY (provider_id) REFERENCES qivr.providers(id);


--
-- Name: evaluations fk_evaluations_tenants_tenant_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.evaluations
    ADD CONSTRAINT fk_evaluations_tenants_tenant_id FOREIGN KEY (tenant_id) REFERENCES qivr.tenants(id) ON DELETE CASCADE;


--
-- Name: evaluations fk_evaluations_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.evaluations
    ADD CONSTRAINT fk_evaluations_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: evaluations fk_evaluations_users_reviewed_by; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.evaluations
    ADD CONSTRAINT fk_evaluations_users_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES qivr.users(id) ON DELETE SET NULL;


--
-- Name: intake_submissions fk_intake_submissions_evaluations_evaluation_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.intake_submissions
    ADD CONSTRAINT fk_intake_submissions_evaluations_evaluation_id FOREIGN KEY (evaluation_id) REFERENCES qivr.evaluations(id) ON DELETE CASCADE;


--
-- Name: medical_allergies fk_medical_allergies_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_allergies
    ADD CONSTRAINT fk_medical_allergies_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: medical_conditions fk_medical_conditions_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_conditions
    ADD CONSTRAINT fk_medical_conditions_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: medical_immunizations fk_medical_immunizations_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_immunizations
    ADD CONSTRAINT fk_medical_immunizations_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: medical_lab_results fk_medical_lab_results_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_lab_results
    ADD CONSTRAINT fk_medical_lab_results_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: medical_medications fk_medical_medications_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_medications
    ADD CONSTRAINT fk_medical_medications_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: medical_vitals fk_medical_vitals_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.medical_vitals
    ADD CONSTRAINT fk_medical_vitals_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: messages fk_messages_conversations_conversation_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.messages
    ADD CONSTRAINT fk_messages_conversations_conversation_id FOREIGN KEY (conversation_id) REFERENCES qivr.conversations(id) ON DELETE CASCADE;


--
-- Name: messages fk_messages_documents_attachment_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.messages
    ADD CONSTRAINT fk_messages_documents_attachment_id FOREIGN KEY (attachment_id) REFERENCES qivr.documents(id) ON DELETE SET NULL;


--
-- Name: messages fk_messages_messages_parent_message_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.messages
    ADD CONSTRAINT fk_messages_messages_parent_message_id FOREIGN KEY (parent_message_id) REFERENCES qivr.messages(id) ON DELETE SET NULL;


--
-- Name: messages fk_messages_users_direct_recipient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.messages
    ADD CONSTRAINT fk_messages_users_direct_recipient_id FOREIGN KEY (direct_recipient_id) REFERENCES qivr.users(id) ON DELETE RESTRICT;


--
-- Name: messages fk_messages_users_sender_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.messages
    ADD CONSTRAINT fk_messages_users_sender_id FOREIGN KEY (sender_id) REFERENCES qivr.users(id) ON DELETE RESTRICT;


--
-- Name: notification_preferences fk_notification_preferences_users_user_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.notification_preferences
    ADD CONSTRAINT fk_notification_preferences_users_user_id FOREIGN KEY (user_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_users_recipient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.notifications
    ADD CONSTRAINT fk_notifications_users_recipient_id FOREIGN KEY (recipient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: notifications fk_notifications_users_sender_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.notifications
    ADD CONSTRAINT fk_notifications_users_sender_id FOREIGN KEY (sender_id) REFERENCES qivr.users(id) ON DELETE SET NULL;


--
-- Name: pain_maps fk_pain_maps_evaluations_evaluation_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.pain_maps
    ADD CONSTRAINT fk_pain_maps_evaluations_evaluation_id FOREIGN KEY (evaluation_id) REFERENCES qivr.evaluations(id) ON DELETE CASCADE;


--
-- Name: prom_booking_requests fk_prom_booking_requests_prom_instances_prom_instance_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_booking_requests
    ADD CONSTRAINT fk_prom_booking_requests_prom_instances_prom_instance_id FOREIGN KEY (prom_instance_id) REFERENCES qivr.prom_instances(id) ON DELETE CASCADE;


--
-- Name: prom_instances fk_prom_instances_prom_templates_template_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_instances
    ADD CONSTRAINT fk_prom_instances_prom_templates_template_id FOREIGN KEY (template_id) REFERENCES qivr.prom_templates(id) ON DELETE CASCADE;


--
-- Name: prom_instances fk_prom_instances_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_instances
    ADD CONSTRAINT fk_prom_instances_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: prom_responses fk_prom_responses_appointments_appointment_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_responses
    ADD CONSTRAINT fk_prom_responses_appointments_appointment_id FOREIGN KEY (appointment_id) REFERENCES qivr.appointments(id) ON DELETE SET NULL;


--
-- Name: prom_responses fk_prom_responses_prom_instances_prom_instance_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_responses
    ADD CONSTRAINT fk_prom_responses_prom_instances_prom_instance_id FOREIGN KEY (prom_instance_id) REFERENCES qivr.prom_instances(id) ON DELETE CASCADE;


--
-- Name: prom_responses fk_prom_responses_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.prom_responses
    ADD CONSTRAINT fk_prom_responses_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: providers fk_providers_clinics_clinic_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.providers
    ADD CONSTRAINT fk_providers_clinics_clinic_id FOREIGN KEY (clinic_id) REFERENCES qivr.clinics(id) ON DELETE CASCADE;


--
-- Name: providers fk_providers_users_user_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.providers
    ADD CONSTRAINT fk_providers_users_user_id FOREIGN KEY (user_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: users fk_users_tenants_tenant_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.users
    ADD CONSTRAINT fk_users_tenants_tenant_id FOREIGN KEY (tenant_id) REFERENCES qivr.tenants(id) ON DELETE CASCADE;


--
-- Name: appointment_waitlist_entries fk_waitlist_entries_appointments_matched_appointment_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointment_waitlist_entries
    ADD CONSTRAINT fk_waitlist_entries_appointments_matched_appointment_id FOREIGN KEY (matched_appointment_id) REFERENCES qivr.appointments(id) ON DELETE SET NULL;


--
-- Name: appointment_waitlist_entries fk_waitlist_entries_users_patient_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointment_waitlist_entries
    ADD CONSTRAINT fk_waitlist_entries_users_patient_id FOREIGN KEY (patient_id) REFERENCES qivr.users(id) ON DELETE CASCADE;


--
-- Name: appointment_waitlist_entries fk_waitlist_entries_users_provider_id; Type: FK CONSTRAINT; Schema: qivr; Owner: -
--

ALTER TABLE ONLY qivr.appointment_waitlist_entries
    ADD CONSTRAINT fk_waitlist_entries_users_provider_id FOREIGN KEY (provider_id) REFERENCES qivr.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs; Type: ROW SECURITY; Schema: qivr; Owner: -
--

ALTER TABLE qivr.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: intake_submissions; Type: ROW SECURITY; Schema: qivr; Owner: -
--

ALTER TABLE qivr.intake_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs tenant_isolation; Type: POLICY; Schema: qivr; Owner: -
--

CREATE POLICY tenant_isolation ON qivr.audit_logs USING ((tenant_id = (current_setting('app.tenant_id'::text, true))::uuid));


--
-- Name: intake_submissions tenant_isolation; Type: POLICY; Schema: qivr; Owner: -
--

CREATE POLICY tenant_isolation ON qivr.intake_submissions USING ((tenant_id = (current_setting('app.tenant_id'::text, true))::uuid));


--
-- PostgreSQL database dump complete
--

\unrestrict uohCP8kVrj2rXzvfd50TFOmDHOS9oEYObJBn1VeoqdmYPRgd8CkhyhEVPnt813u

