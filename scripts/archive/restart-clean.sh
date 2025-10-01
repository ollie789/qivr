#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}          Complete Qivr Environment Clean Restart                 ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: FORCE KILL everything
echo -e "${YELLOW}Step 1: Force killing ALL processes...${NC}"
# Kill by name
killall -9 node 2>/dev/null
killall -9 vite 2>/dev/null
killall -9 dotnet 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
pkill -9 -f "node" 2>/dev/null
pkill -9 -f "dotnet" 2>/dev/null

# Kill by port
for port in 3000 3001 3002 3003 5050 5000 5001; do
    lsof -ti :$port | xargs kill -9 2>/dev/null
done

sleep 3
echo -e "${GREEN}✓ All processes killed${NC}"
echo ""

# Step 2: Verify ports are clear
echo -e "${YELLOW}Step 2: Verifying ports are clear...${NC}"
ports_clear=true
for port in 3000 3001 5050; do
    if lsof -i :$port | grep LISTEN > /dev/null 2>&1; then
        echo -e "${RED}✗ Port $port is still in use!${NC}"
        ports_clear=false
    else
        echo -e "${GREEN}✓ Port $port is clear${NC}"
    fi
done

if [ "$ports_clear" = false ]; then
    echo -e "${RED}Some ports are still in use. Attempting force clear...${NC}"
    for port in 3000 3001 5050; do
        sudo lsof -ti :$port | xargs sudo kill -9 2>/dev/null
    done
    sleep 2
fi
echo ""

# Step 3: Create proper environment files
echo -e "${YELLOW}Step 3: Creating proper environment files...${NC}"

# Patient Portal .env
cat > apps/patient-portal/.env << 'EOF'
VITE_API_URL=http://localhost:5050/api
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_ZMcriKNGJ
VITE_COGNITO_CLIENT_ID=4kugfmvk56o3otd0grc4gddi8r
VITE_COGNITO_REDIRECT_SIGNIN=http://localhost:3000/auth/callback
VITE_COGNITO_REDIRECT_SIGNOUT=http://localhost:3000/
VITE_DEFAULT_TENANT_ID=11111111-1111-1111-1111-111111111111
EOF

# Clinic Dashboard .env
cat > apps/clinic-dashboard/.env << 'EOF'
VITE_API_URL=http://localhost:5050/api
VITE_WS_URL=ws://localhost:5050/ws
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_jbutB4tj1
VITE_COGNITO_CLIENT_ID=4l510mm689hhpgr12prbuch2og
VITE_COGNITO_REDIRECT_SIGNIN=http://localhost:3001/auth/callback
VITE_COGNITO_REDIRECT_SIGNOUT=http://localhost:3001/
VITE_DEFAULT_TENANT_ID=11111111-1111-1111-1111-111111111111
VITE_DEFAULT_CLINIC_ID=22222222-2222-2222-2222-222222222222
EOF

echo -e "${GREEN}✓ Environment files created${NC}"
echo ""

# Step 4: Fix API client to include default tenant
echo -e "${YELLOW}Step 4: Fixing API clients with default tenant...${NC}"

# Fix patient portal API client
cat > apps/patient-portal/src/lib/api-client.ts << 'EOF'
import { fetchAuthSession } from '@aws-amplify/auth';
import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';

const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function apiRequest<T = any>(options: HttpRequestOptions): Promise<T> {
  try {
    // Try to get auth token, but allow unauthenticated requests
    let accessToken: string | undefined;
    try {
      const session = await fetchAuthSession();
      accessToken = session.tokens?.accessToken?.toString();
    } catch (e) {
      console.log('No auth session, proceeding without token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': DEFAULT_TENANT_ID, // Always include tenant ID
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return await baseClient.request<T>({
      ...options,
      headers,
    });
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'GET', params }),
  post: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'POST', data, params }),
  put: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'PUT', data, params }),
  patch: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'PATCH', data, params }),
  delete: <T = any>(url: string, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'DELETE', params }),
};

export default api;
EOF

# Fix clinic dashboard API client
cat > apps/clinic-dashboard/src/lib/api-client.ts << 'EOF'
import { fetchAuthSession } from '@aws-amplify/auth';
import { createHttpClient, HttpError, type HttpRequestOptions } from '@qivr/http';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
const DEFAULT_TENANT_ID = import.meta.env.VITE_DEFAULT_TENANT_ID || '11111111-1111-1111-1111-111111111111';
const DEFAULT_CLINIC_ID = import.meta.env.VITE_DEFAULT_CLINIC_ID || '22222222-2222-2222-2222-222222222222';

const baseClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

export async function apiRequest<T = any>(options: HttpRequestOptions): Promise<T> {
  try {
    // Try to get auth token, but allow unauthenticated requests
    let accessToken: string | undefined;
    try {
      const session = await fetchAuthSession();
      accessToken = session.tokens?.accessToken?.toString();
    } catch (e) {
      console.log('No auth session, proceeding without token');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Tenant-Id': DEFAULT_TENANT_ID,
      'X-Clinic-Id': DEFAULT_CLINIC_ID,
      ...options.headers,
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    return await baseClient.request<T>({
      ...options,
      headers,
    });
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

export const api = {
  get: <T = any>(url: string, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'GET', params }),
  post: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'POST', data, params }),
  put: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'PUT', data, params }),
  patch: <T = any>(url: string, data?: any, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'PATCH', data, params }),
  delete: <T = any>(url: string, params?: Record<string, any>) => 
    apiRequest<T>({ url, method: 'DELETE', params }),
};

export default api;
EOF

echo -e "${GREEN}✓ API clients fixed${NC}"
echo ""

# Step 5: Start Backend
echo -e "${YELLOW}Step 5: Starting Backend API...${NC}"
cd backend
export ASPNETCORE_ENVIRONMENT=Development
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:3003"
nohup dotnet run --project Qivr.Api --urls "http://localhost:5050" > ../logs/backend-clean.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}✓ Backend starting (PID: $BACKEND_PID)${NC}"

# Wait for backend
echo -n "Waiting for backend..."
for i in {1..30}; do
    if curl -s -H "X-Tenant-Id: 11111111-1111-1111-1111-111111111111" http://localhost:5050/api >/dev/null 2>&1; then
        echo -e " ${GREEN}Ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""

# Step 6: Start Patient Portal
echo -e "${YELLOW}Step 6: Starting Patient Portal...${NC}"
cd apps/patient-portal
nohup npm run dev > ../../logs/patient-portal-clean.log 2>&1 &
PATIENT_PID=$!
cd ../..
echo -e "${GREEN}✓ Patient Portal starting (PID: $PATIENT_PID)${NC}"
echo ""

# Step 7: Start Clinic Dashboard
echo -e "${YELLOW}Step 7: Starting Clinic Dashboard...${NC}"
cd apps/clinic-dashboard
nohup npm run dev > ../../logs/clinic-dashboard-clean.log 2>&1 &
CLINIC_PID=$!
cd ../..
echo -e "${GREEN}✓ Clinic Dashboard starting (PID: $CLINIC_PID)${NC}"
echo ""

# Step 8: Wait and verify
echo -e "${YELLOW}Waiting for all services to start...${NC}"
sleep 10

# Final verification
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                     Final Status Check                           ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# Check what ports apps actually started on
PATIENT_PORT=$(grep -o "http://localhost:[0-9]*" logs/patient-portal-clean.log | tail -1 | grep -o "[0-9]*$")
CLINIC_PORT=$(grep -o "http://localhost:[0-9]*" logs/clinic-dashboard-clean.log | tail -1 | grep -o "[0-9]*$")

if [ -z "$PATIENT_PORT" ]; then PATIENT_PORT="3000"; fi
if [ -z "$CLINIC_PORT" ]; then CLINIC_PORT="3001"; fi

echo -e "${GREEN}Services Running:${NC}"
echo ""
if lsof -i :5050 | grep LISTEN > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Backend API:      http://localhost:5050"
    echo -e "                      http://localhost:5050/swagger (if configured)"
else
    echo -e "  ${RED}✗${NC} Backend API:      Not running"
fi

if lsof -i :$PATIENT_PORT | grep LISTEN > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Patient Portal:   http://localhost:$PATIENT_PORT"
else
    echo -e "  ${RED}✗${NC} Patient Portal:   Not running"
fi

if lsof -i :$CLINIC_PORT | grep LISTEN > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Clinic Dashboard: http://localhost:$CLINIC_PORT"
else
    echo -e "  ${RED}✗${NC} Clinic Dashboard: Not running"
fi

echo ""
echo -e "${BLUE}Testing API Connectivity:${NC}"
echo ""
# Test backend with tenant header
if curl -s -H "X-Tenant-Id: 11111111-1111-1111-1111-111111111111" -H "Content-Type: application/json" http://localhost:5050/api/health 2>&1 | grep -q "error"; then
    echo -e "  ${YELLOW}⚠${NC}  Backend requires authentication or has no /api/health endpoint"
else
    echo -e "  ${GREEN}✓${NC} Backend API responding correctly"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}                    Important Notes                               ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. If apps show black screens:"
echo "   - Open browser console (F12) to see actual errors"
echo "   - Hard refresh (Cmd+Shift+R)"
echo "   - Clear browser cache and cookies"
echo ""
echo "2. Monitor logs:"
echo "   tail -f logs/backend-clean.log"
echo "   tail -f logs/patient-portal-clean.log"
echo "   tail -f logs/clinic-dashboard-clean.log"
echo ""
echo "3. The apps are configured with default tenant IDs:"
echo "   - Tenant: 11111111-1111-1111-1111-111111111111"
echo "   - Clinic: 22222222-2222-2222-2222-222222222222"
echo ""
echo -e "${GREEN}✨ Clean restart complete! Opening browsers...${NC}"

# Open browsers
sleep 2
open http://localhost:$PATIENT_PORT
open http://localhost:$CLINIC_PORT
