#!/bin/bash

# Start Backend API with proper environment variables
# This script loads environment variables and starts the backend API

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Qivr Backend API...${NC}"

# Change to backend directory
cd "$(dirname "$0")/backend/Qivr.Api"

# Load environment variables from .env.local if it exists
if [ -f "../../.env.local" ]; then
    echo -e "${GREEN}Loading environment variables from .env.local...${NC}"
    export $(grep -v '^#' ../../.env.local | xargs)
else
    echo -e "${YELLOW}Warning: .env.local not found. Using default configuration.${NC}"
fi

# Set default environment if not specified
export ENVIRONMENT="${ENVIRONMENT:-development}"
export ASPNETCORE_ENVIRONMENT="${ASPNETCORE_ENVIRONMENT:-Development}"
export AWS_REGION="${AWS_REGION:-ap-southeast-2}"

echo -e "${GREEN}Configuration:${NC}"
echo "  Environment: $ENVIRONMENT"
echo "  ASP.NET Core Environment: $ASPNETCORE_ENVIRONMENT"
echo "  AWS Region: $AWS_REGION"
echo "  Cognito User Pool: ${COGNITO_USER_POOL_ID:-Not set}"
echo "  Cognito Client ID: ${COGNITO_CLIENT_ID:-Not set}"

if [ "${SYNC_DEV_USERS_ON_START:-false}" = "true" ]; then
    echo -e "${GREEN}Syncing Cognito users into Postgres before startup...${NC}"
    pushd ../.. >/dev/null
    ./scripts/sync-dev-users.sh || echo -e "${YELLOW}User sync failed (continuing).${NC}"
    popd >/dev/null
fi

# Check if database is running
if ! nc -z localhost 5432 2>/dev/null; then
    echo -e "${YELLOW}Warning: PostgreSQL doesn't appear to be running on port 5432${NC}"
    echo "You may need to start it with: docker-compose up -d postgres"
fi

# Check if MinIO is running (for local S3)
if ! nc -z localhost 9000 2>/dev/null; then
    echo -e "${YELLOW}Warning: MinIO doesn't appear to be running on port 9000${NC}"
    echo "You may need to start it with: docker-compose up -d minio"
fi

# Build the project
echo -e "${GREEN}Building the backend...${NC}"
dotnet build

# Run migrations if needed
if [ "${APPLY_MIGRATIONS:-true}" = "true" ]; then
    echo -e "${GREEN}Applying database migrations...${NC}"
    dotnet ef database update || echo -e "${YELLOW}Migration failed or already up to date${NC}"
fi

# Start the API
echo -e "${GREEN}Starting API on http://localhost:5050...${NC}"
dotnet run --urls http://localhost:5050
