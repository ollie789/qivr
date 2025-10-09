#!/bin/bash

# Quick script to seed staging database with the required user records
# Run this from an environment that has access to the RDS instance

# Database connection details from staging secrets
DB_HOST="qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com"
DB_USER="qivr_user"
DB_PASS="Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY="
DB_NAME="qivr"

# SQL to create the required records
SQL="
-- Create tenant
INSERT INTO qivr.tenants (id, name, slug, created_at, updated_at) 
VALUES ('b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', 'Test Tenant', 'test-tenant', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create clinic
INSERT INTO qivr.clinics (id, name, tenant_id, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222222', 'Test Clinic', 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Create admin user (matches JWT sub)
INSERT INTO qivr.users (id, cognito_id, email, first_name, last_name, tenant_id, role)
VALUES (
  'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c',
  'a0c05a9f-a1ec-489d-aef0-c4f7e7a7787c', 
  'doctor@test.com',
  'Test',
  'Doctor',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  'admin'
) ON CONFLICT (cognito_id) DO NOTHING;

-- Create nurse user
INSERT INTO qivr.users (id, cognito_id, email, first_name, last_name, tenant_id, role)
VALUES (
  '27f20e6c-d4a8-4d82-a576-d726038def7e',
  '27f20e6c-d4a8-4d82-a576-d726038def7e', 
  'nurse@test.com',
  'Test',
  'Nurse',
  'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11',
  'staff'
) ON CONFLICT (cognito_id) DO NOTHING;
"

# Run the SQL
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "$SQL"

echo "Seeding complete! Test with:"
echo "curl -H 'Authorization: Bearer YOUR_JWT_TOKEN' http://3.25.217.124:8080/api/patients"
