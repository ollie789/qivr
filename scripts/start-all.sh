#!/bin/bash

# Qivr Platform - Start All Services
# This script starts all necessary services for local development

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🚀 Starting Qivr Platform Services..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        return 0
    else
        return 1
    fi
}

# 1. Start Docker services
echo -e "${YELLOW}Starting Docker services...${NC}"
cd "$PROJECT_ROOT/infrastructure/docker"
if ! docker-compose ps | grep -q "Up"; then
    docker-compose up -d
    echo -e "${GREEN}✓ Docker services started${NC}"
    sleep 5  # Wait for services to be ready
else
    echo -e "${GREEN}✓ Docker services already running${NC}"
fi

# 2. Start Backend API
echo -e "${YELLOW}Starting Backend API...${NC}"
if ! check_port 5000; then
    cd "$PROJECT_ROOT/backend/Qivr.Api"
    dotnet run > "$PROJECT_ROOT/logs/backend.log" 2>&1 &
    echo -e "${GREEN}✓ Backend API starting on http://localhost:5000${NC}"
    sleep 5
else
    echo -e "${GREEN}✓ Backend API already running on port 5000${NC}"
fi

# 3. Start Clinic Dashboard
echo -e "${YELLOW}Starting Clinic Dashboard...${NC}"
if ! check_port 3001; then
    cd "$PROJECT_ROOT/apps/clinic-dashboard"
    npm run dev > "$PROJECT_ROOT/logs/clinic-dashboard.log" 2>&1 &
    echo -e "${GREEN}✓ Clinic Dashboard starting on http://localhost:3001${NC}"
else
    echo -e "${GREEN}✓ Clinic Dashboard already running on port 3001${NC}"
fi

# 4. Start Patient Portal
echo -e "${YELLOW}Starting Patient Portal...${NC}"
if ! check_port 3002; then
    cd "$PROJECT_ROOT/apps/patient-portal"
    npm run dev > "$PROJECT_ROOT/logs/patient-portal.log" 2>&1 &
    echo -e "${GREEN}✓ Patient Portal starting on http://localhost:3002${NC}"
else
    echo -e "${GREEN}✓ Patient Portal already running on port 3002${NC}"
fi

echo ""
echo "=================================="
echo -e "${GREEN}✅ All services started successfully!${NC}"
echo ""
echo "Access the services at:"
echo "  • Backend API:      http://localhost:5000"
echo "  • Swagger Docs:     http://localhost:5000/swagger"
echo "  • Clinic Dashboard: http://localhost:3001"
echo "  • Patient Portal:   http://localhost:3002"
echo "  • PostgreSQL:       localhost:5432"
echo "  • Redis:            localhost:6379"
echo "  • MinIO Console:    http://localhost:9001"
echo "  • Mailhog:          http://localhost:8025"
echo ""
echo "Logs are available in: $PROJECT_ROOT/logs/"
echo ""
echo "To stop all services, run: $PROJECT_ROOT/scripts/stop-all.sh"
