#!/bin/bash

# Quick signup test for production API

API_URL="https://clinic.qivr.pro/api"
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@clinic.test"
PASSWORD="TestPass123!"

echo "🧪 Testing Signup"
echo "Email: $EMAIL"
echo ""

curl -v -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${EMAIL}\",
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"clinicName\": \"Test Clinic ${TIMESTAMP}\",
    \"firstName\": \"Test\",
    \"lastName\": \"Doctor\",
    \"phone\": \"+61400000000\"
  }"
