#!/bin/bash

# Test script for the admin GUI

echo "🚀 Testing QIVR Admin Dashboard..."
echo ""
echo "The admin dashboard will be accessible at:"
echo "  http://localhost:5001/admin.html"
echo ""
echo "Available test credentials (development mode):"
echo "  - Any email/password combination will work in dev mode"
echo ""
echo "To get a SuperAdmin token for testing the admin API:"
echo ""
echo "curl -X POST http://localhost:5001/api/auth/dev-token \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"email\":\"admin@qivr.health\",\"role\":\"SuperAdmin\",\"tenantId\":\"11111111-1111-1111-1111-111111111111\"}'"
echo ""
echo "Press Ctrl+C to stop the backend when done testing."
echo ""

# Start the backend
cd /Users/oliver/Projects/qivr/backend/Qivr.Api
dotnet run --urls=http://localhost:5001
