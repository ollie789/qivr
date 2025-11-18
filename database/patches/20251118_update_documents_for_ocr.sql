-- Update documents table for OCR integration
-- This matches the EF Core migration: 20251118000416_UpdateDocumentsForOCR

BEGIN;

-- Rename columns
ALTER TABLE documents RENAME COLUMN storage_path TO status;
ALTER TABLE documents RENAME COLUMN reviewed_by TO assigned_to;
ALTER TABLE documents RENAME COLUMN reviewed_at TO ocr_completed_at;
ALTER TABLE documents RENAME COLUMN requires_review TO is_urgent;
ALTER TABLE documents RENAME COLUMN metadata TO s3key;
ALTER TABLE documents RENAME COLUMN file_size_bytes TO file_size;
ALTER TABLE documents RENAME COLUMN archived_at TO extracted_dob;

-- Drop old columns
ALTER TABLE documents DROP COLUMN IF EXISTS content_type;
ALTER TABLE documents DROP COLUMN IF EXISTS description;
ALTER TABLE documents DROP COLUMN IF EXISTS is_archived;
ALTER TABLE documents DROP COLUMN IF EXISTS is_confidential;

-- Alter existing columns
ALTER TABLE documents ALTER COLUMN uploaded_by SET NOT NULL;
ALTER TABLE documents ALTER COLUMN tags TYPE text[] USING string_to_array(tags, ',');
ALTER TABLE documents ALTER COLUMN file_name TYPE text;
ALTER TABLE documents ALTER COLUMN document_type TYPE text;

-- Add new columns
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidence_score numeric;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS due_date timestamptz;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_identifiers jsonb;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_patient_name text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type text NOT NULL DEFAULT '';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS s3bucket text NOT NULL DEFAULT '';

-- Create document_audit_log table
CREATE TABLE IF NOT EXISTS document_audit_log (
    id uuid PRIMARY KEY,
    document_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    ip_address text,
    user_agent text,
    metadata jsonb,
    created_at timestamptz NOT NULL,
    CONSTRAINT fk_document_audit_logs_documents_document_id FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    CONSTRAINT fk_document_audit_logs_users_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS ix_documents_assigned_to ON documents(assigned_to);
CREATE INDEX IF NOT EXISTS ix_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS ix_document_audit_logs_document_id ON document_audit_log(document_id);
CREATE INDEX IF NOT EXISTS ix_document_audit_logs_user_id ON document_audit_log(user_id);

-- Add foreign keys
ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_users_assigned_to_user_id;
ALTER TABLE documents ADD CONSTRAINT fk_documents_users_assigned_to_user_id 
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE documents DROP CONSTRAINT IF EXISTS fk_documents_users_uploaded_by_user_id;
ALTER TABLE documents ADD CONSTRAINT fk_documents_users_uploaded_by_user_id 
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

COMMIT;
