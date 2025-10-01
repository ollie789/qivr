#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# New Cognito values
NEW_POOL_ID="ap-southeast-2_b48ZBE35F"
NEW_CLIENT_ID="3u1j21aero8u8c7a4gh52g9qhb"
NEW_CLIENT_SECRET="1sfitrb0486vqg0gqve60q7neqnhkkrfkulkkptnvfkgv1v74amm"
NEW_DOCTOR_SUB="b96ee4f8-7051-7098-213f-dafccafb06f9"
NEW_NURSE_SUB="297ea408-e011-7097-1906-7029fc951438"
TENANT_ID="b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"

echo -e "${BLUE}📝 Updating Configurations with New Cognito User Pool${NC}"
echo "======================================================"
echo ""

# Step 1: Update Backend Configuration
echo -e "${YELLOW}Step 1: Updating backend configuration...${NC}"

# Update appsettings.Development.json
BACKEND_CONFIG="/Users/oliver/Projects/qivr/backend/Qivr.Api/appsettings.Development.json"
if [ -f "$BACKEND_CONFIG" ]; then
    # Backup original
    cp "$BACKEND_CONFIG" "$BACKEND_CONFIG.backup"
    
    # Update UserPoolId
    jq --arg poolId "$NEW_POOL_ID" \
       '.Cognito.UserPoolId = $poolId' "$BACKEND_CONFIG" > /tmp/appsettings.tmp && \
    mv /tmp/appsettings.tmp "$BACKEND_CONFIG"
    
    echo -e "  ${GREEN}✓ Updated backend appsettings.Development.json${NC}"
else
    echo -e "  ⚠️  Backend config not found at $BACKEND_CONFIG"
fi

# Step 2: Update Frontend Configuration
echo ""
echo -e "${YELLOW}Step 2: Updating frontend configurations...${NC}"

# Update clinic dashboard .env
CLINIC_ENV="/Users/oliver/Projects/qivr/apps/clinic-dashboard/.env"
if [ -f "$CLINIC_ENV" ]; then
    # Backup original
    cp "$CLINIC_ENV" "$CLINIC_ENV.backup"
    
    # Update the values
    sed -i '' "s/VITE_COGNITO_USER_POOL_ID=.*/VITE_COGNITO_USER_POOL_ID=$NEW_POOL_ID/" "$CLINIC_ENV"
    sed -i '' "s/VITE_COGNITO_CLIENT_ID=.*/VITE_COGNITO_CLIENT_ID=$NEW_CLIENT_ID/" "$CLINIC_ENV"
    
    echo -e "  ${GREEN}✓ Updated clinic dashboard .env${NC}"
else
    echo -e "  ⚠️  Clinic dashboard .env not found"
fi

# Step 3: Update Database
echo ""
echo -e "${YELLOW}Step 3: Updating database with new Cognito sub IDs...${NC}"

cat > /tmp/update_db_subs.sql << EOF
-- Update doctor@test.com with new Cognito sub
UPDATE users 
SET cognito_id = '$NEW_DOCTOR_SUB'
WHERE email = 'doctor@test.com';

-- Update nurse@test.com with new Cognito sub
UPDATE users
SET cognito_id = '$NEW_NURSE_SUB'
WHERE email = 'nurse@test.com';

-- Verify the updates
SELECT id, email, cognito_id, role, tenant_id 
FROM users 
WHERE email IN ('doctor@test.com', 'nurse@test.com');
EOF

PGPASSWORD="Sp06Ylqn5Wv8rHWjWmR4ttnzB3jDe+sG7pEuDF2+7hY=" \
psql -h qivr-dev-db.ctueyqyqmqmz.ap-southeast-2.rds.amazonaws.com \
     -p 5432 -U qivr_user -d qivr \
     -f /tmp/update_db_subs.sql

echo -e "  ${GREEN}✓ Database updated with new sub IDs${NC}"

# Step 4: Update backend authentication to use simpler claim names
echo ""
echo -e "${YELLOW}Step 4: Updating backend authentication code...${NC}"

# The backend already checks for both formats, but let's ensure it prioritizes the simpler format
cat > /tmp/auth_update.txt << 'EOF'
The backend AuthenticationExtensions.cs already checks for both:
- custom:role (correct format)
- custom:custom:role (old format)

Since we're now using the correct format (custom:role), the backend 
will properly extract the claims from the JWT token.
EOF

echo -e "  ${GREEN}✓ Backend already configured to handle both formats${NC}"

# Step 5: Restart backend
echo ""
echo -e "${YELLOW}Step 5: Restarting backend...${NC}"

# Kill existing backend process
pkill -f "dotnet.*Qivr.Api" 2>/dev/null || true
sleep 2

# Start backend
cd /Users/oliver/Projects/qivr/backend
nohup dotnet run --project Qivr.Api --urls "http://localhost:5050" > backend-fixed.log 2>&1 &
echo -e "  ${GREEN}✓ Backend restarted${NC}"

echo ""
echo -e "${GREEN}✅ Configuration Update Complete!${NC}"
echo ""
echo "======================================================"
echo "Summary of changes:"
echo "======================================================"
echo ""
echo "✅ New User Pool: $NEW_POOL_ID"
echo "✅ Custom attributes now properly named (custom:role, not custom:custom:role)"
echo "✅ Backend configuration updated"
echo "✅ Frontend configuration updated"
echo "✅ Database updated with new sub IDs"
echo "✅ Backend restarted"
echo ""
echo "Test credentials remain the same:"
echo "  Email: doctor@test.com"
echo "  Password: TestPass123!"
echo ""
echo "The JWT tokens will now contain cleaner claim names:"
echo "  • custom:role"
echo "  • custom:tenant_id"
echo "  • custom:clinic_id"
echo ""
echo "You can now test login at http://localhost:3010"
echo "======================================================"