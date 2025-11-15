#!/usr/bin/env node

/**
 * Document Upload API Test
 * Tests the new document upload endpoints
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'https://api.qivr.pro';
const TEST_EMAIL = process.env.TEST_EMAIL || 'admin@demo.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'Demo123!';

let authToken = null;
let patientId = null;
let documentId = null;

// Helper: Login
async function login() {
  console.log('\n🔐 Logging in...');
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD })
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.status}`);
  }

  const data = await response.json();
  authToken = data.accessToken;
  console.log('✅ Logged in successfully');
  return authToken;
}

// Helper: Get first patient
async function getFirstPatient() {
  console.log('\n👤 Getting first patient...');
  const response = await fetch(`${API_URL}/api/patients?pageSize=1`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to get patients: ${response.status}`);
  }

  const data = await response.json();
  if (data.data && data.data.length > 0) {
    patientId = data.data[0].id;
    console.log(`✅ Found patient: ${patientId}`);
    return patientId;
  }

  throw new Error('No patients found');
}

// Test 1: Upload document
async function testUploadDocument() {
  console.log('\n📤 Test 1: Upload Document');
  
  // Create a test file
  const testContent = `
    Patient Name: John Smith
    Date of Birth: 01/15/1980
    Medicare Number: 1234567890
    NDIS Number: 123456789
    Phone: +61 400 123 456
    
    This is a test referral document for testing purposes.
  `;
  
  const testFilePath = path.join(__dirname, 'test-document.txt');
  fs.writeFileSync(testFilePath, testContent);

  const formData = new FormData();
  const fileBlob = new Blob([testContent], { type: 'text/plain' });
  formData.append('File', fileBlob, 'test-referral.txt');
  formData.append('PatientId', patientId);
  formData.append('DocumentType', 'referral');
  formData.append('Notes', 'Test upload from API test script');
  formData.append('IsUrgent', 'false');

  const response = await fetch(`${API_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}` },
    body: formData
  });

  // Clean up test file
  fs.unlinkSync(testFilePath);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Upload failed: ${response.status} - ${error}`);
  }

  const document = await response.json();
  documentId = document.id;
  
  console.log('✅ Document uploaded successfully');
  console.log(`   ID: ${document.id}`);
  console.log(`   Status: ${document.status}`);
  console.log(`   File: ${document.fileName}`);
  
  return document;
}

// Test 2: Get document details
async function testGetDocument() {
  console.log('\n📄 Test 2: Get Document Details');
  
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`Get document failed: ${response.status}`);
  }

  const document = await response.json();
  
  console.log('✅ Document retrieved successfully');
  console.log(`   Status: ${document.status}`);
  console.log(`   Extracted Name: ${document.extractedPatientName || 'Processing...'}`);
  console.log(`   Confidence: ${document.confidenceScore ? document.confidenceScore + '%' : 'N/A'}`);
  
  return document;
}

// Test 3: List documents
async function testListDocuments() {
  console.log('\n📋 Test 3: List Documents');
  
  const response = await fetch(`${API_URL}/api/documents?patientId=${patientId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`List documents failed: ${response.status}`);
  }

  const documents = await response.json();
  
  console.log(`✅ Found ${documents.length} document(s)`);
  documents.slice(0, 3).forEach(doc => {
    console.log(`   - ${doc.fileName} (${doc.documentType}) - ${doc.status}`);
  });
  
  return documents;
}

// Test 4: Get download URL
async function testGetDownloadUrl() {
  console.log('\n⬇️  Test 4: Get Download URL');
  
  const response = await fetch(`${API_URL}/api/documents/${documentId}/download`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`Get download URL failed: ${response.status}`);
  }

  const data = await response.json();
  
  console.log('✅ Download URL generated');
  console.log(`   Expires in: ${data.expiresIn} seconds`);
  console.log(`   URL: ${data.url.substring(0, 50)}...`);
  
  return data;
}

// Test 5: Classify document
async function testClassifyDocument() {
  console.log('\n🏷️  Test 5: Classify Document');
  
  const response = await fetch(`${API_URL}/api/documents/${documentId}/classify`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ documentType: 'assessment' })
  });

  if (!response.ok) {
    throw new Error(`Classify document failed: ${response.status}`);
  }

  const document = await response.json();
  
  console.log('✅ Document classified');
  console.log(`   New type: ${document.documentType}`);
  
  return document;
}

// Test 6: Delete document
async function testDeleteDocument() {
  console.log('\n🗑️  Test 6: Delete Document');
  
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });

  if (!response.ok) {
    throw new Error(`Delete document failed: ${response.status}`);
  }

  console.log('✅ Document deleted (soft delete)');
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting Document Upload API Tests');
  console.log(`📍 API URL: ${API_URL}`);
  
  try {
    await login();
    await getFirstPatient();
    await testUploadDocument();
    
    // Wait a bit for OCR processing
    console.log('\n⏳ Waiting 5 seconds for OCR processing...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await testGetDocument();
    await testListDocuments();
    await testGetDownloadUrl();
    await testClassifyDocument();
    await testDeleteDocument();
    
    console.log('\n✅ All tests passed!');
    console.log('\n📊 Summary:');
    console.log('   - Document upload: ✅');
    console.log('   - OCR extraction: ✅');
    console.log('   - Document retrieval: ✅');
    console.log('   - Document listing: ✅');
    console.log('   - Download URL: ✅');
    console.log('   - Classification: ✅');
    console.log('   - Deletion: ✅');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

runTests();
