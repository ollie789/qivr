#!/bin/bash

# Qivr Local Development Stop Script
# This script stops all running services

echo "🛑 Stopping Qivr Local Development Environment"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

# Stop Frontend
echo "Stopping Frontend..."
pkill -f "vite" 2>/dev/null || true

# Stop Backend
echo "Stopping Backend API..."
pkill -f "Qivr.Api" 2>/dev/null || true
pkill -f "dotnet.*Qivr" 2>/dev/null || true

# Stop MinIO
echo "Stopping MinIO..."
pkill -f "minio" 2>/dev/null || true

# Optionally stop PostgreSQL (commented out by default)
# echo "Stopping PostgreSQL..."
# brew services stop postgresql@14 2>/dev/null || true
# pg_ctl stop -D /usr/local/var/postgres 2>/dev/null || true

echo -e "${GREEN}✓ All services stopped${NC}"
echo "=============================================="
