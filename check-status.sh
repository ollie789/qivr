#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║           Qivr Development Environment Status                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to check service status
check_service() {
    local port=$1
    local name=$2
    local url=$3
    
    if lsof -i :$port >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} $name (port $port): ${GREEN}Running${NC}"
        if [ ! -z "$url" ]; then
            echo "  → Access at: ${BLUE}$url${NC}"
        fi
        return 0
    else
        echo -e "${RED}✗${NC} $name (port $port): ${RED}Not Running${NC}"
        return 1
    fi
}

# Function to check Docker container
check_container() {
    local name=$1
    if docker ps --format "{{.Names}}" | grep -q "^$name$"; then
        echo -e "${GREEN}✓${NC} $name: ${GREEN}Running${NC}"
        return 0
    else
        echo -e "${RED}✗${NC} $name: ${RED}Not Running${NC}"
        return 1
    fi
}

echo -e "${YELLOW}Infrastructure Services (Docker):${NC}"
echo "────────────────────────────────────"
check_container "qivr-postgres"
check_container "qivr-minio"
check_container "qivr-mailhog"
check_container "qivr-redis"
check_container "qivr-pgadmin"
check_container "qivr-jaeger"
echo ""

echo -e "${YELLOW}Backend Services:${NC}"
echo "────────────────────────────────────"
check_service 5050 "Backend API" "http://localhost:5050"

# Check if backend API is actually responding
if curl -s http://localhost:5050/ >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ API is responding${NC}"
else
    echo -e "  ${YELLOW}⚠ API may be starting up or requires authentication${NC}"
fi
echo ""

echo -e "${YELLOW}Frontend Applications:${NC}"
echo "────────────────────────────────────"
check_service 3000 "Patient Portal" "http://localhost:3000"
check_service 3001 "Clinic Dashboard" "http://localhost:3001"
check_service 3002 "Application (Port 3002)" "http://localhost:3002"
check_service 3003 "Widget" "http://localhost:3003"
echo ""

echo -e "${YELLOW}Development Tools:${NC}"
echo "────────────────────────────────────"
check_service 8025 "Mailhog Web UI" "http://localhost:8025"
check_service 8081 "pgAdmin" "http://localhost:8081"
check_service 9001 "MinIO Console" "http://localhost:9001"
check_service 16686 "Jaeger UI" "http://localhost:16686"
echo ""

# Check environment variables
echo -e "${YELLOW}Environment Configuration:${NC}"
echo "────────────────────────────────────"
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local file found"
    # Count configured variables
    var_count=$(grep -v '^#' .env.local | grep '=' | wc -l | tr -d ' ')
    echo "  → $var_count environment variables configured"
else
    echo -e "${RED}✗${NC} .env.local file not found"
fi

# Check for Cognito configuration
if [ ! -z "$COGNITO_USER_POOL_ID" ]; then
    echo -e "${GREEN}✓${NC} AWS Cognito configured"
else
    echo -e "${YELLOW}⚠${NC} AWS Cognito not configured in environment"
fi
echo ""

# Summary
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                           Summary                             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"

# Count running services
backend_running=0
frontend_running=0
infra_running=0

lsof -i :5050 >/dev/null 2>&1 && backend_running=1

for port in 3000 3001 3002 3003; do
    lsof -i :$port >/dev/null 2>&1 && ((frontend_running++))
done

for container in qivr-postgres qivr-minio qivr-mailhog qivr-redis; do
    docker ps --format "{{.Names}}" | grep -q "^$container$" && ((infra_running++))
done

echo ""
echo "Infrastructure: $infra_running/4 services running"
echo "Backend: $([ $backend_running -eq 1 ] && echo "Running ✓" || echo "Not running ✗")"
echo "Frontend: $frontend_running/4 applications running"
echo ""

if [ $backend_running -eq 1 ] && [ $frontend_running -gt 0 ] && [ $infra_running -gt 2 ]; then
    echo -e "${GREEN}✨ Your Qivr development environment is ready!${NC}"
    echo ""
    echo "Quick access links:"
    echo "  • Patient Portal:    http://localhost:3000"
    echo "  • Clinic Dashboard:  http://localhost:3001"
    echo "  • Backend API:       http://localhost:5050"
    echo "  • Email Testing:     http://localhost:8025"
else
    echo -e "${YELLOW}⚠ Some services are not running.${NC}"
    echo ""
    echo "To start all services, run:"
    echo "  ./start-all.sh"
fi
echo ""
