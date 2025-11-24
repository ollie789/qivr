# Document Upload System - Deployment Guide

## 🚀 Complete Implementation Summary

### ✅ What's Been Built

**Backend (Phase 1)**

- Database schema with documents + audit tables
- AWS S3 integration for secure file storage
- AWS Textract integration for OCR
- Complete REST API (7 endpoints)
- Async OCR processing
- Full audit logging

**Clinic Dashboard (Phase 2)**

- Document upload page with drag-and-drop
- Patient search and selection
- OCR results viewer with confidence scores
- Document list with filters and search
- Download and delete functionality

**Patient Portal (Phase 3)**

- Document checklist with progress tracking
- Required documents workflow
- Simple upload interface
- Status indicators

## 📋 Pre-Deployment Checklist

### 1. Database Migration

```bash
# Run migration
psql -h <RDS_HOST> -U <USER> -d qivr_db -f database/migrations/20251115_create_documents_tables.sql
```

### 2. AWS S3 Bucket Setup

```bash
# Create S3 bucket
aws s3 mb s3://qivr-documents-prod --region ap-southeast-2

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket qivr-documents-prod \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Block public access
aws s3api put-public-access-block \
  --bucket qivr-documents-prod \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Set lifecycle policy (optional - archive after 7 years)
aws s3api put-bucket-lifecycle-configuration \
  --bucket qivr-documents-prod \
  --lifecycle-configuration file://s3-lifecycle.json
```

### 3. IAM Permissions

Add to ECS task role:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::qivr-documents-prod/*"
    },
    {
      "Effect": "Allow",
      "Action": ["textract:DetectDocumentText"],
      "Resource": "*"
    }
  ]
}
```

### 4. Backend Configuration

Update `appsettings.Production.json`:

```json
{
  "AWS": {
    "Region": "ap-southeast-2",
    "S3": {
      "DocumentsBucket": "qivr-documents-prod"
    }
  }
}
```

### 5. Frontend Routes

Add to clinic dashboard routes:

```typescript
// apps/clinic-dashboard/src/App.tsx
<Route path="/documents" element={<Documents />} />
<Route path="/documents/upload" element={<DocumentUpload />} />
```

Add to patient portal routes:

```typescript
// apps/patient-portal/src/App.tsx
<Route path="/documents" element={<DocumentChecklist />} />
```

## 🔧 Deployment Steps

### Step 1: Deploy Backend

```bash
# Build and deploy via CodeBuild
aws codebuild start-build \
  --project-name qivr-build \
  --region ap-southeast-2
```

### Step 2: Deploy Frontend

```bash
# Clinic Dashboard
cd apps/clinic-dashboard
npm run build
aws s3 sync dist/ s3://qivr-clinic-dashboard-prod
aws cloudfront create-invalidation \
  --distribution-id E1S9SAZB57T3C3 \
  --paths "/*"

# Patient Portal
cd apps/patient-portal
npm run build
aws s3 sync dist/ s3://qivr-patient-portal-prod
aws cloudfront create-invalidation \
  --distribution-id E39OVJDZIZ22QL \
  --paths "/*"
```

### Step 3: Run Database Migration

```bash
# Connect to RDS and run migration
psql -h qivr-db.xxxxx.ap-southeast-2.rds.amazonaws.com \
     -U qivr_admin \
     -d qivr_db \
     -f database/migrations/20251115_create_documents_tables.sql
```

### Step 4: Verify Deployment

```bash
# Test backend API
node scripts/tests/test-document-upload.mjs

# Check ECS service
aws ecs describe-services \
  --cluster qivr_cluster \
  --services qivr-api \
  --region ap-southeast-2
```

## 🧪 Testing

### Backend API Tests

```bash
# Run comprehensive test
node scripts/tests/test-document-upload.mjs

# Expected output:
# ✅ Document upload
# ✅ OCR extraction
# ✅ Document retrieval
# ✅ Download URL
# ✅ Classification
# ✅ Deletion
```

### Frontend Manual Tests

**Clinic Dashboard:**

1. Navigate to /documents/upload
2. Search and select a patient
3. Drag-and-drop a PDF file
4. Select document type
5. Click "Upload Document"
6. Verify OCR results appear
7. Navigate to /documents
8. Verify document appears in list
9. Download document
10. Delete document

**Patient Portal:**

1. Navigate to /documents
2. View required documents checklist
3. Click "Upload" on a required document
4. Select a file
5. Upload
6. Verify status changes to "Uploaded"
7. Check progress bar updates

## 📊 Monitoring

### CloudWatch Logs

```bash
# View API logs
aws logs tail /aws/ecs/qivr-api --follow --region ap-southeast-2

# Filter for document operations
aws logs filter-log-events \
  --log-group-name /aws/ecs/qivr-api \
  --filter-pattern "Document" \
  --region ap-southeast-2
```

### S3 Metrics

- Monitor bucket size
- Track upload/download requests
- Check encryption status

### Textract Usage

- Monitor API calls
- Track processing time
- Check confidence scores

## 🔒 Security Checklist

- [x] S3 bucket encryption enabled (AES-256)
- [x] S3 public access blocked
- [x] Presigned URLs with expiration (60 min)
- [x] IAM least privilege permissions
- [x] Audit logging enabled
- [x] IP address tracking
- [x] Tenant isolation enforced
- [x] HTTPS/TLS for all transfers
- [x] File size limits (50MB)
- [x] File type validation

## 📈 Performance Optimization

### S3 Configuration

- Use S3 Transfer Acceleration (optional)
- Enable S3 Intelligent-Tiering for cost optimization
- Set lifecycle policies for archival

### Textract Optimization

- Process OCR asynchronously (already implemented)
- Don't block upload on OCR completion
- Poll for results with exponential backoff

### Frontend Optimization

- Lazy load document list
- Implement pagination (already done)
- Cache document metadata
- Use presigned URLs for downloads

## 🐛 Troubleshooting

### Upload Fails

1. Check S3 bucket permissions
2. Verify IAM role attached to ECS task
3. Check file size < 50MB
4. Verify file type is supported

### OCR Not Working

1. Check Textract permissions
2. Verify S3 bucket in same region as Textract
3. Check CloudWatch logs for errors
4. Verify document is text-based (not image-only)

### Download Fails

1. Check presigned URL expiration
2. Verify S3 object exists
3. Check IAM permissions for GetObject

## 📝 Post-Deployment Tasks

1. **Test with real documents**
   - Upload various document types
   - Verify OCR accuracy
   - Test with different file sizes

2. **Monitor performance**
   - Check upload times
   - Monitor OCR processing duration
   - Track API response times

3. **User training**
   - Train staff on upload workflow
   - Document OCR confidence thresholds
   - Explain manual override process

4. **Set up alerts**
   - Failed uploads
   - OCR processing failures
   - High error rates

## 🎯 Success Metrics

- Upload success rate > 99%
- OCR confidence score > 80% average
- Processing time < 10 seconds
- Zero data breaches
- 100% audit trail coverage

## 📞 Support

For issues or questions:

- Check CloudWatch logs
- Review audit logs in database
- Contact DevOps team

---

**Deployment Status:** Ready for Production ✅
**Last Updated:** 2025-11-17
**Version:** 1.0.0
