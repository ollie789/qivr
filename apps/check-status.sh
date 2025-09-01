#!/bin/bash
set -e

# Health check for API
if ! curl -sf http://localhost:5001/health > /dev/null 2>&1; then
  echo "❌ API health check failed"
  exit 1
fi
echo "✅ API health check passed"

# Intake smoke test with complete valid JSON that passes FluentValidation
TMP=$(mktemp)
cat > $TMP <<'EOF'
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Smith",
    "dateOfBirth": "1985-05-15",
    "gender": "male"
  },
  "contactInfo": {
    "email": "john.smith@test.com",
    "phone": "0412345678",
    "address": "123 Test Street",
    "city": "Sydney",
    "state": "NSW",
    "postcode": "2000"
  },
  "chiefComplaint": "Lower back pain affecting daily activities",
  "symptoms": ["Back Pain", "Stiffness", "Reduced mobility"],
  "painLevel": 7,
  "duration": "2 weeks",
  "painPoints": [
    {
      "bodyPart": "Lower Back",
      "intensity": 7,
      "type": "aching",
      "position": {
        "x": 0.5,
        "y": 0.3,
        "z": 0
      }
    }
  ],
  "questionnaireResponses": {
    "onsetType": "gradual",
    "aggravatingFactors": ["sitting", "bending"],
    "relievingFactors": ["rest", "heat"]
  },
  "medicalHistory": {
    "conditions": "Hypertension",
    "medications": "Lisinopril 10mg daily",
    "allergies": "None known",
    "previousTreatments": "Physical therapy 2 years ago"
  },
  "consent": {
    "consentToTreatment": true,
    "consentToPrivacy": true,
    "consentToMarketing": false
  }
}
EOF

RESPONSE=$(curl -sf -X POST http://localhost:5001/api/v1/intake/submit \
  -H "Content-Type: application/json" \
  -H "X-Clinic-Id: 00000000-0000-0000-0000-000000000001" \
  --data-binary @$TMP 2>&1)

if [ $? -ne 0 ]; then
  echo "❌ Intake submission failed"
  echo "Response: $RESPONSE"
  rm -f $TMP
  exit 1
fi

echo "✅ Intake submission passed"
rm -f $TMP

# Validate response contains required fields
if echo "$RESPONSE" | grep -q '"intakeId"' && echo "$RESPONSE" | grep -q '"evaluationId"'; then
  echo "✅ Response validation passed"
else
  echo "❌ Response validation failed"
  echo "Response: $RESPONSE"
  exit 1
fi

echo "✅ All smoke tests passed successfully!"
