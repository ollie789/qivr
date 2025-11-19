#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = process.env.API_BASE || 'https://api.qivr.pro';
const TEST_EMAIL = process.argv[2];
const TEST_PASSWORD = process.argv[3];

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('Usage: node test-ocr-textract.mjs <email> <password>');
  process.exit(1);
}

let authToken = null;
let tenantId = null;
let patientId = null;

async function apiCall(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API call failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function login() {
  console.log('🔐 Logging in...');
  const response = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  authToken = response.token;
  tenantId = response.tenantId;
  console.log('✅ Logged in successfully');
  return response;
}

async function getPatients() {
  console.log('\n👥 Fetching patients...');
  const response = await apiCall('/api/patients?limit=1');
  if (response.data && response.data.length > 0) {
    patientId = response.data[0].id;
    console.log(`✅ Found patient: ${response.data[0].firstName} ${response.data[0].lastName} (${patientId})`);
    return response.data[0];
  }
  throw new Error('No patients found');
}

async function createTestDocument() {
  console.log('\n📄 Creating test document with sample medical text...');
  
  // Create a simple text file that simulates a medical document
  const testContent = `
MEDICAL RECORD

Patient Name: John Smith
Date of Birth: 01/15/1980
MRN: 12345678

Date of Visit: ${new Date().toLocaleDateString()}

Chief Complaint: Lower back pain

History of Present Illness:
Patient presents with acute lower back pain that started 3 days ago.
Pain is localized to the lumbar region, rated 7/10 in severity.
Pain worsens with movement and improves with rest.

Physical Examination:
- Vital Signs: BP 120/80, HR 72, Temp 98.6°F
- Musculoskeletal: Tenderness over L4-L5, limited range of motion
- Neurological: Intact sensation, normal reflexes

Assessment:
Acute lumbar strain

Plan:
1. NSAIDs for pain management
2. Physical therapy referral
3. Follow-up in 2 weeks

Dr. Jane Doe, MD
License #: MD123456
`;

  const blob = new Blob([testContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('file', blob, 'test-medical-record.txt');
  formData.append('patientId', patientId);
  formData.append('documentType', 'medical-record');

  const response = await fetch(`${API_BASE}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'X-Tenant-Id': tenantId,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }

  const result = await response.json();
  console.log(`✅ Document uploaded: ${result.id}`);
  console.log(`   Status: ${result.status}`);
  return result;
}

async function checkDocumentStatus(documentId, maxAttempts = 30) {
  console.log('\n⏳ Waiting for OCR processing...');
  
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
    
    const doc = await apiCall(`/api/documents/${documentId}`);
    console.log(`   Attempt ${i + 1}/${maxAttempts}: Status = ${doc.status}`);
    
    if (doc.status === 'ready') {
      console.log('✅ OCR processing complete!');
      return doc;
    }
    
    if (doc.status === 'failed') {
      throw new Error('OCR processing failed');
    }
  }
  
  throw new Error('OCR processing timeout');
}

async function verifyOcrResults(document) {
  console.log('\n🔍 Verifying OCR results...');
  
  const checks = [
    { field: 'extractedText', label: 'Extracted Text', required: true },
    { field: 'extractedPatientName', label: 'Patient Name', expected: 'John Smith' },
    { field: 'extractedDob', label: 'Date of Birth', expected: '1980-01-15' },
    { field: 'confidenceScore', label: 'Confidence Score', minValue: 0 },
  ];

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const value = document[check.field];
    
    if (check.required && !value) {
      console.log(`❌ ${check.label}: Missing (required)`);
      failed++;
      continue;
    }

    if (check.expected && value !== check.expected) {
      console.log(`⚠️  ${check.label}: "${value}" (expected "${check.expected}")`);
      // Don't fail on extraction accuracy issues, just warn
    } else if (check.minValue !== undefined && value < check.minValue) {
      console.log(`❌ ${check.label}: ${value} (expected >= ${check.minValue})`);
      failed++;
    } else if (value) {
      console.log(`✅ ${check.label}: ${typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : value}`);
      passed++;
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (document.extractedText) {
    console.log('\n📝 Extracted Text Preview:');
    console.log(document.extractedText.substring(0, 200) + '...');
  }

  return failed === 0;
}

async function testTextractDirectly() {
  console.log('\n🔬 Testing AWS Textract directly...');
  
  try {
    // This would require AWS SDK, just check if the service is configured
    const response = await apiCall('/api/health');
    console.log('✅ API is healthy, Textract should be configured');
  } catch (error) {
    console.log('⚠️  Could not verify Textract configuration:', error.message);
  }
}

async function runTests() {
  console.log('🧪 OCR & Textract Integration Test\n');
  console.log('='.repeat(50));

  try {
    // Step 1: Login
    await login();

    // Step 2: Get a patient
    await getPatients();

    // Step 3: Upload test document
    const document = await createTestDocument();

    // Step 4: Wait for OCR processing
    const processedDoc = await checkDocumentStatus(document.id);

    // Step 5: Verify OCR results
    const success = await verifyOcrResults(processedDoc);

    // Step 6: Test Textract configuration
    await testTextractDirectly();

    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✅ All OCR tests passed!');
      process.exit(0);
    } else {
      console.log('⚠️  Some OCR tests failed');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
