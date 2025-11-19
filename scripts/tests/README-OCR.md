# OCR & Textract Integration Test

Tests the document OCR processing pipeline using AWS Textract.

## What It Tests

1. **Document Upload** - Uploads a test medical document
2. **OCR Processing** - Waits for Textract to process the document
3. **Data Extraction** - Verifies extracted fields:
   - Full text extraction
   - Patient name extraction
   - Date of birth extraction
   - Confidence scores
4. **Status Tracking** - Monitors document processing status

## Usage

```bash
# Run the test
node scripts/tests/test-ocr-textract.mjs user@clinic.com Password123!

# Or use npm script
npm run test:ocr -- user@clinic.com Password123!
```

## Expected Output

```
🧪 OCR & Textract Integration Test

==================================================
🔐 Logging in...
✅ Logged in successfully

👥 Fetching patients...
✅ Found patient: John Doe (abc-123-def)

📄 Creating test document with sample medical text...
✅ Document uploaded: doc-456-xyz
   Status: processing

⏳ Waiting for OCR processing...
   Attempt 1/30: Status = processing
   Attempt 2/30: Status = processing
   Attempt 3/30: Status = ready
✅ OCR processing complete!

🔍 Verifying OCR results...
✅ Extracted Text: MEDICAL RECORD\n\nPatient Name: John Smith...
✅ Patient Name: John Smith
✅ Date of Birth: 1980-01-15
✅ Confidence Score: 95.5

📊 Results: 4 passed, 0 failed

📝 Extracted Text Preview:
MEDICAL RECORD

Patient Name: John Smith
Date of Birth: 01/15/1980
MRN: 12345678

Date of Visit: 11/19/2025

Chief Complaint: Lower back pain...

🔬 Testing AWS Textract directly...
✅ API is healthy, Textract should be configured

==================================================
✅ All OCR tests passed!
```

## Test Document

The test creates a synthetic medical record with:

- Patient demographics (name, DOB, MRN)
- Visit information
- Chief complaint
- History of present illness
- Physical examination findings
- Assessment and plan
- Provider signature

## Troubleshooting

### Document stuck in "processing"

- Check SQS queue for messages
- Verify Lambda function is running
- Check CloudWatch logs for errors

### No text extracted

- Verify Textract IAM permissions
- Check S3 bucket access
- Ensure document format is supported

### Low confidence scores

- Document quality may be poor
- Try with a clearer document
- Check Textract service limits

## Integration Points

1. **API** → `/api/documents/upload` - Upload endpoint
2. **S3** → Document storage bucket
3. **SQS** → OCR processing queue
4. **Lambda** → Textract processing function
5. **Textract** → AWS OCR service
6. **Database** → Document metadata and extracted data

## Configuration

Required environment variables:

- `AWS_REGION` - AWS region for Textract
- `S3_BUCKET` - Document storage bucket
- `SQS_QUEUE_URL` - OCR processing queue
- Textract IAM permissions on Lambda execution role
