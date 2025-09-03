#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║             Fixing and Restarting Qivr Environment            ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Kill all existing processes
echo -e "${YELLOW}Step 1: Cleaning up existing processes...${NC}"
pkill -f vite 2>/dev/null
pkill -f "dotnet.*Qivr" 2>/dev/null
pkill -f node 2>/dev/null
sleep 3
echo -e "${GREEN}✓ All processes killed${NC}"
echo ""

# Step 2: Fix Amplify configuration for patient portal
echo -e "${YELLOW}Step 2: Fixing patient portal configuration...${NC}"
cat > apps/patient-portal/src/config/amplify.config.ts << 'EOF'
import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'ap-southeast-2_ZMcriKNGJ',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || '4kugfmvk56o3otd0grc4gddi8r',
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID,
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || 'qivr-auth.auth.ap-southeast-2.amazoncognito.com',
          scopes: ['openid', 'profile', 'email', 'phone'],
          redirectSignIn: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNIN || 'http://localhost:3000/auth/callback',
          ],
          redirectSignOut: [
            import.meta.env.VITE_COGNITO_REDIRECT_SIGNOUT || 'http://localhost:3000/',
          ],
      responseType: 'code' as 'code',
        },
        email: true,
        phone: false,
        username: false,
      },
      signUpVerificationMethod: 'code' as const,
      mfa: {
        status: 'optional' as 'optional',
        totpEnabled: true,
        smsEnabled: true,
      },
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
  API: {
    REST: {
      QivrAPI: {
        endpoint: import.meta.env.VITE_API_URL || 'http://localhost:5050/api',
        region: 'ap-southeast-2',
      },
    },
  },
};

// Initialize Amplify only in browser
if (typeof window !== 'undefined') {
  try {
    Amplify.configure(amplifyConfig);
    console.log('Amplify configured successfully for patient portal on port 3000');
  } catch (error) {
    console.error('Failed to configure Amplify:', error);
  }
}

export default amplifyConfig;
EOF
echo -e "${GREEN}✓ Patient portal config fixed${NC}"
echo ""

# Step 3: Create .env files with correct ports if they don't exist
echo -e "${YELLOW}Step 3: Setting up environment files...${NC}"
if [ ! -f apps/patient-portal/.env ]; then
    cat > apps/patient-portal/.env << 'EOF'
VITE_API_URL=http://localhost:5050/api
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_ZMcriKNGJ
VITE_COGNITO_CLIENT_ID=4kugfmvk56o3otd0grc4gddi8r
VITE_COGNITO_REDIRECT_SIGNIN=http://localhost:3000/auth/callback
VITE_COGNITO_REDIRECT_SIGNOUT=http://localhost:3000/
EOF
fi

if [ ! -f apps/clinic-dashboard/.env ]; then
    cat > apps/clinic-dashboard/.env << 'EOF'
VITE_API_URL=http://localhost:5050/api
VITE_WS_URL=ws://localhost:5050/ws
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_jbutB4tj1
VITE_COGNITO_CLIENT_ID=4l510mm689hhpgr12prbuch2og
VITE_COGNITO_REDIRECT_SIGNIN=http://localhost:3001/auth/callback
VITE_COGNITO_REDIRECT_SIGNOUT=http://localhost:3001/
EOF
fi
echo -e "${GREEN}✓ Environment files configured${NC}"
echo ""

# Step 4: Start backend
echo -e "${YELLOW}Step 4: Starting Backend API on port 5050...${NC}"
cd backend
export ASPNETCORE_ENVIRONMENT=Development
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002"
dotnet run --project Qivr.Api --urls "http://localhost:5050" > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend starting (PID: $BACKEND_PID)${NC}"
echo ""

# Step 5: Wait for backend
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5050/ >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Step 6: Start Patient Portal
echo -e "${YELLOW}Step 5: Starting Patient Portal on port 3000...${NC}"
cd apps/patient-portal
npm run dev > ../../logs/patient-portal.log 2>&1 &
PATIENT_PID=$!
cd ../..
echo -e "${GREEN}✓ Patient Portal starting (PID: $PATIENT_PID)${NC}"
echo ""

# Step 7: Start Clinic Dashboard
echo -e "${YELLOW}Step 6: Starting Clinic Dashboard on port 3001...${NC}"
cd apps/clinic-dashboard
npm run dev > ../../logs/clinic-dashboard.log 2>&1 &
CLINIC_PID=$!
cd ../..
echo -e "${GREEN}✓ Clinic Dashboard starting (PID: $CLINIC_PID)${NC}"
echo ""

# Step 8: Wait for frontends
echo -e "${YELLOW}Waiting for frontend apps to be ready...${NC}"
sleep 10
echo ""

# Step 9: Status check
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                      Environment Status                       ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check each service
if lsof -i :5050 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Backend API: http://localhost:5050"
else
    echo -e "${RED}✗${NC} Backend API: Not running"
fi

if lsof -i :3000 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Patient Portal: http://localhost:3000"
else
    echo -e "${RED}✗${NC} Patient Portal: Not running"
fi

if lsof -i :3001 | grep LISTEN > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Clinic Dashboard: http://localhost:3001"
else
    echo -e "${RED}✗${NC} Clinic Dashboard: Not running"
fi

echo ""
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                     Troubleshooting Tips                      ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "If apps show black screens or infinite loading:"
echo "1. Check browser console for errors (F12)"
echo "2. Check logs: tail -f logs/*.log"
echo "3. Verify Cognito configuration in AWS Console"
echo "4. Clear browser cache and cookies"
echo "5. Try incognito/private browsing mode"
echo ""
echo "To monitor logs:"
echo "  Backend:    tail -f logs/backend.log"
echo "  Patient:    tail -f logs/patient-portal.log"
echo "  Clinic:     tail -f logs/clinic-dashboard.log"
echo ""
echo -e "${GREEN}✨ Environment restart complete!${NC}"
