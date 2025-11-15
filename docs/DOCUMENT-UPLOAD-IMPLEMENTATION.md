# Document Upload System Implementation Plan

## Overview
Implement secure document upload with AWS Textract OCR, auto-classification, and workflow automation.

## Phase 1: Backend Infrastructure (Priority)

### 1.1 Database Schema
```sql
-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    uploaded_by UUID NOT NULL,
    document_type VARCHAR(50), -- 'referral', 'consent', 'progress_note', 'lab_report'
    file_name VARCHAR(255),
    file_size BIGINT,
    mime_type VARCHAR(100),
    s3_key VARCHAR(500),
    s3_bucket VARCHAR(255),
    status VARCHAR(50), -- 'processing', 'ready', 'failed'
    
    -- OCR extracted data
    extracted_text TEXT,
    extracted_patient_name VARCHAR(255),
    extracted_dob DATE,
    extracted_identifiers JSONB,
    confidence_score DECIMAL(5,2),
    
    -- Metadata
    tags TEXT[],
    notes TEXT,
    is_urgent BOOLEAN DEFAULT false,
    assigned_to UUID,
    due_date TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP,
    
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Document audit log
CREATE TABLE document_audit_log (
    id UUID PRIMARY KEY,
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    action VARCHAR(50), -- 'uploaded', 'viewed', 'downloaded', 'deleted'
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW(),
    
    FOREIGN KEY (document_id) REFERENCES documents(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 1.2 AWS Services Setup
- **S3 Bucket**: qivr-documents-{env} with encryption at rest (AES-256)
- **Textract**: For OCR and data extraction
- **IAM Role**: ECS task role with Textract and S3 permissions

### 1.3 Backend API Endpoints

```csharp
// DocumentsController.cs
POST   /api/documents/upload          // Upload document with OCR
GET    /api/documents                 // List documents (filtered)
GET    /api/documents/{id}            // Get document details
GET    /api/documents/{id}/download   // Download document
DELETE /api/documents/{id}            // Soft delete
PATCH  /api/documents/{id}/classify   // Manual classification
POST   /api/documents/{id}/assign     // Assign to practitioner
```

### 1.4 Services
- **DocumentService**: Business logic
- **TextractService**: AWS Textract integration
- **S3Service**: File storage operations
- **DocumentClassificationService**: Auto-classify documents

## Phase 2: Frontend - Clinic Dashboard

### 2.1 Document Upload Page
```
/documents/upload
- Patient search/select
- Document type dropdown
- Drag-and-drop upload
- OCR results display
- Manual classification override
- Assign to practitioner
```

### 2.2 Document List Page
```
/documents
- Filterable list (patient, type, date, status)
- Search functionality
- Status indicators
- Quick actions (view, download, assign)
```

### 2.3 Components
- `DocumentUploader.tsx` - Drag-and-drop with preview
- `OCRResultsViewer.tsx` - Show extracted data
- `DocumentClassifier.tsx` - Type selection
- `DocumentList.tsx` - Searchable list

## Phase 3: Frontend - Patient Portal

### 3.1 Document Checklist Page
```
/documents/checklist
- Required documents list
- Upload status per document
- Due dates
- Upload button per item
```

### 3.2 Upload Interface
```
/documents/upload
- Mobile-friendly upload
- Camera capture
- Form filling
- E-signature (future)
```

### 3.3 Components
- `DocumentChecklist.tsx` - Required docs
- `MobileUploader.tsx` - Camera + file upload
- `UploadProgress.tsx` - Status tracking

## Phase 4: Security & Compliance

### 4.1 Encryption
- TLS/HTTPS for all transfers
- S3 server-side encryption (SSE-S3 or SSE-KMS)
- Encrypted database fields for sensitive data

### 4.2 Access Control
- Role-based permissions (Admin, Staff, Patient)
- Audit logging for all document access
- IP tracking

### 4.3 Privacy
- Consent tracking
- Data retention policies
- Right to deletion

## Implementation Order

### Sprint 1 (MVP)
1. Database migration
2. S3 bucket setup
3. Basic upload endpoint (no OCR)
4. Clinic dashboard upload page
5. Document list page

### Sprint 2 (OCR)
1. Textract integration
2. Auto-classification logic
3. OCR results display
4. Manual override

### Sprint 3 (Patient Portal)
1. Patient document checklist
2. Patient upload interface
3. Status notifications
4. Mobile optimization

### Sprint 4 (Advanced)
1. Workflow triggers
2. E-signature integration
3. Advanced classification
4. Analytics

## Technical Stack

### Backend
- .NET 8 Web API
- AWS SDK for .NET (Textract, S3)
- Entity Framework Core

### Frontend
- React + TypeScript
- React Dropzone (drag-and-drop)
- React Query (state management)
- Axios (file upload with progress)

### AWS Services
- S3 (storage)
- Textract (OCR)
- KMS (encryption keys)
- CloudWatch (logging)

## Minimal First Implementation

Focus on:
1. Basic upload to S3
2. Document metadata storage
3. Simple list/download
4. Clinic dashboard only
5. Manual classification

Defer:
- OCR/Textract (add in Sprint 2)
- Patient portal (add in Sprint 3)
- E-signatures (add in Sprint 4)
- Advanced workflows (add in Sprint 4)
