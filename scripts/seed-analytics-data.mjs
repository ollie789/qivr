#!/usr/bin/env node
import https from 'https';
import http from 'http';

const API_URL = process.env.API_URL || 'http://localhost:5050';
const TENANT_ID = 'b6c55eef-b8ac-4b8e-8b5f-7d3a7c9e4f11';

// Helper to make API requests
async function apiRequest(method, path, data = null, token = null) {
  const url = new URL(path, API_URL);
  const isHttps = url.protocol === 'https:';
  const client = isHttps ? https : http;
  
  return new Promise((resolve, reject) => {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    
    const req = client.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = body ? JSON.parse(body) : {};
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            reject(new Error(`${res.statusCode}: ${body}`));
          }
        } catch (e) {
          resolve(body);
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// Get auth token (using dev auth if enabled)
async function getAuthToken() {
  try {
    const response = await apiRequest('POST', '/api/v1/auth/dev-login', {
      email: 'test.doctor@clinic.com'
    });
    return response.token || response.accessToken;
  } catch (e) {
    console.log('⚠️  Dev auth not available, proceeding without token');
    return null;
  }
}

// Create test data
async function seedData() {
  console.log('🌱 Seeding analytics test data...\n');
  
  const token = await getAuthToken();
  
  const patients = [
    {
      email: 'john.smith@example.com',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+61412345001',
      dateOfBirth: '1985-03-15',
      gender: 'Male',
      appointments: [
        { daysAgo: 5, type: 'Initial Consultation', status: 'Completed', notes: 'Lower back pain assessment' },
        { daysAhead: 7, type: 'Follow-up', status: 'Scheduled' }
      ],
      documents: [
        { title: 'X-Ray Results', category: 'Imaging' },
        { title: 'Treatment Plan', category: 'Treatment Plan' }
      ]
    },
    {
      email: 'emily.jones@example.com',
      firstName: 'Emily',
      lastName: 'Jones',
      phone: '+61412345002',
      dateOfBirth: '1992-07-22',
      gender: 'Female',
      appointments: [
        { daysAgo: 60, type: 'Initial Consultation', status: 'Completed', notes: 'Knee injury assessment' },
        { daysAgo: 30, type: 'Follow-up', status: 'Completed', notes: 'Progress check' },
        { daysAhead: 14, type: 'Follow-up', status: 'Scheduled' }
      ],
      documents: [
        { title: 'MRI Scan', category: 'Imaging' },
        { title: 'Progress Notes', category: 'Clinical Notes' }
      ]
    },
    {
      email: 'michael.brown@example.com',
      firstName: 'Michael',
      lastName: 'Brown',
      phone: '+61412345003',
      dateOfBirth: '1978-11-08',
      gender: 'Male',
      appointments: [
        { daysAgo: 7, type: 'Initial Consultation', status: 'Completed', notes: 'Shoulder pain assessment' }
      ]
    },
    {
      email: 'sarah.davis@example.com',
      firstName: 'Sarah',
      lastName: 'Davis',
      phone: '+61412345004',
      dateOfBirth: '1988-05-20',
      gender: 'Female',
      appointments: [
        { daysAgo: 90, type: 'Initial Consultation', status: 'Completed', notes: 'Chronic pain management' },
        { daysAgo: 60, type: 'Follow-up', status: 'Completed', notes: 'Treatment progress' },
        { daysAgo: 30, type: 'Follow-up', status: 'Completed', notes: 'Ongoing treatment' },
        { daysAhead: 21, type: 'Follow-up', status: 'Scheduled' }
      ],
      documents: [
        { title: 'Initial Assessment', category: 'Assessment' }
      ]
    },
    {
      email: 'david.wilson@example.com',
      firstName: 'David',
      lastName: 'Wilson',
      phone: '+61412345005',
      dateOfBirth: '1995-09-12',
      gender: 'Male',
      appointments: [
        { daysAgo: 100, type: 'Initial Consultation', status: 'Completed', notes: 'Initial assessment' }
      ]
    }
  ];
  
  console.log(`Creating ${patients.length} patients with complete data...\n`);
  
  for (const patient of patients) {
    try {
      console.log(`👤 Creating ${patient.firstName} ${patient.lastName}...`);
      
      // Create patient via intake endpoint (public)
      await apiRequest('POST', '/api/v1/intake/submit', {
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        reason: `Test patient for analytics - ${patient.firstName}`,
        preferredContactMethod: 'email',
        tenantId: TENANT_ID
      });
      
      console.log(`  ✓ Patient created`);
      console.log(`  📅 ${patient.appointments?.length || 0} appointments`);
      console.log(`  📄 ${patient.documents?.length || 0} documents`);
      
    } catch (error) {
      console.log(`  ⚠️  ${error.message}`);
    }
  }
  
  console.log('\n✅ Seed data submitted to intake queue!');
  console.log('📊 The IntakeProcessingWorker will create these patients within 30 seconds');
  console.log('\n💡 Note: Appointments, documents, and PROMs need to be added via the UI or direct DB insert');
  console.log('   Run the SQL script for complete data: psql < database/seed-analytics-data.sql');
}

seedData().catch(console.error);
