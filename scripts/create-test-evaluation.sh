#!/bin/bash

# Login and get cookies
echo "Logging in..."
COOKIES=$(mktemp)
curl -s -c $COOKIES -X POST https://clinic.qivr.pro/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1762923257212@example.com",
    "password": "TestPass123!"
  }')

# Get first patient ID
echo "Getting patient..."
PATIENT_ID=$(curl -s -b $COOKIES https://clinic.qivr.pro/api/patients | jq -r '.data[0].id')

if [ "$PATIENT_ID" = "null" ] || [ -z "$PATIENT_ID" ]; then
  echo "No patients found. Creating one..."
  # Create a patient first if none exist
  PATIENT_RESPONSE=$(curl -s -b $COOKIES -X POST https://clinic.qivr.pro/api/patients \
    -H "Content-Type: application/json" \
    -d '{
      "firstName": "Test",
      "lastName": "Patient",
      "email": "testpatient'$(date +%s)'@example.com",
      "phone": "555-0100",
      "dateOfBirth": "1990-01-01"
    }')
  PATIENT_ID=$(echo $PATIENT_RESPONSE | jq -r '.id')
fi

echo "Using patient ID: $PATIENT_ID"

# Create evaluation
echo "Creating evaluation..."
curl -s -b $COOKIES -X POST https://clinic.qivr.pro/api/evaluations \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "'$PATIENT_ID'",
    "chiefComplaint": "Lower back pain",
    "symptoms": ["Back pain", "Stiffness", "Limited mobility"],
    "questionnaireResponses": {},
    "painMaps": [{
      "bodyRegion": "Lower Back",
      "coordinates": {"x": 0.5, "y": 0.6, "z": 0},
      "intensity": 7,
      "type": "Sharp",
      "qualities": ["Constant", "Radiating"]
    }]
  }' | jq '.'

rm $COOKIES
echo "Done!"
