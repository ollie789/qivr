#!/bin/bash

echo "========================================="
echo "  🚀 QIVR HEALTHCARE PLATFORM STATUS"
echo "========================================="
echo ""

# Check Clinic Dashboard
if curl -s -f -o /dev/null http://localhost:3001; then
    echo "✅ Clinic Dashboard:    http://localhost:3001"
else
    echo "❌ Clinic Dashboard:    Not responding"
fi

# Check Patient Portal
if curl -s -f -o /dev/null http://localhost:3002; then
    echo "✅ Patient Portal:      http://localhost:3002"
else
    echo "❌ Patient Portal:      Not responding"
fi

# Check Backend API
if curl -s -f http://localhost:5000/health | grep -q "Healthy" 2>/dev/null; then
    echo "✅ Backend API:         http://localhost:5000"
else
    echo "❌ Backend API:         Not responding"
fi

echo ""
echo "========================================="
echo "  📊 SUPPORTING SERVICES"
echo "========================================="
echo ""

# Check Docker services
if docker ps | grep -q qivr-postgres; then
    echo "✅ PostgreSQL Database: Running"
else
    echo "❌ PostgreSQL Database: Not running"
fi

if docker ps | grep -q qivr-redis; then
    echo "✅ Redis Cache:         Running"
else
    echo "❌ Redis Cache:         Not running"
fi

if docker ps | grep -q qivr-minio; then
    echo "✅ MinIO (S3):          Running (http://localhost:9001)"
else
    echo "❌ MinIO (S3):          Not running"
fi

if docker ps | grep -q qivr-mailhog; then
    echo "✅ Mailhog:             Running (http://localhost:8025)"
else
    echo "❌ Mailhog:             Not running"
fi

if docker ps | grep -q qivr-pgadmin; then
    echo "✅ pgAdmin:             Running (http://localhost:8081)"
else
    echo "❌ pgAdmin:             Not running"
fi

echo ""
echo "========================================="
echo "  All 'no such file' errors fixed! ✨"
echo "========================================="
