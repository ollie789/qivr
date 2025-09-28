#!/bin/bash

# Qivr Installation Script for macOS
# This script helps install required dependencies

echo "🚀 Qivr Installation Helper"
echo "=========================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        return 1
    fi
}

echo "Checking system requirements..."
echo ""

# Check for Homebrew
if command_exists brew; then
    print_status 0 "Homebrew is installed"
else
    print_status 1 "Homebrew is not installed"
    echo ""
    echo "Homebrew is required for easy installation of dependencies."
    echo "To install Homebrew, run:"
    echo ""
    echo '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "After installing Homebrew, run this script again."
    exit 1
fi

echo ""
echo "Checking required tools..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_status 0 "Node.js is installed ($NODE_VERSION)"
else
    print_status 1 "Node.js is not installed"
    echo "  To install: brew install node"
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_status 0 "npm is installed ($NPM_VERSION)"
else
    print_status 1 "npm is not installed"
fi

# Check .NET SDK
if command_exists dotnet; then
    DOTNET_VERSION=$(dotnet --version)
    print_status 0 ".NET SDK is installed ($DOTNET_VERSION)"
else
    print_status 1 ".NET SDK is not installed"
    echo "  To install: brew install --cask dotnet-sdk"
fi

# Check Docker
if command_exists docker; then
    DOCKER_VERSION=$(docker --version | cut -d' ' -f3 | cut -d',' -f1)
    print_status 0 "Docker is installed ($DOCKER_VERSION)"
    
    # Check Docker Compose
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version --short)
        print_status 0 "Docker Compose is installed ($COMPOSE_VERSION)"
    else
        print_status 1 "Docker Compose plugin is not installed"
    fi
else
    print_status 1 "Docker is not installed"
    echo "  To install: Download Docker Desktop from https://www.docker.com/products/docker-desktop/"
    echo "  Or via Homebrew: brew install --cask docker"
fi

# Check PostgreSQL client
if command_exists psql; then
    PSQL_VERSION=$(psql --version | cut -d' ' -f3)
    print_status 0 "PostgreSQL client is installed ($PSQL_VERSION)"
else
    print_status 1 "PostgreSQL client is not installed (optional)"
    echo "  To install: brew install postgresql"
fi

# Check AWS CLI
if command_exists aws; then
    AWS_VERSION=$(aws --version | cut -d' ' -f1 | cut -d'/' -f2)
    print_status 0 "AWS CLI is installed ($AWS_VERSION)"
else
    print_status 1 "AWS CLI is not installed (optional for local dev)"
    echo "  To install: brew install awscli"
fi

# Check jq (required for sync scripts)
if command_exists jq; then
    JQ_VERSION=$(jq --version)
    print_status 0 "jq is installed ($JQ_VERSION)"
else
    print_status 1 "jq is not installed (needed for Cognito sync script)"
    echo "  To install: brew install jq"
fi

echo ""
echo "=================================="
echo ""

# Offer to install missing dependencies
echo "Do you want to install missing dependencies? (y/n)"
read -r response

if [[ "$response" == "y" || "$response" == "Y" ]]; then
    echo ""
    echo "Installing missing dependencies..."
    
    # Install Node.js if missing
    if ! command_exists node; then
        echo "Installing Node.js..."
        brew install node
    fi
    
    # Install .NET SDK if missing
    if ! command_exists dotnet; then
        echo "Installing .NET SDK..."
        brew install --cask dotnet-sdk
    fi
    
    # Install Docker if missing
    if ! command_exists docker; then
        echo ""
        echo "⚠️  Docker Desktop must be installed manually."
        echo ""
        echo "Please choose one of these options:"
        echo "1. Download from: https://www.docker.com/products/docker-desktop/"
        echo "2. Install via Homebrew: brew install --cask docker"
        echo ""
        echo "After installing Docker Desktop:"
        echo "1. Open Docker Desktop from Applications"
        echo "2. Complete the setup wizard"
        echo "3. Ensure Docker is running (you'll see the whale icon in the menu bar)"
        echo ""
    fi
    
    # Install PostgreSQL client if missing (optional)
    if ! command_exists psql; then
        echo "Do you want to install PostgreSQL client tools? (y/n)"
        read -r psql_response
        if [[ "$psql_response" == "y" || "$psql_response" == "Y" ]]; then
            brew install postgresql
        fi
    fi

    # Install jq if missing
    if ! command_exists jq; then
        echo "Installing jq (required for Cognito sync script)..."
        brew install jq
    fi
    
    echo ""
    echo "Installation complete!"
fi

echo ""
echo "=================================="
echo "Next Steps:"
echo "=================================="
echo ""

if ! command_exists docker; then
    echo "1. Install Docker Desktop (required)"
    echo "   brew install --cask docker"
    echo "   Then open Docker Desktop from Applications"
    echo ""
fi

echo "2. Set up the project:"
echo "   npm install"
echo "   cd backend && dotnet restore && cd .."
echo ""

echo "3. Copy and configure environment variables:"
echo "   cp .env.example .env"
echo "   # Edit .env with your settings"
echo ""

echo "4. Start the development environment:"
echo "   docker compose up -d  # Note: 'docker compose' not 'docker-compose'"
echo ""

echo "5. Verify services are running:"
echo "   docker compose ps"
echo ""

echo "6. Start the development servers:"
echo "   # Terminal 1: Backend"
echo "   cd backend && dotnet watch run --project Qivr.Api"
echo ""
echo "   # Terminal 2: Widget"
echo "   npm run widget:dev"
echo ""
echo "Optional: sync Cognito users into Postgres (after creating users in Cognito)"
echo "   ./scripts/sync-dev-users.sh"
echo "   # Set CLINIC_DOCTOR_SUB / PATIENT_SUB env vars to override subs"
echo ""

if command_exists dotnet; then
    echo ""
    echo "Would you like to run the Cognito user sync now? (y/n)"
    read -r sync_response
    if [[ "$sync_response" == "y" || "$sync_response" == "Y" ]]; then
        if [ -z "${CLINIC_DOCTOR_SUB:-}" ] || [ -z "${PATIENT_SUB:-}" ]; then
            echo "⚠️  Set CLINIC_DOCTOR_SUB and PATIENT_SUB environment variables before running the sync for accurate Cognito linkage." >&2
        fi
        ./scripts/sync-dev-users.sh || true
    fi
fi

echo "=================================="
echo "Service URLs (when running):"
echo "=================================="
echo "• API/Swagger: http://localhost:5000"
echo "• Widget Dev: http://localhost:3000"
echo "• pgAdmin: http://localhost:8081"
echo "• MinIO Console: http://localhost:9001"
echo "• Mailhog: http://localhost:8025"
echo "• Jaeger Tracing: http://localhost:16686"
echo ""
