-- Migration: Add uploaded_by column to documents table
-- Date: 2025-11-17

-- Add uploaded_by column
ALTER TABLE documents ADD COLUMN IF NOT EXISTS uploaded_by UUID;

-- Add foreign key constraint
ALTER TABLE documents ADD CONSTRAINT fk_documents_uploaded_by 
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
