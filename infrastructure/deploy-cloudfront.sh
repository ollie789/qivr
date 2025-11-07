#!/bin/bash
set -e

REGION="ap-southeast-2"

echo "🚀 Deploying CloudFront Distributions"
echo "======================================"
echo ""

# Create Origin Access Identity for Clinic Dashboard
echo "Creating Origin Access Identity for Clinic Dashboard..."
CLINIC_OAI=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    "CallerReference=clinic-$(date +%s),Comment=Clinic Dashboard OAI" \
  --query 'CloudFrontOriginAccessIdentity.Id' \
  --output text)
echo "✅ Clinic OAI: $CLINIC_OAI"

# Create Origin Access Identity for Patient Portal
echo "Creating Origin Access Identity for Patient Portal..."
PATIENT_OAI=$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
    "CallerReference=patient-$(date +%s),Comment=Patient Portal OAI" \
  --query 'CloudFrontOriginAccessIdentity.Id' \
  --output text)
echo "✅ Patient OAI: $PATIENT_OAI"

# Update S3 bucket policies
echo ""
echo "Updating S3 bucket policies..."

# Clinic Dashboard bucket policy
aws s3api put-bucket-policy --bucket qivr-clinic-dashboard-staging --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"AllowCloudFrontOAI\",
    \"Effect\": \"Allow\",
    \"Principal\": {\"AWS\": \"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $CLINIC_OAI\"},
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::qivr-clinic-dashboard-staging/*\"
  }]
}"
echo "✅ Updated clinic dashboard bucket policy"

# Patient Portal bucket policy
aws s3api put-bucket-policy --bucket qivr-patient-portal-staging --policy "{
  \"Version\": \"2012-10-17\",
  \"Statement\": [{
    \"Sid\": \"AllowCloudFrontOAI\",
    \"Effect\": \"Allow\",
    \"Principal\": {\"AWS\": \"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity $PATIENT_OAI\"},
    \"Action\": \"s3:GetObject\",
    \"Resource\": \"arn:aws:s3:::qivr-patient-portal-staging/*\"
  }]
}"
echo "✅ Updated patient portal bucket policy"

# Create CloudFront distribution for Clinic Dashboard
echo ""
echo "Creating CloudFront distribution for Clinic Dashboard..."
cat > /tmp/clinic-cf-config.json <<EOF
{
  "CallerReference": "clinic-$(date +%s)",
  "Comment": "Clinic Dashboard Distribution",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-clinic",
      "DomainName": "qivr-clinic-dashboard-staging.s3.ap-southeast-2.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": "origin-access-identity/cloudfront/$CLINIC_OAI"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-clinic",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 3,
      "Items": ["GET", "HEAD", "OPTIONS"],
      "CachedMethods": {
        "Quantity": 3,
        "Items": ["GET", "HEAD", "OPTIONS"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF

CLINIC_DIST_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/clinic-cf-config.json \
  --query 'Distribution.Id' \
  --output text)
CLINIC_DOMAIN=$(aws cloudfront get-distribution --id $CLINIC_DIST_ID --query 'Distribution.DomainName' --output text)
echo "✅ Clinic Distribution: $CLINIC_DIST_ID"
echo "   URL: https://$CLINIC_DOMAIN"

# Create CloudFront distribution for Patient Portal
echo ""
echo "Creating CloudFront distribution for Patient Portal..."
cat > /tmp/patient-cf-config.json <<EOF
{
  "CallerReference": "patient-$(date +%s)",
  "Comment": "Patient Portal Distribution",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-patient",
      "DomainName": "qivr-patient-portal-staging.s3.ap-southeast-2.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": "origin-access-identity/cloudfront/$PATIENT_OAI"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-patient",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 3,
      "Items": ["GET", "HEAD", "OPTIONS"],
      "CachedMethods": {
        "Quantity": 3,
        "Items": ["GET", "HEAD", "OPTIONS"]
      }
    },
    "Compress": true,
    "ForwardedValues": {
      "QueryString": false,
      "Cookies": {"Forward": "none"}
    },
    "MinTTL": 0,
    "DefaultTTL": 86400,
    "MaxTTL": 31536000
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      },
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100",
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  }
}
EOF

PATIENT_DIST_ID=$(aws cloudfront create-distribution \
  --distribution-config file:///tmp/patient-cf-config.json \
  --query 'Distribution.Id' \
  --output text)
PATIENT_DOMAIN=$(aws cloudfront get-distribution --id $PATIENT_DIST_ID --query 'Distribution.DomainName' --output text)
echo "✅ Patient Distribution: $PATIENT_DIST_ID"
echo "   URL: https://$PATIENT_DOMAIN"

# Cleanup
rm /tmp/clinic-cf-config.json /tmp/patient-cf-config.json

echo ""
echo "🎉 CloudFront Deployment Complete!"
echo ""
echo "📊 Summary"
echo "=========="
echo "Clinic Dashboard:"
echo "  Distribution ID: $CLINIC_DIST_ID"
echo "  HTTPS URL: https://$CLINIC_DOMAIN"
echo ""
echo "Patient Portal:"
echo "  Distribution ID: $PATIENT_DIST_ID"
echo "  HTTPS URL: https://$PATIENT_DOMAIN"
echo ""
echo "⏳ Note: CloudFront distributions take 15-20 minutes to fully deploy"
echo "   Status: In Progress → Deployed"
echo ""
echo "Check status:"
echo "  aws cloudfront get-distribution --id $CLINIC_DIST_ID --query 'Distribution.Status'"
echo "  aws cloudfront get-distribution --id $PATIENT_DIST_ID --query 'Distribution.Status'"
