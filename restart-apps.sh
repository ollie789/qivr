#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║          QIVR APPLICATION RESTART SCRIPT                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Kill existing processes
echo -e "${YELLOW}Step 1: Stopping existing processes...${NC}"

echo "  Stopping backend processes..."
pkill -f "dotnet.*Qivr.Api" 2>/dev/null
pkill -f "dotnet run.*5050" 2>/dev/null
pkill -f "dotnet-watch" 2>/dev/null
sleep 2

echo "  Stopping frontend processes..."
pkill -f "vite" 2>/dev/null
pkill -f "npm run dev" 2>/dev/null
pkill -f "npm run clinic" 2>/dev/null
pkill -f "npm run patient" 2>/dev/null
pkill -f "npm run widget" 2>/dev/null
sleep 2

# Kill any process on the ports we need
lsof -ti:5050 | xargs kill -9 2>/dev/null || true
lsof -ti:3010 | xargs kill -9 2>/dev/null || true
lsof -ti:3005 | xargs kill -9 2>/dev/null || true
lsof -ti:3003 | xargs kill -9 2>/dev/null || true

echo -e "  ${GREEN}✓ All processes stopped${NC}"

# Step 2: Start Docker services if needed
echo ""
echo -e "${YELLOW}Step 2: Checking Docker services...${NC}"

if docker compose ps | grep -q "postgres"; then
    echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"
else
    echo "  Starting PostgreSQL..."
    docker compose up -d postgres
    sleep 5
fi

if docker compose ps | grep -q "redis"; then
    echo -e "  ${GREEN}✓ Redis is running${NC}"
else
    echo "  Starting Redis..."
    docker compose up -d redis
fi

echo -e "  ${GREEN}✓ Docker services ready${NC}"

# Step 3: Start Backend
echo ""
echo -e "${YELLOW}Step 3: Starting Backend API...${NC}"

cd backend
nohup dotnet run --project Qivr.Api --urls "http://localhost:5050" > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo "  Backend starting (PID: $BACKEND_PID)..."
sleep 5

# Check if backend is healthy
if curl -s http://localhost:5050/health >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Backend API running on http://localhost:5050${NC}"
else
    echo -e "  ${YELLOW}⚠ Backend may still be starting...${NC}"
fi

# Step 4: Install dependencies if needed
echo ""
echo -e "${YELLOW}Step 4: Checking npm dependencies...${NC}"

if [ ! -d "node_modules" ] || [ ! -d "apps/clinic-dashboard/node_modules" ]; then
    echo "  Installing dependencies..."
    npm install
    echo -e "  ${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "  ${GREEN}✓ Dependencies already installed${NC}"
fi

# Step 5: Start Frontend Applications
echo ""
echo -e "${YELLOW}Step 5: Starting Frontend Applications...${NC}"

# Start Clinic Dashboard
echo "  Starting Clinic Dashboard..."
nohup npm run clinic:dev > logs/clinic-dashboard.log 2>&1 &
CLINIC_PID=$!
echo "    Clinic Dashboard starting (PID: $CLINIC_PID)..."
sleep 3

# Start Patient Portal
echo "  Starting Patient Portal..."
nohup npm run patient:dev > logs/patient-portal.log 2>&1 &
PATIENT_PID=$!
echo "    Patient Portal starting (PID: $PATIENT_PID)..."
sleep 3

# Start Widget (optional)
echo "  Starting Booking Widget..."
nohup npm run widget:dev > logs/widget.log 2>&1 &
WIDGET_PID=$!
echo "    Widget starting (PID: $WIDGET_PID)..."
sleep 3

# Step 6: Verify all services
echo ""
echo -e "${YELLOW}Step 6: Verifying services...${NC}"
sleep 5

SERVICES_OK=true

# Check Backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5050/health | grep -q "200\|401"; then
    echo -e "  ${GREEN}✓ Backend API: http://localhost:5050${NC}"
else
    echo -e "  ${RED}✗ Backend API not responding${NC}"
    SERVICES_OK=false
fi

# Check Clinic Dashboard
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3010 | grep -q "200\|304"; then
    echo -e "  ${GREEN}✓ Clinic Dashboard: http://localhost:3010${NC}"
else
    echo -e "  ${RED}✗ Clinic Dashboard not responding${NC}"
    SERVICES_OK=false
fi

# Check Patient Portal
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3005 | grep -q "200\|304"; then
    echo -e "  ${GREEN}✓ Patient Portal: http://localhost:3005${NC}"
else
    echo -e "  ${RED}✗ Patient Portal not responding${NC}"
    SERVICES_OK=false
fi

# Check Widget
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3003 | grep -q "200\|304"; then
    echo -e "  ${GREEN}✓ Booking Widget: http://localhost:3003${NC}"
else
    echo -e "  ${YELLOW}⚠ Booking Widget may still be starting${NC}"
fi

# Summary
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                         SUMMARY                                ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ "$SERVICES_OK" = true ]; then
    echo -e "${GREEN}✅ All applications successfully restarted!${NC}"
else
    echo -e "${YELLOW}⚠️ Some services may still be starting. Check logs in ./logs/${NC}"
fi

echo ""
echo "Process IDs:"
echo "  Backend API: $BACKEND_PID"
echo "  Clinic Dashboard: $CLINIC_PID"
echo "  Patient Portal: $PATIENT_PID"
echo "  Widget: $WIDGET_PID"
echo ""
echo "Log files:"
echo "  Backend: logs/backend.log"
echo "  Clinic: logs/clinic-dashboard.log"
echo "  Patient: logs/patient-portal.log"
echo "  Widget: logs/widget.log"
echo ""
echo "Access URLs:"
echo -e "  ${BLUE}Backend API:${NC} http://localhost:5050/swagger"
echo -e "  ${BLUE}Clinic Dashboard:${NC} http://localhost:3010"
echo -e "  ${BLUE}Patient Portal:${NC} http://localhost:3005"
echo -e "  ${BLUE}Booking Widget:${NC} http://localhost:3003"
echo ""
echo "Test Credentials:"
echo "  Email: doctor@test.com"
echo "  Password: TestPass123!"
echo ""
echo -e "${GREEN}Ready to use!${NC}"