#!/bin/bash

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

# Kill any existing processes on our ports
echo -e "${YELLOW}Checking for existing processes...${NC}"
kill_port 5000
kill_port 3000
kill_port 3001
kill_port 3002
kill_port 5173  # Also kill Widget if running on default Vite port

# Get the project root directory
PROJECT_ROOT="$(pwd)"

# Start Backend API
echo -e "\n${GREEN}1. Starting Backend API (port 5000)...${NC}"
cd "$PROJECT_ROOT/backend"
ASPNETCORE_ENVIRONMENT=Development dotnet watch run --project Qivr.Api > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"

# Wait for backend to start
echo "   Waiting for backend to start..."
sleep 5

# Check if backend is running
if check_port 5000; then
    echo -e "   ${GREEN}✓ Backend API is running on http://localhost:5000${NC}"
else
    echo -e "   ${RED}✗ Backend API failed to start. Check logs/backend.log${NC}"
fi

# Start Clinic Dashboard
echo -e "\n${GREEN}2. Starting Clinic Dashboard (port 3001)...${NC}"
cd "$PROJECT_ROOT/apps/clinic-dashboard"
npm run dev > "$PROJECT_ROOT/logs/clinic-dashboard.log" 2>&1 &
CLINIC_PID=$!
echo "   Clinic Dashboard PID: $CLINIC_PID"

# Start Patient Portal
echo -e "\n${GREEN}3. Starting Patient Portal (port 3002)...${NC}"
cd "$PROJECT_ROOT/apps/patient-portal"
npm run dev > "$PROJECT_ROOT/logs/patient-portal.log" 2>&1 &
PATIENT_PID=$!
echo "   Patient Portal PID: $PATIENT_PID"

# Start Widget
echo -e "\n${GREEN}4. Starting Widget (port 3000)...${NC}"
cd "$PROJECT_ROOT/apps/widget"
npm run dev > "$PROJECT_ROOT/logs/widget.log" 2>&1 &
WIDGET_PID=$!
echo "   Widget PID: $WIDGET_PID"

# Wait for frontends to start
echo -e "\n${YELLOW}Waiting for frontend apps to start...${NC}"
sleep 12  # Give Widget more time to start with new config

# Check status of all apps
echo -e "\n${GREEN}====== Application Status ======${NC}"

if check_port 5000; then
    echo -e "✓ Backend API:      ${GREEN}http://localhost:5000${NC}"
else
    echo -e "✗ Backend API:      ${RED}Not running${NC}"
fi

if check_port 3001; then
    echo -e "✓ Clinic Dashboard: ${GREEN}http://localhost:3001${NC}"
else
    echo -e "✗ Clinic Dashboard: ${RED}Not running${NC}"
fi

if check_port 3002; then
    echo -e "✓ Patient Portal:   ${GREEN}http://localhost:3002${NC}"
else
    echo -e "✗ Patient Portal:   ${RED}Not running${NC}"
fi

if check_port 3000; then
    echo -e "✓ Widget:           ${GREEN}http://localhost:3000${NC}"
else
    echo -e "✗ Widget:           ${RED}Not running${NC}"
fi

echo -e "\n${GREEN}====== Additional Services ======${NC}"
echo -e "Swagger UI:         ${GREEN}http://localhost:5000/swagger${NC}"
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
