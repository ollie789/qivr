-- Migration tracking table
-- Run this FIRST on any new database

CREATE SCHEMA IF NOT EXISTS qivr;

CREATE TABLE IF NOT EXISTS qivr.schema_migrations (
    version VARCHAR(14) PRIMARY KEY,        -- YYYYMMDDHHMMSS format
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    checksum VARCHAR(64),                    -- SHA256 of migration file
    applied_by VARCHAR(100) DEFAULT current_user
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied
ON qivr.schema_migrations(applied_at);

-- Mark this migration as applied
INSERT INTO qivr.schema_migrations (version, name, checksum)
VALUES ('000', 'init_tracking', 'manual')
ON CONFLICT (version) DO NOTHING;
