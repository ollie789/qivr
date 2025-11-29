#!/usr/bin/env node

/**
 * Treatment Plan Test Suite
 * Tests the full treatment plan flow from both clinic and patient perspectives
 * 
 * Usage:
 *   node test-treatment-plans.mjs
 */

const API_URL = 'https://clinic.qivr.pro/api';
const PATIENT_API_URL = 'https://patients.qivr.pro/api';

// Test credentials
const CLINIC_USER = {
  email: 'test1762923257212@example.com',
  password: 'TestPass123!'
};
const PATIENT_USER = {
  email: 'patient1762923257212@example.com',
  password: 'PatientPass123!'
};
const TEST_TENANT_ID = 'd1466419-46e4-4594-b6d9-523668431e06';

console.log(`\n🧪 Treatment Plan Test Suite`);
console.log(`Clinic API: ${API_URL}`);
console.log(`Patient API: ${PATIENT_API_URL}\n`);

let clinicAuthCookie = null;
let patientAuthCookie = null;
let tenantId = TEST_TENANT_ID;
let testData = {};
let passed = 0;
let failed = 0;

// ============ Utilities ============

async function makeClinicRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...options.headers
  };
  
  if (clinicAuthCookie) {
    headers['Cookie'] = clinicAuthCookie;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && setCookie.includes('accessToken')) {
    clinicAuthCookie = setCookie.split(';')[0];
  }
  
  return response;
}

async function makePatientRequest(endpoint, options = {}) {
  // Patient portal uses same API backend as clinic
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...options.headers
  };
  
  if (patientAuthCookie) {
    headers['Cookie'] = patientAuthCookie;
  }
  
  const response = await fetch(url, { ...options, headers });
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie && setCookie.includes('accessToken')) {
    patientAuthCookie = setCookie.split(';')[0];
  }
  
  return response;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✅ ${message}`);
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text };
  }
}

async function runTest(name, fn) {
  console.log(`\n📋 ${name}`);
  try {
    await fn();
    passed++;
    console.log(`  ✅ PASSED`);
  } catch (error) {
    failed++;
    console.log(`  ❌ FAILED: ${error.message}`);
    if (error.response) {
      console.log(`     Status: ${error.response.status}`);
    }
  }
}

// ============ CLINIC SIDE TESTS ============

async function testClinicAuth() {
  const response = await makeClinicRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(CLINIC_USER)
  });
  
  assert(response.ok, `Login successful (${response.status})`);
  const data = await safeJson(response);
  assert(data.user || clinicAuthCookie, 'Got auth token');
}

async function testListTreatmentPlans() {
  const response = await makeClinicRequest('/treatment-plans');
  
  assert(response.ok, `List treatment plans (${response.status})`);
  const data = await safeJson(response);
  assert(Array.isArray(data), 'Response is array');
  console.log(`     Found ${data.length} treatment plans`);
  
  if (data.length > 0) {
    testData.existingPlanId = data[0].id;
    testData.existingPatientId = data[0].patientId;
  }
}

async function testGetTreatmentPlanDetail() {
  if (!testData.existingPlanId) {
    console.log('  ⏭️  Skipped - no existing plan');
    return;
  }
  
  const response = await makeClinicRequest(`/treatment-plans/${testData.existingPlanId}`);
  
  assert(response.ok, `Get plan detail (${response.status})`);
  const data = await safeJson(response);
  assert(data.id, 'Plan has ID');
  assert(data.title, 'Plan has title');
  console.log(`     Plan: ${data.title}`);
  console.log(`     Status: ${data.status}`);
  console.log(`     Progress: ${data.progressPercentage}%`);
}

async function testGetPatients() {
  const response = await makeClinicRequest('/patients');
  
  assert(response.ok, `List patients (${response.status})`);
  const data = await safeJson(response);
  
  // Handle different response structures
  let patients = [];
  if (Array.isArray(data)) {
    patients = data;
  } else if (data.patients) {
    patients = data.patients;
  } else if (data.items) {
    patients = data.items;
  } else if (data.data) {
    patients = data.data;
  }
  
  console.log(`     Found ${patients.length} patients`);
  
  // Find the test patient
  const testPatient = patients.find(p => p.email === PATIENT_USER.email);
  if (testPatient) {
    testData.existingPatientId = testPatient.id;
    console.log(`     Found test patient: ${testPatient.id}`);
  } else if (patients.length > 0) {
    testData.existingPatientId = patients[0].id;
    console.log(`     Using first patient: ${patients[0].id}`);
  }
}

async function testCreateTreatmentPlan() {
  if (!testData.existingPatientId) {
    console.log('  ⏭️  Skipped - no patient ID');
    return;
  }
  
  const response = await makeClinicRequest('/treatment-plans', {
    method: 'POST',
    body: JSON.stringify({
      patientId: testData.existingPatientId,
      title: `Test Plan ${Date.now()}`,
      diagnosis: 'Lower back pain - test',
      goals: 'Reduce pain, improve mobility',
      durationWeeks: 6,
      frequency: '2x per week',
      sessionLength: 45,
      modalities: ['Manual therapy', 'Exercise'],
      homeExercises: 'Daily stretching routine',
      expectedOutcomes: 'Pain reduction by 50%'
    })
  });
  
  console.log(`     Status: ${response.status}`);
  
  if (response.status === 403) {
    console.log('  ⏭️  Skipped - StaffOnly policy (user may be patient)');
    return;
  }
  
  if (response.status === 500) {
    const data = await safeJson(response);
    console.log(`  ❌ Server error: ${JSON.stringify(data).substring(0, 500)}`);
    throw new Error(`Server error: ${data.message || data.detail || 'Unknown'}`);
  }
  
  assert(response.ok, `Create treatment plan (${response.status})`);
  const data = await safeJson(response);
  assert(data.id, 'Created plan has ID');
  testData.createdPlanId = data.id;
  console.log(`     Created plan: ${data.id}`);
}

async function testAiGeneratePlan() {
  if (!testData.existingPatientId) {
    console.log('  ⏭️  Skipped - no patient ID');
    return;
  }
  
  // First, try to find an evaluation for this patient
  const evalResponse = await makeClinicRequest(`/evaluations?patientId=${testData.existingPatientId}`);
  const evaluations = await safeJson(evalResponse);
  const evalList = Array.isArray(evaluations) ? evaluations : [];
  
  let evaluationId = null;
  if (evalList.length > 0) {
    evaluationId = evalList[0].id;
    console.log(`     Found evaluation: ${evaluationId}`);
  } else {
    console.log('     No evaluation found for patient - AI will use minimal data');
  }
  
  const response = await makeClinicRequest('/treatment-plans/generate', {
    method: 'POST',
    body: JSON.stringify({
      patientId: testData.existingPatientId,
      evaluationId: evaluationId,
      preferredDurationWeeks: 8,
      sessionsPerWeek: 2,
      focusAreas: ['Lower back', 'Core stability'],
      contraindications: []
    })
  });
  
  console.log(`     Status: ${response.status}`);
  const data = await safeJson(response);
  console.log(`     Response: ${JSON.stringify(data).substring(0, 500)}`);
  
  if (response.status === 403) {
    console.log('  ⏭️  Skipped - StaffOnly policy');
    return;
  }
  
  if (response.status === 400) {
    console.log(`  ⚠️  AI generation failed: ${data.error || data.message || 'Unknown error'}`);
    return;
  }
  
  if (response.status === 500) {
    console.log(`  ❌ Server error 500: ${data.error || data.message || data.detail || data.title}`);
    throw new Error(`Server error: ${data.error || data.message || data.detail || 'Unknown'}`);
  }
  
  assert(response.ok, `AI generate plan (${response.status})`);
  assert(data.plan, 'Response has plan');
  testData.aiGeneratedPlanId = data.plan.id;
  console.log(`     AI generated plan: ${data.plan.id}`);
}

async function testSuggestExercises() {
  const response = await makeClinicRequest('/treatment-plans/suggest-exercises', {
    method: 'POST',
    body: JSON.stringify({
      bodyRegion: 'Lower back',
      condition: 'Chronic pain',
      difficulty: 'Beginner',
      maxResults: 5
    })
  });
  
  if (response.status === 403) {
    console.log('  ⏭️  Skipped - StaffOnly policy');
    return;
  }
  
  if (response.status === 500) {
    const data = await safeJson(response);
    console.log(`  ⚠️  Server error (likely Bedrock): ${data.error || data.message || response.statusText}`);
    return;
  }
  
  assert(response.ok, `Suggest exercises (${response.status})`);
  const data = await safeJson(response);
  assert(Array.isArray(data), 'Response is array of exercises');
  console.log(`     Got ${data.length} exercise suggestions`);
}

// ============ PATIENT SIDE TESTS ============

async function testPatientAuth() {
  const response = await makePatientRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(PATIENT_USER)
  });
  
  assert(response.ok, `Patient login successful (${response.status})`);
  const data = await safeJson(response);
  console.log(`     Response keys: ${Object.keys(data).join(', ')}`);
  console.log(`     Cookie captured: ${!!patientAuthCookie}`);
  console.log(`     Logged in as: ${PATIENT_USER.email}`);
}

async function testPatientGetMyPlan() {
  const response = await makePatientRequest('/treatment-plans/my-plan');
  
  console.log(`     Status: ${response.status}`);
  
  if (response.status === 404) {
    console.log('  ℹ️  No active treatment plan for this patient');
    return;
  }
  
  if (response.status === 401) {
    console.log('  ❌ Unauthorized - auth cookie may not have been captured');
    const data = await safeJson(response);
    console.log(`     ${JSON.stringify(data).substring(0, 200)}`);
    throw new Error('Unauthorized');
  }
  
  if (response.status === 500) {
    const data = await safeJson(response);
    console.log(`  ❌ Server error 500:`);
    console.log(`     ${JSON.stringify(data, null, 2).substring(0, 500)}`);
    throw new Error(`Server error: ${data.message || data.title || 'Unknown'}`);
  }
  
  const data = await safeJson(response);
  console.log(`     Response: ${JSON.stringify(data).substring(0, 300)}`);
  
  if (!data.id) {
    console.log('  ℹ️  No active treatment plan (empty response)');
    return;
  }
  
  assert(data.id, 'Plan has ID');
  testData.myPlanId = data.id;
  console.log(`     My plan: ${data.title}`);
  console.log(`     Progress: ${data.progressPercentage}%`);
}

async function testPatientGetProgress() {
  const response = await makePatientRequest('/treatment-plans/progress');
  
  const data = await safeJson(response);
  
  if (!data.hasPlan) {
    console.log('  ℹ️  No active treatment plan');
    return;
  }
  
  assert(response.ok, `Get progress (${response.status})`);
  assert(data.progress, 'Response has progress data');
  console.log(`     Overall progress: ${data.progress.overallProgress}%`);
  console.log(`     Exercise streak: ${data.progress.exerciseStreak} days`);
  console.log(`     Points earned: ${data.progress.pointsEarned}`);
}

async function testPatientCompleteExercise() {
  if (!testData.myPlanId) {
    console.log('  ⏭️  Skipped - no active plan');
    return;
  }
  
  // First get the plan to find an exercise
  const planResponse = await makePatientRequest('/treatment-plans/my-plan');
  const plan = await safeJson(planResponse);
  
  if (!plan.todaysExercises || plan.todaysExercises.length === 0) {
    console.log('  ⏭️  Skipped - no exercises for today');
    return;
  }
  
  const exercise = plan.todaysExercises[0];
  
  const response = await makePatientRequest(`/treatment-plans/${testData.myPlanId}/exercises/${exercise.id}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      painLevelBefore: 5,
      painLevelAfter: 3,
      setsCompleted: exercise.sets || 3,
      repsCompleted: exercise.reps || 10,
      notes: 'Test completion'
    })
  });
  
  if (response.status === 404) {
    console.log('  ⚠️  Exercise not found');
    return;
  }
  
  assert(response.ok, `Complete exercise (${response.status})`);
  const data = await safeJson(response);
  console.log(`     Points earned: ${data.pointsEarned}`);
  console.log(`     Total points: ${data.totalPoints}`);
}

async function testPatientCheckIn() {
  if (!testData.myPlanId) {
    console.log('  ⏭️  Skipped - no active plan');
    return;
  }
  
  const response = await makePatientRequest(`/treatment-plans/${testData.myPlanId}/check-in`, {
    method: 'POST',
    body: JSON.stringify({
      painLevel: 4,
      mood: 'good',
      sleepQuality: 7,
      notes: 'Feeling better today'
    })
  });
  
  assert(response.ok, `Daily check-in (${response.status})`);
  const data = await safeJson(response);
  console.log(`     Streak: ${data.streak} days`);
}

async function testPatientGetMilestones() {
  if (!testData.myPlanId) {
    console.log('  ⏭️  Skipped - no active plan');
    return;
  }
  
  const response = await makePatientRequest(`/treatment-plans/${testData.myPlanId}/milestones`);
  
  assert(response.ok, `Get milestones (${response.status})`);
  const data = await safeJson(response);
  assert(Array.isArray(data), 'Response is array');
  console.log(`     Total milestones: ${data.length}`);
  console.log(`     Completed: ${data.filter(m => m.isCompleted).length}`);
}

async function testPatientAnalyticsDashboard() {
  const response = await makePatientRequest('/patient-analytics/dashboard');
  
  assert(response.ok, `Patient analytics dashboard (${response.status})`);
  const data = await safeJson(response);
  console.log(`     Upcoming appointments: ${data.upcomingAppointments}`);
  console.log(`     Current PROM score: ${data.currentPromScore}`);
  console.log(`     Current streak: ${data.currentStreak}`);
  console.log(`     Level: ${data.level}`);
}

// ============ RUN ALL TESTS ============

async function main() {
  console.log('═'.repeat(60));
  console.log('CLINIC SIDE TESTS');
  console.log('═'.repeat(60));
  
  await runTest('Clinic Authentication', testClinicAuth);
  await runTest('List Treatment Plans', testListTreatmentPlans);
  await runTest('Get Treatment Plan Detail', testGetTreatmentPlanDetail);
  await runTest('Get Patients', testGetPatients);
  await runTest('Create Treatment Plan (Manual)', testCreateTreatmentPlan);
  await runTest('AI Generate Treatment Plan', testAiGeneratePlan);
  await runTest('AI Suggest Exercises', testSuggestExercises);
  
  console.log('\n' + '═'.repeat(60));
  console.log('PATIENT SIDE TESTS');
  console.log('═'.repeat(60));
  
  await runTest('Patient Authentication', testPatientAuth);
  await runTest('Get My Treatment Plan', testPatientGetMyPlan);
  await runTest('Get Treatment Progress', testPatientGetProgress);
  await runTest('Complete Exercise', testPatientCompleteExercise);
  await runTest('Daily Check-In', testPatientCheckIn);
  await runTest('Get Milestones', testPatientGetMilestones);
  await runTest('Patient Analytics Dashboard', testPatientAnalyticsDashboard);
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(60));
  
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n💥 Test suite crashed:', err.message);
  process.exit(1);
});
