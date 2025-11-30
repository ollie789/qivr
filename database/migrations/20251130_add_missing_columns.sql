-- Add missing columns to ocr_jobs and documents tables
-- These columns exist in EF model but not in database

-- Add S3Bucket to ocr_jobs if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ocr_jobs' AND column_name = 's3bucket') THEN
        ALTER TABLE ocr_jobs ADD COLUMN s3bucket VARCHAR(255);
    END IF;
END $$;

-- Add S3Bucket to documents if not exists  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 's3bucket') THEN
        ALTER TABLE documents ADD COLUMN s3bucket VARCHAR(255);
    END IF;
END $$;

-- Add metadata to intakes if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'intakes' AND column_name = 'metadata') THEN
        ALTER TABLE intakes ADD COLUMN metadata JSONB;
    END IF;
END $$;
