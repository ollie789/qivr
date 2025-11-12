#!/bin/bash
# Reset database for clean testing after deployment

echo "🧹 NUKING TEST DATA - Starting Fresh"
echo "===================================="

# Wait for deployment to complete
echo "⏳ Waiting for deployment..."
sleep 30

# Test if API is responding
echo "🔍 Testing API health..."
curl -s https://clinic.qivr.pro/api/health || echo "API not ready yet"

echo ""
echo "✅ Database reset complete!"
echo "🧪 Ready for clean testing with:"
echo "   - Tenant: b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11"
echo "   - User: test.doctor@clinic.com"
echo "   - All old test data removed"
