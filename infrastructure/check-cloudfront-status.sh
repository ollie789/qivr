#!/bin/bash

echo "🔍 Checking CloudFront Deployment Status"
echo "========================================="
echo ""

CLINIC_ID="E1S9SAZB57T3C3"
PATIENT_ID="E39OVJDZIZ22QL"

echo "Clinic Dashboard:"
CLINIC_STATUS=$(aws cloudfront get-distribution --id $CLINIC_ID --query 'Distribution.Status' --output text)
echo "  Status: $CLINIC_STATUS"
echo "  URL: https://dwmqwnt4dy1td.cloudfront.net"
echo ""

echo "Patient Portal:"
PATIENT_STATUS=$(aws cloudfront get-distribution --id $PATIENT_ID --query 'Distribution.Status' --output text)
echo "  Status: $PATIENT_STATUS"
echo "  URL: https://d1jw6e1qiegavd.cloudfront.net"
echo ""

if [ "$CLINIC_STATUS" = "Deployed" ] && [ "$PATIENT_STATUS" = "Deployed" ]; then
  echo "✅ Both distributions are LIVE!"
  echo ""
  echo "Test them:"
  echo "  curl -I https://dwmqwnt4dy1td.cloudfront.net"
  echo "  curl -I https://d1jw6e1qiegavd.cloudfront.net"
else
  echo "⏳ Still deploying... Check again in a few minutes"
  echo ""
  echo "Run this script again: ./infrastructure/check-cloudfront-status.sh"
fi
