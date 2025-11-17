-- Migration: Add OCR fields to documents table
-- Date: 2025-11-17

-- Add OCR fields
ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS s3_key VARCHAR(500);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS s3_bucket VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'processing';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_text TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_patient_name VARCHAR(255);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_dob DATE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS extracted_identifiers JSONB;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS ocr_completed_at TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS assigned_to UUID;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS due_date TIMESTAMP;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Rename columns to match entity
ALTER TABLE documents RENAME COLUMN file_size_bytes TO file_size;
ALTER TABLE documents RENAME COLUMN storage_path TO s3_key_old;

-- Update existing records
UPDATE documents SET 
    mime_type = content_type,
    s3_key = s3_key_old,
    s3_bucket = 'qivr-documents-prod',
    status = 'ready'
WHERE mime_type IS NULL;

-- Drop old columns
ALTER TABLE documents DROP COLUMN IF EXISTS content_type;
ALTER TABLE documents DROP COLUMN IF EXISTS s3_key_old;
ALTER TABLE documents DROP COLUMN IF EXISTS description;
ALTER TABLE documents DROP COLUMN IF EXISTS is_archived;
ALTER TABLE documents DROP COLUMN IF EXISTS archived_at;
ALTER TABLE documents DROP COLUMN IF EXISTS is_confidential;
ALTER TABLE documents DROP COLUMN IF EXISTS requires_review;
ALTER TABLE documents DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE documents DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE documents DROP COLUMN IF EXISTS metadata;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_assigned_to ON documents(assigned_to);
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NULL;

-- Add foreign key for assigned_to
ALTER TABLE documents ADD CONSTRAINT fk_documents_assigned_to 
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;
