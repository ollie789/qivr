#!/bin/bash

# Qivr Platform - Health Check
# This script checks the status of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔍 Qivr Platform Health Check"
echo "=================================="

# Function to check if port is in use
check_service() {
    local port=$1
    local name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name (port $port): Running"
        return 0
    else
        echo -e "${RED}✗${NC} $name (port $port): Not running"
        return 1
    fi
}

# Function to check HTTP endpoint
check_http() {
    local url=$1
    local name=$2
    
    if curl -s -f -o /dev/null "$url" 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $name: Responding at $url"
        return 0
    else
        echo -e "${YELLOW}⚠${NC} $name: Not responding at $url"
        return 1
    fi
}

echo ""
echo "Service Status:"
echo "--------------"
check_service 5000 "Backend API"
check_service 3001 "Clinic Dashboard"
check_service 3002 "Patient Portal"
check_service 5432 "PostgreSQL"
check_service 6379 "Redis"
check_service 9000 "MinIO S3"

echo ""
echo "HTTP Endpoints:"
echo "--------------"
check_http "http://localhost:5000/health" "Backend API Health"
check_http "http://localhost:3001" "Clinic Dashboard UI"
check_http "http://localhost:3002" "Patient Portal UI"
check_http "http://localhost:9001" "MinIO Console"
check_http "http://localhost:8025" "Mailhog"

echo ""
echo "=================================="
echo "Health check complete!"
echo ""
echo "To view logs:"
echo "  Backend: tail -f logs/backend.log"
echo "  Clinic:  tail -f logs/clinic-dashboard.log"
echo "  Patient: tail -f logs/patient-portal.log"
