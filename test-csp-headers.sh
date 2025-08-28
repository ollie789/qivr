#!/bin/bash
# Test CSP headers on the API

API_URL="${1:-http://localhost:5000}"
echo "Testing CSP headers on $API_URL"
echo ""

# Test widget endpoint
echo "Testing widget endpoint CSP:"
curl -s -I "$API_URL/api/widget/test" 2>/dev/null | grep -i "content-security-policy\|x-frame-options" || echo "No widget endpoint or no CSP headers"
echo ""

# Test regular API endpoint  
echo "Testing API endpoint CSP:"
curl -s -I "$API_URL/api/v1/health" 2>/dev/null | grep -i "content-security-policy\|x-frame-options" || echo "No API endpoint or no CSP headers"
echo ""

# Test with specific clinic header
echo "Testing with X-Clinic-Id header:"
curl -s -I -H "X-Clinic-Id: test-clinic-123" "$API_URL/api/v1/intake/submit" 2>/dev/null | grep -i "content-security-policy\|x-frame-options" || echo "No intake endpoint or no CSP headers"
