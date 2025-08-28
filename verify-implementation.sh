#!/bin/bash

# Qivr Implementation Verification Script
# Tests: Database migrations, API endpoints, services, and configurations

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:5000}"
DB_NAME="${DB_NAME:-qivr}"
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-postgres}"
TENANT_ID="00000000-0000-0000-0000-000000000001"

echo "================================================"
echo "Qivr Implementation Verification Suite"
echo "================================================"
echo ""

# Function to check command results
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        return 1
    fi
}

# Function to print section headers
print_section() {
    echo ""
    echo -e "${YELLOW}$1${NC}"
    echo "------------------------------------------------"
}

# 1. Verify Project Structure
print_section "1. PROJECT STRUCTURE VERIFICATION"

echo "Checking for implemented files..."
FILES_TO_CHECK=(
    "backend/Qivr.Api/Controllers/MessageMediaWebhookController.cs"
    "backend/Qivr.Api/Services/QuietHoursService.cs"
    "backend/Qivr.Api/Services/NotificationGate.cs"
    "backend/Qivr.Api/Services/DbAuditLogger.cs"
    "backend/Qivr.Api/Utilities/PhoneUtil.cs"
    "backend/Qivr.Api/Contracts/MessageMediaWebhook.cs"
    "backend/Qivr.Api/Options/NotificationsOptions.cs"
    "backend/Qivr.Infrastructure/Migrations/011_sms_consent_and_phone_index.sql"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} Found: $file"
    else
        echo -e "${RED}✗${NC} Missing: $file"
    fi
done

# 2. Database Migration Verification
print_section "2. DATABASE MIGRATION VERIFICATION"

# Create SQL verification script
cat > /tmp/verify_db.sql << 'EOF'
-- Check if audit_logs table exists
SELECT 'audit_logs table' as checking,
       CASE WHEN to_regclass('qivr.audit_logs') IS NOT NULL 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- Check if consent_sms column exists
SELECT 'consent_sms column' as checking,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'qivr' 
           AND table_name = 'users' 
           AND column_name = 'consent_sms'
       ) THEN 'EXISTS' 
         ELSE 'MISSING' 
       END as status;

-- Check phone_e164 index
SELECT 'phone_e164 index' as checking,
       CASE WHEN EXISTS (
           SELECT 1 FROM pg_indexes 
           WHERE schemaname = 'qivr' 
           AND tablename = 'users' 
           AND indexname = 'idx_users_phone_e164'
       ) THEN 'EXISTS' 
         ELSE 'MISSING' 
       END as status;

-- Check RLS policies
SELECT 'RLS on audit_logs' as checking,
       CASE WHEN rowsecurity 
            THEN 'ENABLED' 
            ELSE 'DISABLED' 
       END as status
FROM pg_tables 
WHERE schemaname = 'qivr' AND tablename = 'audit_logs';

-- List RLS policies on audit_logs
SELECT pol.polname as policy_name,
       CASE pol.polcmd 
           WHEN 'r' THEN 'SELECT'
           WHEN 'a' THEN 'INSERT'
           WHEN 'w' THEN 'UPDATE'
           WHEN 'd' THEN 'DELETE'
           ELSE 'OTHER'
       END as operation
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_namespace pn ON pc.relnamespace = pn.oid
WHERE pn.nspname = 'qivr' AND pc.relname = 'audit_logs';
EOF

echo "Checking database schema (requires database connection)..."
echo "Run this command to verify database:"
echo -e "${YELLOW}psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f /tmp/verify_db.sql${NC}"

# 3. API Configuration Verification
print_section "3. CONFIGURATION VERIFICATION"

echo "Checking appsettings.Sample.json..."
if grep -q "Notifications" backend/Qivr.Api/appsettings.Sample.json 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Notifications configuration found"
    grep -A 4 '"Notifications"' backend/Qivr.Api/appsettings.Sample.json | sed 's/^/  /'
else
    echo -e "${RED}✗${NC} Notifications configuration missing"
fi

if grep -q "MessageMedia" backend/Qivr.Api/appsettings.Sample.json 2>/dev/null; then
    echo -e "${GREEN}✓${NC} MessageMedia configuration found"
    grep -A 3 '"MessageMedia"' backend/Qivr.Api/appsettings.Sample.json | sed 's/^/  /'
else
    echo -e "${RED}✗${NC} MessageMedia configuration missing"
fi

# 4. Service Registration Verification
print_section "4. SERVICE REGISTRATION VERIFICATION"

echo "Checking Program.cs for service registrations..."
SERVICES_TO_CHECK=(
    "NotificationsOptions"
    "DbAuditLogger"
    "QuietHoursService" 
    "NotificationGate"
)

for service in "${SERVICES_TO_CHECK[@]}"; do
    if grep -q "$service" backend/Qivr.Api/Program.cs 2>/dev/null; then
        echo -e "${GREEN}✓${NC} $service registered"
    else
        echo -e "${RED}✗${NC} $service not found in Program.cs"
    fi
done

# 5. Create API Test Scripts
print_section "5. API ENDPOINT TEST SCRIPTS"

# Create test script for STOP message
cat > /tmp/test_stop.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:5000/api/webhooks/messagemedia/inbound \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "messageId": "test-stop-123",
    "callback_url": "https://api.messagemedia.com/v1/replies/test-123",
    "content": "STOP",
    "source_number": "+61412345678",
    "destination_number": "+61498765432",
    "date_received": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "format": "SMS",
    "metadata": {}
  }' \
  -w "\nHTTP Status: %{http_code}\n"
EOF

# Create test script for START message
cat > /tmp/test_start.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:5000/api/webhooks/messagemedia/inbound \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "messageId": "test-start-456",
    "callback_url": "https://api.messagemedia.com/v1/replies/test-456",
    "content": "START",
    "source_number": "+61412345678",
    "destination_number": "+61498765432",
    "date_received": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "format": "SMS",
    "metadata": {}
  }' \
  -w "\nHTTP Status: %{http_code}\n"
EOF

# Create test script for delivery report
cat > /tmp/test_delivery.sh << 'EOF'
#!/bin/bash
curl -X POST http://localhost:5000/api/webhooks/messagemedia/delivery \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: 00000000-0000-0000-0000-000000000001" \
  -d '{
    "messageId": "test-delivery-789",
    "source_number": "+61498765432",
    "destination_number": "+61412345678",
    "status": "delivered",
    "date_delivered": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
    "metadata": {
      "userId": "550e8400-e29b-41d4-a716-446655440000"
    }
  }' \
  -w "\nHTTP Status: %{http_code}\n"
EOF

chmod +x /tmp/test_*.sh

echo "API test scripts created:"
echo "  - /tmp/test_stop.sh    - Test STOP message handling"
echo "  - /tmp/test_start.sh   - Test START message handling"  
echo "  - /tmp/test_delivery.sh - Test delivery report handling"

# 6. CSP Header Verification
print_section "6. SECURITY HEADER VERIFICATION"

echo "Testing Content-Security-Policy headers..."
echo "Run when API is running:"
echo -e "${YELLOW}curl -s -D - $API_BASE_URL -o /dev/null | grep -i 'frame-ancestors'${NC}"

# 7. Create Unit Test Verification
print_section "7. UNIT TEST SUGGESTIONS"

cat > /tmp/create_tests.md << 'EOF'
# Unit Tests to Create

## PhoneUtil Tests
```csharp
[Test]
public void NormalizeToE164_ShouldHandleAustralianMobiles()
{
    Assert.AreEqual("+61412345678", PhoneUtil.NormalizeToE164("0412345678"));
    Assert.AreEqual("+61412345678", PhoneUtil.NormalizeToE164("0412 345 678"));
    Assert.AreEqual("+61412345678", PhoneUtil.NormalizeToE164("+61412345678"));
}

[Test]
public void IsStopMessage_ShouldDetectVariations()
{
    Assert.IsTrue(PhoneUtil.IsStopMessage("STOP"));
    Assert.IsTrue(PhoneUtil.IsStopMessage("stop"));
    Assert.IsTrue(PhoneUtil.IsStopMessage("Stop all"));
    Assert.IsTrue(PhoneUtil.IsStopMessage("UNSUBSCRIBE"));
    Assert.IsFalse(PhoneUtil.IsStopMessage("Please stop"));
}
```

## QuietHoursService Tests
```csharp
[Test]
public void IsWithinBusinessHours_ShouldRespectTimezone()
{
    var options = new NotificationsOptions 
    { 
        BusinessHoursStartLocal = 9,
        BusinessHoursEndLocal = 18,
        DefaultTimeZone = "Australia/Sydney"
    };
    
    var service = new QuietHoursService(options, logger);
    
    // Test at 10am Sydney time
    var morningTime = new DateTime(2024, 1, 15, 10, 0, 0, DateTimeKind.Utc);
    Assert.IsTrue(service.IsWithinBusinessHours(null, morningTime));
    
    // Test at 10pm Sydney time  
    var nightTime = new DateTime(2024, 1, 15, 22, 0, 0, DateTimeKind.Utc);
    Assert.IsFalse(service.IsWithinBusinessHours(null, nightTime));
}
```

## NotificationGate Tests
```csharp
[Test]
public void CanSendSms_ShouldCheckAllConditions()
{
    var user = new User 
    { 
        Id = Guid.NewGuid(),
        Phone = "+61412345678",
        ConsentSms = true
    };
    
    // Mock quiet hours to return true (within hours)
    quietHoursMock.Setup(x => x.IsWithinBusinessHours(It.IsAny<Clinic>(), null))
                  .Returns(true);
    
    var gate = new NotificationGate(quietHoursMock.Object, logger);
    
    var result = gate.CanSendSms(user, null);
    Assert.IsTrue(result.CanSend);
    Assert.IsNull(result.BlockedReason);
}
```
EOF

echo "Unit test examples created at: /tmp/create_tests.md"

# 8. Create Integration Test Script
print_section "8. INTEGRATION TEST SCRIPT"

cat > /tmp/integration_test.sh << 'EOF'
#!/bin/bash

# Integration test for the full flow
set -e

API_URL="http://localhost:5000"
TENANT_ID="00000000-0000-0000-0000-000000000001"
TEST_PHONE="+61412345678"

echo "=== Integration Test: SMS Consent Flow ==="

# Step 1: Send STOP message
echo "1. Sending STOP message..."
STOP_RESPONSE=$(curl -s -X POST $API_URL/api/webhooks/messagemedia/inbound \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -d "{
    \"messageId\": \"int-test-stop-$(date +%s)\",
    \"content\": \"STOP\",
    \"source_number\": \"$TEST_PHONE\",
    \"destination_number\": \"+61498765432\",
    \"date_received\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"format\": \"SMS\"
  }" \
  -w "\nStatus: %{http_code}")

echo "$STOP_RESPONSE"

# Step 2: Verify audit log was created (requires DB access)
echo ""
echo "2. Check audit log (requires DB connection):"
echo "psql -c \"SELECT * FROM qivr.audit_logs WHERE event_type = 'CONSENT_SMS_OPTED_OUT' ORDER BY created_at DESC LIMIT 1;\""

# Step 3: Send START message
echo ""
echo "3. Sending START message..."
START_RESPONSE=$(curl -s -X POST $API_URL/api/webhooks/messagemedia/inbound \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -d "{
    \"messageId\": \"int-test-start-$(date +%s)\",
    \"content\": \"START\",
    \"source_number\": \"$TEST_PHONE\",
    \"destination_number\": \"+61498765432\",
    \"date_received\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"format\": \"SMS\"
  }" \
  -w "\nStatus: %{http_code}")

echo "$START_RESPONSE"

# Step 4: Test delivery report
echo ""
echo "4. Sending delivery report..."
DELIVERY_RESPONSE=$(curl -s -X POST $API_URL/api/webhooks/messagemedia/delivery \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $TENANT_ID" \
  -d "{
    \"messageId\": \"int-test-delivery-$(date +%s)\",
    \"source_number\": \"+61498765432\",
    \"destination_number\": \"$TEST_PHONE\",
    \"status\": \"delivered\",
    \"date_delivered\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }" \
  -w "\nStatus: %{http_code}")

echo "$DELIVERY_RESPONSE"

echo ""
echo "=== Integration Test Complete ==="
EOF

chmod +x /tmp/integration_test.sh

echo "Integration test script created at: /tmp/integration_test.sh"

# Summary
print_section "VERIFICATION SUMMARY"

echo ""
echo "Verification suite has been created. To run the full verification:"
echo ""
echo "1. Start your API server:"
echo -e "   ${YELLOW}cd backend && dotnet run --project Qivr.Api${NC}"
echo ""
echo "2. Run database migration:"
echo -e "   ${YELLOW}psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f backend/Qivr.Infrastructure/Migrations/011_sms_consent_and_phone_index.sql${NC}"
echo ""
echo "3. Verify database schema:"
echo -e "   ${YELLOW}psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f /tmp/verify_db.sql${NC}"
echo ""
echo "4. Test individual endpoints:"
echo -e "   ${YELLOW}/tmp/test_stop.sh${NC}    - Test STOP handling"
echo -e "   ${YELLOW}/tmp/test_start.sh${NC}   - Test START handling"
echo -e "   ${YELLOW}/tmp/test_delivery.sh${NC} - Test delivery reports"
echo ""
echo "5. Run full integration test:"
echo -e "   ${YELLOW}/tmp/integration_test.sh${NC}"
echo ""
echo "6. Check CSP headers:"
echo -e "   ${YELLOW}curl -s -D - http://localhost:5000 -o /dev/null | grep -i frame-ancestors${NC}"
echo ""
echo "Test files are available in /tmp/ directory."
echo "================================================"
