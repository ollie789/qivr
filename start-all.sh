#!/bin/bash

# QIVR Services Startup Script - STANDARDIZED PORTS
# ================================================
# Backend API:      5050 (Avoids macOS AirPlay on 5000)
# Patient Portal:   3005 (User preferred port)  
# Clinic Dashboard: 3010 (User preferred port)
# ================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Qivr Platform...${NC}"
echo "=============================="

# Function to check if port is in use
check_port() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    if check_port $1; then
        echo -e "${YELLOW}Port $1 is in use. Killing existing process...${NC}"
        lsof -ti :$1 | xargs kill -9 2>/dev/null
        sleep 1
    fi
}

# Ensure directories exist
mkdir -p logs
mkdir -p .pids

# Kill any existing processes on our STANDARDIZED ports
echo -e "${YELLOW}Checking for existing processes...${NC}"
kill_port 5050  # Backend API
kill_port 3005  # Patient Portal
kill_port 3010  # Clinic Dashboard
# Also kill any old ports that might be in use
kill_port 3000  # Old patient portal port
kill_port 3001  # Old clinic dashboard port
kill_port 5000  # Old backend port (macOS AirPlay)
kill_port 5001  # Old backend port

# Get the project root directory
PROJECT_ROOT="$(pwd)"

# Start Backend API
echo -e "\n${GREEN}1. Starting Backend API (port 5050)...${NC}"
cd "$PROJECT_ROOT/backend"
ASPNETCORE_ENVIRONMENT=Development dotnet watch run --project Qivr.Api --urls "http://localhost:5050" > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 5

# Check if backend is running
if check_port 5050; then
    echo -e "   ${GREEN}✓ Backend API is running on http://localhost:5050${NC}"
else
    echo -e "   ${RED}✗ Backend API failed to start. Check logs/backend.log${NC}"
fi

# Start Clinic Dashboard
echo -e "\n${GREEN}2. Starting Clinic Dashboard (port 3010)...${NC}"
cd "$PROJECT_ROOT/apps/clinic-dashboard"
npm run dev > "$PROJECT_ROOT/logs/clinic-dashboard.log" 2>&1 &
CLINIC_PID=$!
echo "   Clinic Dashboard PID: $CLINIC_PID"

# Start Patient Portal
echo -e "\n${GREEN}3. Starting Patient Portal (port 3005)...${NC}"
cd "$PROJECT_ROOT/apps/patient-portal"
npm run dev > "$PROJECT_ROOT/logs/patient-portal.log" 2>&1 &
PATIENT_PID=$!
echo "   Patient Portal PID: $PATIENT_PID"

# Start Widget (if exists)
if [ -d "$PROJECT_ROOT/apps/widget" ]; then
    echo -e "\n${GREEN}4. Starting Widget (port 3003)...${NC}"
    cd "$PROJECT_ROOT/apps/widget"
    PORT=3003 npm run dev > "$PROJECT_ROOT/logs/widget.log" 2>&1 &
    WIDGET_PID=$!
    echo "   Widget PID: $WIDGET_PID"
fi

# Wait for frontends to start
echo -e "\n${YELLOW}Waiting for frontend apps to start...${NC}"
sleep 12  # Give Widget more time to start with new config

# Check status of all apps
echo -e "\n${GREEN}====== Application Status ======${NC}"

if check_port 5050; then
    echo -e "✓ Backend API:      ${GREEN}http://localhost:5050${NC}"
else
    echo -e "✗ Backend API:      ${RED}Not running${NC}"
fi

if check_port 3010; then
    echo -e "✓ Clinic Dashboard: ${GREEN}http://localhost:3010${NC}"
else
    echo -e "✗ Clinic Dashboard: ${RED}Not running${NC}"
fi

if check_port 3005; then
    echo -e "✓ Patient Portal:   ${GREEN}http://localhost:3005${NC}"
else
    echo -e "✗ Patient Portal:   ${RED}Not running${NC}"
fi

if [ -d "$PROJECT_ROOT/apps/widget" ] && check_port 3003; then
    echo -e "✓ Widget:           ${GREEN}http://localhost:3003${NC}"
fi

echo -e "\n${GREEN}====== Additional Services ======${NC}"
echo -e "Swagger UI:         ${GREEN}http://localhost:5050/swagger${NC}"
echo -e "pgAdmin:            ${GREEN}http://localhost:8081${NC}"
echo -e "MinIO Console:      ${GREEN}http://localhost:9001${NC}"
echo -e "Mailhog:            ${GREEN}http://localhost:8025${NC}"

echo -e "\n${YELLOW}Logs are available in the 'logs' directory${NC}"
echo -e "${YELLOW}To stop all services, run: ./stop-all.sh${NC}"

# Save PIDs to file for stop script
echo "$BACKEND_PID" > "$PROJECT_ROOT/.pids/backend.pid"
echo "$CLINIC_PID" > "$PROJECT_ROOT/.pids/clinic.pid"
echo "$PATIENT_PID" > "$PROJECT_ROOT/.pids/patient.pid"
echo "$WIDGET_PID" > "$PROJECT_ROOT/.pids/widget.pid"

echo -e "\n${GREEN}All applications started successfully!${NC}"
