#!/bin/bash

# Qivr Platform - Stop All Services
# This script stops all running services

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

echo "🛑 Stopping Qivr Platform Services..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Kill processes on specific ports
kill_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}Stopping service on port $1...${NC}"
        lsof -ti:$1 | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ Stopped service on port $1${NC}"
    else
        echo -e "${GREEN}✓ No service running on port $1${NC}"
    fi
}

# 1. Stop Frontend services
echo -e "${YELLOW}Stopping Frontend services...${NC}"
kill_port 3001  # Clinic Dashboard
kill_port 3002  # Patient Portal

# 2. Stop Backend API
echo -e "${YELLOW}Stopping Backend API...${NC}"
kill_port 5000

# 3. Stop any dotnet processes
echo -e "${YELLOW}Stopping dotnet processes...${NC}"
pkill -f "dotnet.*Qivr" 2>/dev/null || true

# 4. Stop Docker services
echo -e "${YELLOW}Stopping Docker services...${NC}"
cd "$PROJECT_ROOT/infrastructure/docker"
docker-compose stop
echo -e "${GREEN}✓ Docker services stopped${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✅ All services stopped successfully!${NC}"
echo ""
echo "To restart services, run: $PROJECT_ROOT/scripts/start-all.sh"
