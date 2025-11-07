-- Drop all tables to clean the database
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Grant permissions
GRANT ALL ON SCHEMA public TO qivr_user;
GRANT ALL ON SCHEMA public TO public;
