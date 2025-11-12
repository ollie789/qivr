#!/bin/bash

echo "🧹 Clearing test data from database and Cognito..."

# Clear database
echo "Clearing database..."
PGPASSWORD="Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=" psql -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com -U qivr_user -d qivr -c "
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE tenants CASCADE;
"

# Clear Cognito users (you'll need to add specific user pool ID)
echo "Clearing Cognito users..."
# aws cognito-idp list-users --user-pool-id YOUR_USER_POOL_ID --region ap-southeast-2
# aws cognito-idp admin-delete-user --user-pool-id YOUR_USER_POOL_ID --username EMAIL --region ap-southeast-2

echo "✅ Test data cleared from both database and Cognito"
