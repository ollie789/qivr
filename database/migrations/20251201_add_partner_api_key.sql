-- Add ApiKeyHash column to research_partners table
ALTER TABLE research_partners ADD COLUMN IF NOT EXISTS api_key_hash VARCHAR(128);

-- Set API key for Medtronic (password: medtronic2024)
-- SHA256 hash in base64
UPDATE research_partners 
SET api_key_hash = 'P225+WmcjJfTf8YW7GHrlNeTTgxqSmVvbnOk6EG55w8=' 
WHERE slug = 'medtronic';
