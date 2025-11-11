-- Add missing intake_dedupe table for message deduplication
-- This table is used by IntakeProcessingWorker to prevent duplicate message processing

CREATE TABLE IF NOT EXISTS qivr.intake_dedupe (
    message_id VARCHAR(255) PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_intake_dedupe_created_at ON qivr.intake_dedupe(created_at);

-- Add comment for documentation
COMMENT ON TABLE qivr.intake_dedupe IS 'Deduplication table for intake message processing';
COMMENT ON COLUMN qivr.intake_dedupe.message_id IS 'Unique message identifier to prevent duplicate processing';
COMMENT ON COLUMN qivr.intake_dedupe.created_at IS 'Timestamp when the message was first processed';
