#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
API_BASE="http://localhost:5050"
REGION="ap-southeast-2"
POOL_ID="ap-southeast-2_b48ZBE35F"
CLIENT_ID="3u1j21aero8u8c7a4gh52g9qhb"
CLIENT_SECRET="1sfitrb0486vqg0gqve60q7neqnhkkrfkulkkptnvfkgv1v74amm"

# Counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test results array
declare -a TEST_RESULTS

echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     COMPREHENSIVE QIVR API & PAGE TESTING SUITE               ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_code=$4
    local body=$5
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    local RESPONSE
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $ID_TOKEN" \
            -H "X-Tenant-Id: $TENANT_ID" \
            "$API_BASE$endpoint")
    elif [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            -X "$method" \
            -H "Authorization: Bearer $ID_TOKEN" \
            -H "X-Tenant-Id: $TENANT_ID" \
            -H "Content-Type: application/json" \
            -d "$body" \
            "$API_BASE$endpoint")
    elif [ "$method" = "DELETE" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" \
            -X "DELETE" \
            -H "Authorization: Bearer $ID_TOKEN" \
            -H "X-Tenant-Id: $TENANT_ID" \
            "$API_BASE$endpoint")
    fi
    
    local HTTP_CODE=$(printf '%s' "$RESPONSE" | awk 'END{print $0}')
    local RESPONSE_BODY=$(printf '%s' "$RESPONSE" | sed '$d')
    
    if [[ "$HTTP_CODE" == "$expected_code"* ]]; then
        echo -e "  ${GREEN}✓${NC} $method $endpoint - $description (${HTTP_CODE})"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("✓ $method $endpoint - $description")
    else
        echo -e "  ${RED}✗${NC} $method $endpoint - $description (Expected: $expected_code, Got: $HTTP_CODE)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("✗ $method $endpoint - $description (Expected: $expected_code, Got: $HTTP_CODE)")
        if [ -n "$RESPONSE_BODY" ]; then
            local pretty_body
            pretty_body=$(printf '%s' "$RESPONSE_BODY" | jq -c '.' 2>/dev/null)
            if [ -n "$pretty_body" ]; then
                echo "     Response: $pretty_body"
            else
                echo "     Response: $(printf '%s' "$RESPONSE_BODY" | head -c 200)"
            fi
        fi
    fi
}

# Step 1: Authenticate
echo -e "${YELLOW}═══ AUTHENTICATION ═══${NC}"
echo ""

SECRET_HASH=$(echo -n "doctor@test.com${CLIENT_ID}" | openssl dgst -sha256 -hmac "${CLIENT_SECRET}" -binary | base64)

AUTH_RESPONSE=$(aws cognito-idp initiate-auth \
    --region "$REGION" \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id "$CLIENT_ID" \
    --auth-parameters USERNAME="doctor@test.com",PASSWORD="TestPass123!",SECRET_HASH="$SECRET_HASH" \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    ACCESS_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.AccessToken')
    ID_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.IdToken')
    REFRESH_TOKEN=$(echo "$AUTH_RESPONSE" | jq -r '.AuthenticationResult.RefreshToken')
    echo -e "${GREEN}✓ Authentication successful${NC}"
    
    # Extract tenant_id from token
    PAYLOAD=$(echo "$ID_TOKEN" | cut -d'.' -f2 | base64 -d 2>/dev/null || echo "$ID_TOKEN" | cut -d'.' -f2 | base64 -D)
    TENANT_ID=$(echo "$PAYLOAD" | jq -r '.["custom:tenant_id"]')
    USER_ID=$(echo "$PAYLOAD" | jq -r '.sub')
    echo -e "${GREEN}✓ Tenant ID: $TENANT_ID${NC}"
    echo -e "${GREEN}✓ User ID: $USER_ID${NC}"
else
    echo -e "${RED}✗ Authentication failed${NC}"
    echo "$AUTH_RESPONSE"
    exit 1
fi

echo ""
echo -e "${YELLOW}═══ CORE AUTHENTICATION & TENANT ENDPOINTS ═══${NC}"
echo ""

test_endpoint "GET" "/api/auth/debug" "Auth Debug Info" "200"
test_endpoint "GET" "/api/tenants" "List User Tenants" "200"
test_endpoint "GET" "/api/tenants/$TENANT_ID" "Get Specific Tenant" "200"
test_endpoint "GET" "/api/profile" "Get User Profile" "200"
test_endpoint "POST" "/api/auth/refresh-token" "Refresh Token" "200" '{"refreshToken":"'$REFRESH_TOKEN'"}'

echo ""
echo -e "${YELLOW}═══ CLINIC DASHBOARD ENDPOINTS ═══${NC}"
echo ""

test_endpoint "GET" "/api/clinic-dashboard/overview" "Dashboard Overview" "200"
test_endpoint "GET" "/api/clinic-dashboard/schedule/weekly" "Weekly Schedule" "200"
test_endpoint "GET" "/api/clinic-dashboard/metrics" "Dashboard Metrics" "200"

echo ""
echo -e "${YELLOW}═══ PATIENT DASHBOARD ENDPOINTS ═══${NC}"
echo ""

test_endpoint "GET" "/api/patient-dashboard/overview" "Patient Dashboard Overview" "200"
test_endpoint "GET" "/api/patient-dashboard/appointments/history" "Patient Appointment History" "200"
test_endpoint "GET" "/api/patient-dashboard/health-summary" "Patient Health Summary" "200"

echo ""
echo -e "${YELLOW}═══ APPOINTMENT MANAGEMENT ═══${NC}"
echo ""

test_endpoint "GET" "/api/appointments" "List Appointments" "200"
test_endpoint "GET" "/api/appointments/available-slots" "Available Slots" "200"
test_endpoint "POST" "/api/appointments" "Create Appointment" "400" '{
    "patientId": "'$USER_ID'",
    "providerId": "'$USER_ID'",
    "appointmentType": "Consultation",
    "startTime": "2024-12-01T10:00:00Z",
    "endTime": "2024-12-01T11:00:00Z",
    "status": "Scheduled"
}'
test_endpoint "GET" "/api/appointments/calendar" "Calendar View" "200"
test_endpoint "GET" "/api/appointments/waitlist" "Waitlist" "200"

echo ""
echo -e "${YELLOW}═══ PATIENT MANAGEMENT ═══${NC}"
echo ""

test_endpoint "GET" "/api/patients" "List Patients" "200"
test_endpoint "GET" "/api/patients/search?q=test" "Search Patients" "200"
test_endpoint "GET" "/api/patients/$USER_ID" "Get Patient Details" "200"
test_endpoint "GET" "/api/patients/$USER_ID/appointments" "Patient Appointments" "200"
test_endpoint "GET" "/api/patients/$USER_ID/documents" "Patient Documents" "200"
test_endpoint "GET" "/api/patients/$USER_ID/medical-history" "Medical History" "200"

echo ""
echo -e "${YELLOW}═══ MEDICAL RECORDS ═══${NC}"
echo ""

test_endpoint "GET" "/api/medical-records" "List Medical Records" "200"
test_endpoint "GET" "/api/medical-records/vitals" "Vital Signs" "200"
test_endpoint "GET" "/api/medical-records/medications" "Medications" "200"
test_endpoint "GET" "/api/medical-records/allergies" "Allergies" "200"
test_endpoint "GET" "/api/medical-records/conditions" "Medical Conditions" "200"
test_endpoint "GET" "/api/medical-records/immunizations" "Immunizations" "200"
test_endpoint "GET" "/api/medical-records/lab-results" "Lab Results" "200"

echo ""
echo -e "${YELLOW}═══ EVALUATIONS & INTAKE ═══${NC}"
echo ""

test_endpoint "GET" "/api/evaluations" "List Evaluations" "200"
test_endpoint "GET" "/api/evaluations/pending" "Pending Evaluations" "200"
test_endpoint "GET" "/api/evaluations/completed" "Completed Evaluations" "200"
test_endpoint "GET" "/api/intake/forms" "Intake Forms" "200"
test_endpoint "GET" "/api/intake/status" "Intake Status" "200"
test_endpoint "POST" "/api/intake/submit" "Submit Intake" "400" '{}'

echo ""
echo -e "${YELLOW}═══ PROMs (Patient Reported Outcome Measures) ═══${NC}"
echo ""

test_endpoint "GET" "/api/proms" "List PROM Templates" "200"
test_endpoint "GET" "/api/proms/active" "Active PROMs" "200"
test_endpoint "GET" "/api/proms/templates" "PROM Templates" "200"
test_endpoint "GET" "/api/prom-instances" "PROM Instances" "200"
test_endpoint "GET" "/api/prom-instances/pending" "Pending PROMs" "200"
test_endpoint "GET" "/api/prom-instances/completed" "Completed PROMs" "200"

echo ""
echo -e "${YELLOW}═══ MESSAGING & NOTIFICATIONS ═══${NC}"
echo ""

test_endpoint "GET" "/api/messages" "List Messages" "200"
test_endpoint "GET" "/api/messages/conversations" "Conversations" "200"
test_endpoint "GET" "/api/messages/unread" "Unread Messages" "200"
test_endpoint "GET" "/api/notifications" "List Notifications" "200"
test_endpoint "GET" "/api/notifications/unread" "Unread Notifications" "200"
test_endpoint "POST" "/api/notifications/mark-read" "Mark Notifications Read" "200" '{"notificationIds":[]}'

echo ""
echo -e "${YELLOW}═══ DOCUMENTS ═══${NC}"
echo ""

test_endpoint "GET" "/api/documents" "List Documents" "200"
test_endpoint "GET" "/api/documents/categories" "Document Categories" "200"
test_endpoint "GET" "/api/documents/recent" "Recent Documents" "200"
test_endpoint "POST" "/api/documents/upload" "Upload Document" "400" '{}'

echo ""
echo -e "${YELLOW}═══ CLINIC MANAGEMENT ═══${NC}"
echo ""

test_endpoint "GET" "/api/clinic-management" "Clinic Info" "200"
test_endpoint "GET" "/api/clinic-management/staff" "Staff List" "200"
test_endpoint "GET" "/api/clinic-management/providers" "Providers List" "200"
test_endpoint "GET" "/api/clinic-management/services" "Services List" "200"
test_endpoint "GET" "/api/clinic-management/locations" "Locations" "200"
test_endpoint "GET" "/api/clinic-management/schedule" "Clinic Schedule" "200"

echo ""
echo -e "${YELLOW}═══ SETTINGS & CONFIGURATION ═══${NC}"
echo ""

test_endpoint "GET" "/api/settings" "User Settings" "200"
test_endpoint "GET" "/api/settings/preferences" "User Preferences" "200"
test_endpoint "GET" "/api/settings/notifications" "Notification Settings" "200"
test_endpoint "GET" "/api/settings/security" "Security Settings" "200"
test_endpoint "PUT" "/api/settings/preferences" "Update Preferences" "200" '{}'

echo ""
echo -e "${YELLOW}═══ ANALYTICS ═══${NC}"
echo ""

test_endpoint "GET" "/api/analytics/overview" "Analytics Overview" "200"
test_endpoint "GET" "/api/analytics/appointments" "Appointment Analytics" "200"
test_endpoint "GET" "/api/analytics/patients" "Patient Analytics" "200"
test_endpoint "GET" "/api/analytics/revenue" "Revenue Analytics" "200"
test_endpoint "GET" "/api/analytics/performance" "Performance Metrics" "200"

echo ""
echo -e "${YELLOW}═══ WEBHOOKS ═══${NC}"
echo ""

test_endpoint "GET" "/api/webhooks" "List Webhooks" "200"
test_endpoint "GET" "/api/webhooks/calendar" "Calendar Webhooks" "200"
test_endpoint "GET" "/api/webhooks/messagemedia" "MessageMedia Webhooks" "200"

echo ""
echo -e "${YELLOW}═══ EMAIL VERIFICATION ═══${NC}"
echo ""

test_endpoint "GET" "/api/email-verification/status" "Email Status" "200"
test_endpoint "POST" "/api/email-verification/resend" "Resend Verification" "400" '{}'

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                      TEST SUMMARY                              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$(echo "scale=2; $PASSED_TESTS * 100 / $TOTAL_TESTS" | bc)
else
    PASS_RATE=0
fi

# Display summary
echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:      ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:      ${RED}$FAILED_TESTS${NC}"
echo -e "Skipped:     ${YELLOW}$SKIPPED_TESTS${NC}"
echo -e "Pass Rate:   ${CYAN}$PASS_RATE%${NC}"
echo ""

# Show failed tests if any
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == *"✗"* ]]; then
            echo "  $result"
        fi
    done
    echo ""
fi

# Performance test
echo -e "${YELLOW}═══ PERFORMANCE TEST ═══${NC}"
echo ""
echo "Testing response times for critical endpoints..."

# Test response time for critical endpoints
for endpoint in "/api/tenants" "/api/appointments" "/api/patients" "/api/clinic-dashboard/stats"; do
    START_TIME=$(date +%s%3N)
    curl -s -H "Authorization: Bearer $ID_TOKEN" -H "X-Tenant-Id: $TENANT_ID" "$API_BASE$endpoint" > /dev/null
    END_TIME=$(date +%s%3N)
    RESPONSE_TIME=$((END_TIME - START_TIME))
    
    if [ $RESPONSE_TIME -lt 200 ]; then
        echo -e "  ${GREEN}✓${NC} $endpoint: ${RESPONSE_TIME}ms"
    elif [ $RESPONSE_TIME -lt 500 ]; then
        echo -e "  ${YELLOW}⚠${NC} $endpoint: ${RESPONSE_TIME}ms"
    else
        echo -e "  ${RED}✗${NC} $endpoint: ${RESPONSE_TIME}ms"
    fi
done

echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                    FRONTEND PAGES TO TEST                      ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo "Please manually test these pages in your browser:"
echo ""
echo -e "${BLUE}Clinic Dashboard (http://localhost:3010):${NC}"
echo "  □ Login Page"
echo "  □ Dashboard Overview"
echo "  □ Appointments Calendar"
echo "  □ Patient List"
echo "  □ Patient Details"
echo "  □ Medical Records"
echo "  □ PROMs Management"
echo "  □ Messages/Conversations"
echo "  □ Documents"
echo "  □ Analytics/Reports"
echo "  □ Settings"
echo ""
echo -e "${BLUE}Patient Portal (http://localhost:3005):${NC}"
echo "  □ Login Page"
echo "  □ Dashboard"
echo "  □ My Appointments"
echo "  □ Book Appointment"
echo "  □ My Documents"
echo "  □ Medical History"
echo "  □ Messages"
echo "  □ PROMs/Questionnaires"
echo "  □ Profile Settings"
echo ""
echo -e "${BLUE}Widget (http://localhost:3003):${NC}"
echo "  □ Booking Widget"
echo "  □ Appointment Selection"
echo "  □ Confirmation"
echo ""

# Save test results to file
echo ""
echo -e "${GREEN}Test results saved to: test-results-$(date +%Y%m%d-%H%M%S).json${NC}"

cat > "test-results-$(date +%Y%m%d-%H%M%S).json" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "summary": {
    "total": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "skipped": $SKIPPED_TESTS,
    "passRate": $PASS_RATE
  },
  "authentication": {
    "poolId": "$POOL_ID",
    "tenantId": "$TENANT_ID",
    "userId": "$USER_ID"
  }
}
EOF

echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                    Testing Complete!                            ${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════════${NC}"
