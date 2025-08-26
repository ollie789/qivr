# Health check for API
if ! curl -sf http://localhost:5000/health > /dev/null; then
  echo "❌ API health check failed"; exit 1; fi

# Intake smoke test (does not persist due to transaction rollback)
TMP=$(mktemp)
cat > $TMP <<EOF
{"personalInfo":{"firstName":"Smoke","lastName":"Test"},"contactInfo":{"email":"smoke@test.dev"},"chiefComplaint":"pain","symptoms":[],"painLevel":3,"duration":"1d","painPoints":[],"medicalHistory":{},"consent":{"consentToTreatment":true,"consentToPrivacy":true,"consentToMarketing":false}}
EOF
curl -sf -X POST http://localhost:5000/api/v1/intake/submit \
  -H "Content-Type: application/json" \
  -H "X-Clinic-Id: 00000000-0000-0000-0000-000000000001" \
  --data-binary @$TMP > /dev/null || { echo "❌ Intake submission failed"; exit 1; }
rm $TMP
