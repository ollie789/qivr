#!/bin/bash

# Qivr Local Development Startup Script
# This script starts all required services for local development

set -e

echo "🚀 Starting Qivr Local Development Environment"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1
}

# Function to wait for a service to be ready
wait_for_service() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    echo -e "${YELLOW}Waiting for $service to be ready on port $port...${NC}"
    while ! check_port $port && [ $attempt -le $max_attempts ]; do
        sleep 1
        ((attempt++))
    done
    
    if check_port $port; then
        echo -e "${GREEN}✓ $service is ready${NC}"
        return 0
    else
        echo -e "${RED}✗ $service failed to start${NC}"
        return 1
    fi
}

# 1. Check PostgreSQL
echo -e "\n${YELLOW}1. Checking PostgreSQL...${NC}"
if check_port 5432; then
    echo -e "${GREEN}✓ PostgreSQL is already running${NC}"
else
    echo "Starting PostgreSQL..."
    # Try to start PostgreSQL (adjust command based on your setup)
    if command -v pg_ctl &> /dev/null; then
        pg_ctl start -D /usr/local/var/postgres 2>/dev/null || true
    elif command -v brew &> /dev/null; then
        brew services start postgresql@14 2>/dev/null || true
    fi
    wait_for_service 5432 "PostgreSQL"
fi

# 2. Check MinIO (S3)
echo -e "\n${YELLOW}2. Checking MinIO (S3 storage)...${NC}"
if check_port 9000; then
    echo -e "${GREEN}✓ MinIO is already running${NC}"
else
    echo "Starting MinIO..."
    # Start MinIO in background
    cd ~/Projects/qivr
    minio server ./data --console-address ":9001" > /dev/null 2>&1 &
    wait_for_service 9000 "MinIO"
fi

# 3. Start Backend API
echo -e "\n${YELLOW}3. Checking Backend API...${NC}"
if check_port 5050; then
    echo -e "${GREEN}✓ Backend API is already running${NC}"
else
    echo "Starting Backend API..."
    cd ~/Projects/qivr/backend
    dotnet run --project Qivr.Api > /dev/null 2>&1 &
    wait_for_service 5050 "Backend API"
fi

# 4. Start Clinic Dashboard Frontend
echo -e "\n${YELLOW}4. Starting Clinic Dashboard Frontend...${NC}"
cd ~/Projects/qivr/apps/clinic-dashboard

# Kill any existing vite processes
pkill -f "vite" 2>/dev/null || true
sleep 1

# Start the frontend
npm run dev &

# Wait a bit for the frontend to start
sleep 3

# Find the actual port being used
FRONTEND_PORT=$(lsof -i -P | grep LISTEN | grep node | grep -E ':[0-9]{4}' | awk '{print $9}' | grep -E '^[*:]+300[0-9]' | head -1 | sed 's/.*://')

if [ -z "$FRONTEND_PORT" ]; then
    FRONTEND_PORT=3002
fi

echo -e "\n${GREEN}=============================================="
echo "🎉 Qivr Local Development Environment Ready!"
echo "=============================================="
echo
echo "Services running:"
echo "  • PostgreSQL:      http://localhost:5432"
echo "  • MinIO Console:   http://localhost:9001"
echo "  • Backend API:     http://localhost:5050"
echo "  • Clinic Dashboard: http://localhost:${FRONTEND_PORT}"
echo
echo "Login credentials:"
echo "  Email:    test.doctor@clinic.com"
echo "  Password: ClinicTest123!"
echo
echo "To stop all services, run: ./stop-local.sh"
echo "=============================================="
echo -e "${NC}"

# Keep the script running
echo "Press Ctrl+C to stop all services..."
wait
