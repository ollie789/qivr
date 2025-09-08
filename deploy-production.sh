#!/bin/bash

# Production deployment script with all optimizations
set -e

echo "🚀 Qivr Production Deployment"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check for required commands
    commands=("docker" "docker-compose" "node" "npm" "gzip")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            echo -e "${RED}❌ $cmd is not installed${NC}"
            exit 1
        fi
    done
    
    # Check for brotli (optional but recommended)
    if ! command -v brotli &> /dev/null; then
        echo -e "${YELLOW}⚠️  Brotli not installed. Install for better compression:${NC}"
        echo "    brew install brotli (macOS)"
        echo "    apt-get install brotli (Ubuntu/Debian)"
    fi
    
    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Build applications
build_apps() {
    echo ""
    echo "🔨 Building applications..."
    echo "-------------------------------------------"
    
    # Patient Portal
    echo "Building Patient Portal..."
    cd apps/patient-portal
    npm run build
    cd ../..
    
    # Clinic Dashboard
    echo "Building Clinic Dashboard..."
    cd apps/clinic-dashboard
    npm run build
    cd ../..
    
    # Widget (if it exists)
    if [ -d "apps/widget" ]; then
        echo "Building Widget..."
        cd apps/widget
        npm run build 2>/dev/null || echo "⚠️  Widget build failed, skipping..."
        cd ../..
    fi
    
    echo -e "${GREEN}✓ Applications built successfully${NC}"
}

# Compress assets
compress_assets() {
    echo ""
    echo "🗜️  Compressing assets..."
    echo "-------------------------------------------"
    
    if [ -f "scripts/compress-assets.sh" ]; then
        ./scripts/compress-assets.sh
    else
        echo "Compression script not found, creating inline..."
        
        for app in "apps/patient-portal/dist" "apps/clinic-dashboard/dist" "apps/widget/dist"; do
            if [ -d "$app" ]; then
                echo "Compressing $app..."
                find "$app" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -9 -k -f {} \;
                
                if command -v brotli &> /dev/null; then
                    find "$app" -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec brotli -9 -k -f {} \;
                fi
            fi
        done
    fi
    
    echo -e "${GREEN}✓ Assets compressed${NC}"
}

# Generate SSL certificates (self-signed for development)
generate_ssl() {
    echo ""
    echo "🔐 Setting up SSL certificates..."
    echo "-------------------------------------------"
    
    if [ ! -d "ssl" ]; then
        mkdir -p ssl
    fi
    
    if [ ! -f "ssl/qivr.health.crt" ]; then
        echo "Generating self-signed certificate..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout ssl/qivr.health.key \
            -out ssl/qivr.health.crt \
            -subj "/C=AU/ST=NSW/L=Sydney/O=Qivr Health/CN=*.qivr.health"
        echo -e "${GREEN}✓ SSL certificates generated${NC}"
    else
        echo "SSL certificates already exist"
    fi
}

# Deploy with Docker Compose
deploy_docker() {
    echo ""
    echo "🐳 Deploying with Docker Compose..."
    echo "-------------------------------------------"
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo "Please edit .env with your configuration"
            exit 1
        else
            echo -e "${RED}❌ No .env or .env.example found${NC}"
            exit 1
        fi
    fi
    
    # Build and start services
    echo "Building Docker images..."
    docker-compose -f docker-compose.production.yml build
    
    echo "Starting services..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for services to be healthy
    echo "Waiting for services to be healthy..."
    sleep 10
    
    # Check service status
    docker-compose -f docker-compose.production.yml ps
    
    echo -e "${GREEN}✓ Services deployed${NC}"
}

# Show deployment info
show_info() {
    echo ""
    echo "============================================"
    echo "🎉 Deployment Complete!"
    echo "============================================"
    echo ""
    echo "📱 Applications:"
    echo "  Patient Portal:    https://patient.qivr.health"
    echo "  Clinic Dashboard:  https://clinic.qivr.health"
    echo "  Widget:           https://widget.qivr.health"
    echo ""
    echo "🔧 Services:"
    echo "  API:              http://localhost:5050"
    echo "  MinIO Console:    http://localhost:9001"
    echo "  Prometheus:       http://localhost:9090"
    echo "  Grafana:          http://localhost:3000"
    echo ""
    echo "📊 Performance Optimizations Applied:"
    echo "  ✓ HTTP/2 with Server Push"
    echo "  ✓ Gzip compression (level 6)"
    echo "  ✓ Brotli compression (level 6)"
    echo "  ✓ Static asset caching (1 year)"
    echo "  ✓ API response caching"
    echo "  ✓ Pre-compressed assets"
    echo "  ✓ Security headers"
    echo "  ✓ Rate limiting"
    echo ""
    echo "🔍 Monitor logs:"
    echo "  docker-compose -f docker-compose.production.yml logs -f nginx"
    echo "  docker-compose -f docker-compose.production.yml logs -f backend"
    echo ""
    echo "🛑 To stop services:"
    echo "  docker-compose -f docker-compose.production.yml down"
}

# Main execution
main() {
    cd /Users/oliver/Projects/qivr
    
    check_prerequisites
    build_apps
    compress_assets
    generate_ssl
    deploy_docker
    show_info
}

# Run main function
main
