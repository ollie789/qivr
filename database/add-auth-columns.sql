-- Add authentication columns to users table
ALTER TABLE qivr.users 
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create auth_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS qivr.auth_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES qivr.users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    revoked_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, token_type)
);

-- Create index on token_hash for fast lookups
CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON qivr.auth_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON qivr.auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires_at ON qivr.auth_tokens(expires_at);

-- Add RLS policies for auth_tokens
ALTER TABLE qivr.auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY auth_tokens_user_access ON qivr.auth_tokens
    FOR ALL
    TO qivr_app_user
    USING (user_id IN (
        SELECT id FROM qivr.users 
        WHERE tenant_id = (current_setting('app.tenant_id')::UUID)
    ));

-- Update existing users with hashed passwords for testing
-- Password: Clinic123!
UPDATE qivr.users 
SET password_hash = '$2a$11$JKKcXRHzVYFycNTOb9xeru7YQzPq/pLF8ltXPvX9Dc9EqGYzMx3RC',
    email_verified = true
WHERE email = 'clinic@qivr.health';

-- Password: Admin123!
UPDATE qivr.users 
SET password_hash = '$2a$11$wQrxLk8H8x4KlRGGv/9z6OSsgrkL.cGRqO37xMLeyqNqT1Bm6EWUW',
    email_verified = true
WHERE email = 'admin@qivr.health';

-- Password: Patient123!
UPDATE qivr.users 
SET password_hash = '$2a$11$/pGmFpnKKt1F8Nls7s4FueB6RfVMQxPRH4OqV/0fBXNP3a.VoHAGi',
    email_verified = true
WHERE email LIKE 'patient%@example.com';
