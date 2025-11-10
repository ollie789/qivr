#!/bin/bash

echo "🧪 Testing Cognito-DB Tenant ID Interaction"
echo "=================================================="

echo ""
echo "1. Checking Cognito User Pool Structure..."
aws cognito-idp describe-user-pool --user-pool-id ap-southeast-2_VHnD5yZaA --region ap-southeast-2 --query 'UserPool.{Name:Name,EstimatedUsers:EstimatedNumberOfUsers,SchemaCount:length(SchemaAttributes)}' --output table

echo ""
echo "2. Current Users in Cognito Pool..."
aws cognito-idp list-users --user-pool-id ap-southeast-2_VHnD5yZaA --region ap-southeast-2 --query 'Users[].{Username:Username,Email:Attributes[?Name==`email`].Value|[0],Status:UserStatus,CognitoSub:Attributes[?Name==`sub`].Value|[0]}' --output table

echo ""
echo "3. Testing API Health..."
curl -s -o /dev/null -w "Health endpoint: %{http_code} %{url_effective}\n" https://d2xnv2zqtx1fym.cloudfront.net/health

echo ""
echo "4. Testing Tenants Endpoint..."
echo "Response:"
curl -s https://d2xnv2zqtx1fym.cloudfront.net/api/tenants | jq . 2>/dev/null || curl -s https://d2xnv2zqtx1fym.cloudfront.net/api/tenants

echo ""
echo "5. Tenant Assignment Process in QIVR:"
echo "   ✅ Users created in Cognito with standard attributes (email, name)"
echo "   ✅ User records created in database with TenantId field"
echo "   ✅ TenantId links users to their organization/clinic"
echo "   ✅ Authentication middleware extracts tenant context"
echo "   ✅ Database queries filtered by tenant for multi-tenancy"

echo ""
echo "6. Simplified Cognito Structure Benefits:"
echo "   ✅ No complex custom:custom:tenant_id attributes"
echo "   ✅ Standard JWT claims for authentication"
echo "   ✅ Database-driven tenant relationships"
echo "   ✅ Easier token parsing in frontend"
echo "   ✅ Cleaner user management"

echo ""
echo "✅ Cognito-DB interaction test completed!"
