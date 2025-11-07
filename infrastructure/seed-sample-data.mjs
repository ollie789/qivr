#!/usr/bin/env node
/**
 * Seed Sample Data via API
 * Creates demo patients, appointments, and medical records
 */

const API_URL = process.env.API_URL || 'http://qivr-alb-1257648623.ap-southeast-2.elb.amazonaws.com';
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error('❌ Error: AUTH_TOKEN environment variable required');
  console.error('Usage: AUTH_TOKEN=<your-jwt-token> node seed-sample-data.mjs');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${AUTH_TOKEN}`
};

async function apiCall(method, path, body = null) {
  const options = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_URL}${path}`, options);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API call failed: ${response.status} ${response.statusText}\n${text}`);
  }
  
  return response.json();
}

async function seedData() {
  console.log('🌱 Seeding sample data...\n');

  try {
    // Create sample patients
    console.log('Creating patients...');
    
    const patient1 = await apiCall('POST', '/api/patients', {
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@example.com',
      phone: '+61412345678',
      dateOfBirth: '1985-03-15',
      gender: 'Female',
      address: '123 Main St',
      city: 'Sydney',
      state: 'NSW',
      postalCode: '2000',
      country: 'Australia',
      emergencyContactName: 'John Johnson',
      emergencyContactPhone: '+61412345679'
    });
    console.log('✅ Created patient: Sarah Johnson');

    const patient2 = await apiCall('POST', '/api/patients', {
      firstName: 'Michael',
      lastName: 'Chen',
      email: 'michael.chen@example.com',
      phone: '+61423456789',
      dateOfBirth: '1990-07-22',
      gender: 'Male',
      address: '456 George St',
      city: 'Melbourne',
      state: 'VIC',
      postalCode: '3000',
      country: 'Australia',
      emergencyContactName: 'Lisa Chen',
      emergencyContactPhone: '+61423456790'
    });
    console.log('✅ Created patient: Michael Chen');

    const patient3 = await apiCall('POST', '/api/patients', {
      firstName: 'Emma',
      lastName: 'Williams',
      email: 'emma.williams@example.com',
      phone: '+61434567890',
      dateOfBirth: '1978-11-08',
      gender: 'Female',
      address: '789 Queen St',
      city: 'Brisbane',
      state: 'QLD',
      postalCode: '4000',
      country: 'Australia',
      emergencyContactName: 'David Williams',
      emergencyContactPhone: '+61434567891'
    });
    console.log('✅ Created patient: Emma Williams\n');

    // Create appointments
    console.log('Creating appointments...');
    
    const now = new Date();
    const pastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const past3Days = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const future2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const future5Days = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const future10Days = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000);

    await apiCall('POST', '/api/appointments', {
      patientId: patient1.id,
      appointmentDate: pastWeek.toISOString(),
      durationMinutes: 60,
      appointmentType: 'Initial Consultation',
      status: 'Completed',
      notes: 'Patient presented with lower back pain. Prescribed exercises.'
    });
    console.log('✅ Created past appointment for Sarah');

    await apiCall('POST', '/api/appointments', {
      patientId: patient2.id,
      appointmentDate: past3Days.toISOString(),
      durationMinutes: 45,
      appointmentType: 'Follow-up',
      status: 'Completed',
      notes: 'Shoulder mobility improving. Continue current treatment plan.'
    });
    console.log('✅ Created past appointment for Michael');

    await apiCall('POST', '/api/appointments', {
      patientId: patient1.id,
      appointmentDate: future2Days.toISOString(),
      durationMinutes: 60,
      appointmentType: 'Follow-up',
      status: 'Scheduled',
      notes: 'Follow-up for back pain treatment'
    });
    console.log('✅ Created upcoming appointment for Sarah');

    await apiCall('POST', '/api/appointments', {
      patientId: patient3.id,
      appointmentDate: future5Days.toISOString(),
      durationMinutes: 60,
      appointmentType: 'Initial Consultation',
      status: 'Scheduled',
      notes: 'New patient - knee pain assessment'
    });
    console.log('✅ Created upcoming appointment for Emma');

    await apiCall('POST', '/api/appointments', {
      patientId: patient2.id,
      appointmentDate: future10Days.toISOString(),
      durationMinutes: 45,
      appointmentType: 'Follow-up',
      status: 'Scheduled',
      notes: 'Continue shoulder rehabilitation'
    });
    console.log('✅ Created upcoming appointment for Michael\n');

    // Create medical records
    console.log('Creating medical records...');

    await apiCall('POST', '/api/medical-records', {
      patientId: patient1.id,
      recordType: 'Assessment',
      title: 'Initial Assessment - Lower Back Pain',
      description: 'Patient reports chronic lower back pain for 3 months. Pain rated 6/10. Limited range of motion. Prescribed stretching exercises and follow-up in 2 weeks.',
      recordDate: pastWeek.toISOString()
    });
    console.log('✅ Created medical record for Sarah');

    await apiCall('POST', '/api/medical-records', {
      patientId: patient2.id,
      recordType: 'Assessment',
      title: 'Shoulder Mobility Assessment',
      description: 'Reduced shoulder abduction. Likely rotator cuff strain. Treatment plan: manual therapy + home exercises.',
      recordDate: past3Days.toISOString()
    });
    console.log('✅ Created medical record for Michael');

    await apiCall('POST', '/api/medical-records', {
      patientId: patient1.id,
      recordType: 'Treatment Plan',
      title: 'Back Pain Treatment Plan',
      description: 'Week 1-2: Daily stretching, ice therapy. Week 3-4: Strengthen core muscles. Week 5-6: Return to normal activities gradually.',
      recordDate: pastWeek.toISOString()
    });
    console.log('✅ Created treatment plan for Sarah\n');

    console.log('🎉 Sample data seeded successfully!');
    console.log('\nSummary:');
    console.log('  - 3 patients created');
    console.log('  - 5 appointments created (2 past, 3 upcoming)');
    console.log('  - 3 medical records created');
    console.log('\nYou can now test the application with this sample data.');

  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    process.exit(1);
  }
}

seedData();
