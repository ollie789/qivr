#!/usr/bin/env node

import fs from 'fs';

const API_BASE = 'https://api.qivr.pro';
const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
const IMAGE_PATH = process.argv[4];

if (!EMAIL || !PASSWORD || !IMAGE_PATH) {
  console.error('Usage: node test-ocr-image.mjs <email> <password> <image-path>');
  process.exit(1);
}

let authToken, tenantId, patientId;

async function apiCall(endpoint, options = {}) {
  const headers = { ...options.headers };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  if (tenantId) headers['X-Tenant-Id'] = tenantId;

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  if (!response.ok) throw new Error(`${response.status} ${await response.text()}`);
  return response.json();
}

console.log('🔐 Logging in...');
const loginData = await apiCall('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD })
});
authToken = loginData.accessToken;
tenantId = loginData.userInfo.tenantId;
console.log(`✅ Logged in (Tenant: ${tenantId})`);

console.log('👥 Getting patients...');
const patientsResponse = await apiCall('/api/patients');
const patients = patientsResponse.items || patientsResponse;
if (!patients || patients.length === 0) {
  console.log('❌ No patients found. Please create a patient first.');
  process.exit(1);
}
patientId = patients[0].id;
console.log(`✅ Using patient: ${patients[0].firstName} ${patients[0].lastName} (${patientId})`);

console.log(`📄 Uploading image: ${IMAGE_PATH}`);
const fileBuffer = fs.readFileSync(IMAGE_PATH);
const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
const formData = new FormData();
formData.append('file', blob, IMAGE_PATH.split('/').pop());
formData.append('patientId', patientId);
formData.append('documentType', 'medical-certificate');

const uploadResponse = await fetch(`${API_BASE}/api/documents/upload`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-Tenant-Id': tenantId
  },
  body: formData
});

if (!uploadResponse.ok) throw new Error(`Upload failed: ${await uploadResponse.text()}`);
const document = await uploadResponse.json();
console.log(`✅ Uploaded: ${document.id} (Status: ${document.status})`);

console.log('⏳ Waiting for OCR processing...');
for (let i = 0; i < 30; i++) {
  await new Promise(r => setTimeout(r, 2000));
  const doc = await apiCall(`/api/documents/${document.id}`);
  console.log(`   Attempt ${i + 1}/30: Status = ${doc.status}`);
  
  if (doc.status === 'ready') {
    console.log('\n✅ OCR COMPLETE!');
    console.log(`   Extracted text (${doc.extractedText?.length || 0} chars):`);
    console.log(`   ${doc.extractedText?.substring(0, 200)}...`);
    console.log(`   Patient name: ${doc.extractedPatientName || 'N/A'}`);
    console.log(`   DOB: ${doc.extractedDob || 'N/A'}`);
    console.log(`   Confidence: ${doc.confidenceScore || 0}%`);
    process.exit(0);
  }
  
  if (doc.status === 'failed') {
    console.log('\n❌ OCR FAILED');
    process.exit(1);
  }
}

console.log('\n⚠️  Timeout - still processing');
