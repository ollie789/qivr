# Document Upload System - Backend Implementation

## ✅ Phase 1 Complete: Backend Foundation

### Database Schema
**Tables Created:**
- `documents` - Stores document metadata and OCR results
- `document_audit_log` - Tracks all document access and modifications

**Key Features:**
- Tenant isolation via `tenant_id`
- Soft deletes with `deleted_at`
- OCR extracted data fields
- Full audit trail
- Indexes for performance

### AWS Services

#### S3Service
- Secure file upload with AES-256 encryption
- Presigned download URLs (60min expiry)
- File deletion
- Bucket: `qivr-documents-prod`

#### TextractService
- AWS Textract integration for OCR
- Extracts patient name, DOB, identifiers
- Pattern matching for:
  - Medicare numbers
  - NDIS numbers
  - Phone numbers
- Confidence scoring

### Business Logic

#### DocumentService
- Upload with automatic OCR processing
- Async OCR (doesn't block upload)
- Document filtering and search
- Classification and assignment
- Audit logging for all actions

### API Endpoints

```
POST   /api/documents/upload          Upload document (multipart/form-data)
GET    /api/documents                 List documents with filters
GET    /api/documents/{id}            Get document details
GET    /api/documents/{id}/download   Get presigned download URL
DELETE /api/documents/{id}            Soft delete document
PATCH  /api/documents/{id}/classify   Manually classify document
PATCH  /api/documents/{id}/assign     Assign to practitioner
```

### Security Features

1. **Encryption**
   - S3 server-side encryption (AES-256)
   - TLS/HTTPS for all transfers
   - Presigned URLs with expiration

2. **Access Control**
   - Tenant isolation
   - Role-based permissions
   - Audit logging with IP tracking

3. **Compliance**
   - HIPAA-compliant storage
   - Australian Privacy Act compliant
   - Full audit trail

### Document Types Supported

- `referral` - Referral letters
- `consent` - Consent forms
- `progress_note` - Progress notes
- `lab_report` - Lab results
- `assessment` - Assessments
- `other` - Other documents

### Document Status Flow

1. `processing` - Upload complete, OCR in progress
2. `ready` - OCR complete, document ready
3. `failed` - OCR failed
4. `archived` - Archived document

### OCR Extraction

**Automatically Extracts:**
- Patient name
- Date of birth
- Medicare number (Australian)
- NDIS number
- Phone number
- Full text content

**Confidence Scoring:**
- Per-block confidence from Textract
- Average confidence score stored
- Manual override available

### Testing

**Test Script:** `scripts/tests/test-document-upload.mjs`

**Tests:**
1. Document upload
2. OCR processing
3. Document retrieval
4. Document listing with filters
5. Download URL generation
6. Document classification
7. Document deletion

**Run Tests:**
```bash
node scripts/tests/test-document-upload.mjs
```

### Configuration Required

**appsettings.json:**
```json
{
  "AWS": {
    "S3": {
      "DocumentsBucket": "qivr-documents-prod"
    },
    "Region": "ap-southeast-2"
  }
}
```

**IAM Permissions Required:**
- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `textract:DetectDocumentText`

### Next Steps

**Phase 2: Clinic Dashboard Frontend**
- Document upload page with drag-and-drop
- OCR results viewer
- Document list with filters
- Patient search integration

**Phase 3: Patient Portal Frontend**
- Document checklist
- Mobile-friendly upload
- Camera capture
- Status tracking

## Files Created

### Backend
- `database/migrations/20251115_create_documents_tables.sql`
- `backend/Qivr.Core/Entities/Document.cs`
- `backend/Qivr.Services/S3Service.cs`
- `backend/Qivr.Services/TextractService.cs`
- `backend/Qivr.Services/DocumentService.cs`
- `backend/Qivr.Api/Controllers/DocumentsController.cs`

### Testing
- `scripts/tests/test-document-upload.mjs`

### Documentation
- `DOCUMENT-UPLOAD-ROADMAP.md`
- `docs/DOCUMENT-UPLOAD-IMPLEMENTATION.md`
- `docs/DOCUMENT-UPLOAD-BACKEND.md` (this file)
