#!/bin/bash

# Script to create a user in the database from Cognito
# This is a temporary fix until the auto-create middleware is working properly

echo "Creating user in database..."

# Get the Cognito user details
COGNITO_SUB="a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c"  # From the logs
EMAIL="your-email@example.com"  # Replace with actual email
FIRST_NAME="Test"
LAST_NAME="User"

# Create a SQL script to insert the user
cat > /tmp/create_user.sql << EOF
-- Create default tenant if it doesn't exist
INSERT INTO tenants (id, name, slug, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', 'Default Clinic', 'default-clinic', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create default clinic if it doesn't exist
INSERT INTO clinics (id, tenant_id, name, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'Default Clinic', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create the user
INSERT INTO users (id, cognito_sub, email, first_name, last_name, user_type, tenant_id, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '${COGNITO_SUB}',
    '${EMAIL}',
    '${FIRST_NAME}',
    '${LAST_NAME}',
    'Admin',
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW()
) ON CONFLICT (cognito_sub) DO NOTHING;
EOF

echo "SQL script created at /tmp/create_user.sql"
echo "You need to run this against your PostgreSQL database."
echo ""
echo "To execute:"
echo "1. Connect to your RDS instance"
echo "2. Run the SQL commands in /tmp/create_user.sql"
echo ""
echo "Or use the AWS RDS Data API if configured."
