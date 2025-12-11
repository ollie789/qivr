-- Create intake_dedupe table for SQS message deduplication
-- This table prevents duplicate processing of intake submissions

CREATE TABLE IF NOT EXISTS public.intake_dedupe (
    message_id VARCHAR(255) PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for cleanup of old records
CREATE INDEX IF NOT EXISTS ix_intake_dedupe_processed_at ON public.intake_dedupe(processed_at);

-- Comment
COMMENT ON TABLE public.intake_dedupe IS 'Deduplication table for SQS intake processing messages';
