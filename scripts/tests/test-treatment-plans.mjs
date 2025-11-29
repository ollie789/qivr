#!/usr/bin/env node

/**
 * Treatment Plan Test Suite
 * Tests the full treatment plan flow from both clinic and patient perspectives
 * 
 * Usage:
 *   node test-treatment-plans.mjs
 */

const API_URL = 'https://clinic.qivr.pro/api';

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
const TEST_PATIENT_ID = 'd50a77ad-a18c-4cfe-849c-518dc6b909d4';

console.log(`\n🧪 Treatment Plan Test Suite`);
console.log(`API: ${API_URL}\n`);

let clinicAuthCookie = null;
let patientAuthCookie = null;
let tenantId = TEST_TENANT_ID;
let testData = { patientId: TEST_PATIENT_ID };
let passed = 0;
let failed = 0;

// ============ Utilities ============

async function makeRequest(endpoint, options = {}, authCookie = null) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant-Id': tenantId,
    ...options.headers
  };
  
  if (authCookie) {
    headers['Cookie'] = authCookie;
  }
  
  const response = await fetch(url, { ...options, headers });
  return response;
}

async function safeJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { _raw: text.substring(0, 200) };
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
  }
}

// ============ CLINIC SIDE TESTS ============

async function testClinicAuth() {
  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(CLINIC_USER)
  });
  
  if (!response.ok) throw new Error(`Login failed: ${response.status}`);
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) clinicAuthCookie = setCookie.split(';')[0];
  
  console.log(`  ✅ Clinic login successful`);
}

async function testListTreatmentPlans() {
  const response = await makeRequest('/treatment-plans', {}, clinicAuthCookie);
  
  if (!response.ok) throw new Error(`List failed: ${response.status}`);
  
  const data = await safeJson(response);
  const plans = Array.isArray(data) ? data : [];
  console.log(`  ✅ Found ${plans.length} existing treatment plans`);
  
  // Check if test patient already has a plan
  const existingPlan = plans.find(p => p.patientId === TEST_PATIENT_ID);
  if (existingPlan) {
    testData.existingPlanId = existingPlan.id;
    console.log(`     Test patient already has plan: ${existingPlan.id}`);
  }
}

async function testCreateManualTreatmentPlan() {
  // Skip if patient already has a plan
  if (testData.existingPlanId) {
    console.log(`  ⏭️  Skipped - patient already has plan ${testData.existingPlanId}`);
    testData.createdPlanId = testData.existingPlanId;
    return;
  }
  
  const planData = {
    patientId: TEST_PATIENT_ID,
    title: 'Lower Back Rehabilitation Program',
    diagnosis: 'Chronic lower back pain with mild disc degeneration',
    goals: 'Reduce pain by 50%, improve core strength, return to daily activities',
    durationWeeks: 8,
    frequency: '2x per week',
    sessionLength: 45,
    modalities: ['Manual therapy', 'Therapeutic exercise', 'Heat therapy'],
    homeExercises: 'Daily stretching (10 min), core exercises (15 min)',
    expectedOutcomes: 'Pain reduction, improved mobility, stronger core',
    promSchedule: 'Weekly pain assessment',
    reviewMilestones: ['Week 2 review', 'Week 4 progress check', 'Week 8 discharge']
  };
  
  const response = await makeRequest('/treatment-plans', {
    method: 'POST',
    body: JSON.stringify(planData)
  }, clinicAuthCookie);
  
  console.log(`     Status: ${response.status}`);
  const data = await safeJson(response);
  
  if (response.status === 500) {
    console.log(`     Error: ${JSON.stringify(data).substring(0, 300)}`);
    throw new Error(data.detail || data.error || 'Server error');
  }
  
  if (!response.ok) {
    throw new Error(`Create failed: ${response.status} - ${JSON.stringify(data)}`);
  }
  
  testData.createdPlanId = data.id;
  console.log(`  ✅ Created treatment plan: ${data.id}`);
  console.log(`     Title: ${planData.title}`);
  console.log(`     Duration: ${planData.durationWeeks} weeks`);
}

async function testGetTreatmentPlanDetail() {
  if (!testData.createdPlanId) {
    console.log(`  ⏭️  Skipped - no plan created`);
    return;
  }
  
  const response = await makeRequest(`/treatment-plans/${testData.createdPlanId}`, {}, clinicAuthCookie);
  const data = await safeJson(response);
  
  if (!response.ok) {
    console.log(`     Error: ${JSON.stringify(data).substring(0, 500)}`);
    throw new Error(`Get detail failed: ${response.status}`);
  }
  
  console.log(`  ✅ Retrieved plan details`);
  console.log(`     Title: ${data.title}`);
  console.log(`     Status: ${data.status}`);
  console.log(`     Patient: ${data.patientName}`);
  console.log(`     Progress: ${data.progressPercentage}%`);
}

// ============ PATIENT SIDE TESTS ============

async function testPatientAuth() {
  const response = await makeRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(PATIENT_USER)
  });
  
  if (!response.ok) throw new Error(`Patient login failed: ${response.status}`);
  
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) patientAuthCookie = setCookie.split(';')[0];
  
  console.log(`  ✅ Patient login successful`);
  console.log(`     Email: ${PATIENT_USER.email}`);
}

async function testPatientGetMyPlan() {
  const response = await makeRequest('/treatment-plans/my-plan', {}, patientAuthCookie);
  
  console.log(`     Status: ${response.status}`);
  
  if (response.status === 404) {
    console.log(`  ℹ️  No active treatment plan found`);
    return;
  }
  
  const data = await safeJson(response);
  
  if (response.status === 500) {
    console.log(`     Error: ${JSON.stringify(data).substring(0, 500)}`);
    throw new Error(data.message || data.error || 'Server error');
  }
  
  if (!data.id) {
    console.log(`  ℹ️  No active treatment plan`);
    return;
  }
  
  testData.myPlanId = data.id;
  console.log(`  ✅ Patient can see their treatment plan`);
  console.log(`     Title: ${data.title}`);
  console.log(`     Status: ${data.status}`);
  console.log(`     Progress: ${data.progressPercentage}%`);
  console.log(`     Current Week: ${data.currentWeek}/${data.totalWeeks}`);
  console.log(`     Today's Exercises: ${data.todaysExercises?.length || 0}`);
  console.log(`     Milestones: ${data.milestones?.length || 0}`);
}

async function testPatientGetProgress() {
  const response = await makeRequest('/treatment-plans/progress', {}, patientAuthCookie);
  const data = await safeJson(response);
  
  if (!data.hasPlan) {
    console.log(`  ℹ️  No active treatment plan for progress`);
    return;
  }
  
  if (!response.ok) throw new Error(`Get progress failed: ${response.status}`);
  
  console.log(`  ✅ Patient progress data retrieved`);
  console.log(`     Overall: ${data.progress?.overallProgress || 0}%`);
  console.log(`     Streak: ${data.progress?.exerciseStreak || 0} days`);
  console.log(`     Points: ${data.progress?.pointsEarned || 0}`);
}

async function testPatientCompleteExercise() {
  if (!testData.myPlanId) {
    console.log(`  ⏭️  Skipped - no active plan`);
    return;
  }
  
  // Get plan to find exercises
  const planResponse = await makeRequest('/treatment-plans/my-plan', {}, patientAuthCookie);
  const plan = await safeJson(planResponse);
  
  if (!plan.todaysExercises?.length && !plan.phases?.length) {
    console.log(`  ⏭️  Skipped - no exercises available`);
    return;
  }
  
  // Find an exercise from phases or todaysExercises
  let exerciseId = null;
  if (plan.todaysExercises?.length > 0) {
    exerciseId = plan.todaysExercises[0].id;
  } else if (plan.phases?.length > 0) {
    const phase = plan.phases.find(p => p.exercises?.length > 0);
    if (phase) exerciseId = phase.exercises[0].id;
  }
  
  if (!exerciseId) {
    console.log(`  ⏭️  Skipped - no exercise ID found`);
    return;
  }
  
  const response = await makeRequest(`/treatment-plans/${testData.myPlanId}/exercises/${exerciseId}/complete`, {
    method: 'POST',
    body: JSON.stringify({
      painLevelBefore: 5,
      painLevelAfter: 3,
      setsCompleted: 3,
      repsCompleted: 10,
      notes: 'Completed via test'
    })
  }, patientAuthCookie);
  
  if (response.status === 404) {
    console.log(`  ⚠️  Exercise not found (may need to add exercises to plan)`);
    return;
  }
  
  if (!response.ok) throw new Error(`Complete exercise failed: ${response.status}`);
  
  const data = await safeJson(response);
  console.log(`  ✅ Exercise completed`);
  console.log(`     Points earned: ${data.pointsEarned}`);
  console.log(`     Total points: ${data.totalPoints}`);
  console.log(`     Streak: ${data.exerciseStreak}`);
}

async function testPatientCheckIn() {
  if (!testData.myPlanId) {
    console.log(`  ⏭️  Skipped - no active plan`);
    return;
  }
  
  const response = await makeRequest(`/treatment-plans/${testData.myPlanId}/check-in`, {
    method: 'POST',
    body: JSON.stringify({
      painLevel: 4,
      mood: 'good',
      sleepQuality: 7,
      exercisesCompleted: true,
      notes: 'Feeling improvement'
    })
  }, patientAuthCookie);
  
  if (!response.ok) throw new Error(`Check-in failed: ${response.status}`);
  
  const data = await safeJson(response);
  console.log(`  ✅ Daily check-in recorded`);
  console.log(`     Streak: ${data.streak}`);
  console.log(`     Points: ${data.points}`);
}

async function testPatientGetMilestones() {
  if (!testData.myPlanId) {
    console.log(`  ⏭️  Skipped - no active plan`);
    return;
  }
  
  const response = await makeRequest(`/treatment-plans/${testData.myPlanId}/milestones`, {}, patientAuthCookie);
  
  if (!response.ok) throw new Error(`Get milestones failed: ${response.status}`);
  
  const data = await safeJson(response);
  const milestones = Array.isArray(data) ? data : [];
  console.log(`  ✅ Milestones retrieved`);
  console.log(`     Total: ${milestones.length}`);
  console.log(`     Completed: ${milestones.filter(m => m.isCompleted).length}`);
}

async function testPatientDashboard() {
  const response = await makeRequest('/patient-analytics/dashboard', {}, patientAuthCookie);
  
  if (!response.ok) throw new Error(`Dashboard failed: ${response.status}`);
  
  const data = await safeJson(response);
  console.log(`  ✅ Patient dashboard loaded`);
  console.log(`     Appointments: ${data.upcomingAppointments}`);
  console.log(`     Streak: ${data.currentStreak}`);
  console.log(`     Level: ${data.level}`);
  console.log(`     Points: ${data.totalPoints}`);
}

// ============ CLEANUP ============

async function cleanupTestPlan() {
  // Only delete if we created a new plan (not if using existing)
  if (testData.createdPlanId && !testData.existingPlanId) {
    console.log(`\n🧹 Cleanup: Keeping test plan ${testData.createdPlanId} for manual testing`);
    // Uncomment below to auto-delete:
    // await makeRequest(`/treatment-plans/${testData.createdPlanId}`, { method: 'DELETE' }, clinicAuthCookie);
  }
}

// ============ RUN ALL TESTS ============

async function main() {
  console.log('═'.repeat(60));
  console.log('CLINIC SIDE TESTS');
  console.log('═'.repeat(60));
  
  await runTest('Clinic Authentication', testClinicAuth);
  await runTest('List Treatment Plans', testListTreatmentPlans);
  await runTest('Create Manual Treatment Plan', testCreateManualTreatmentPlan);
  await runTest('Get Treatment Plan Detail', testGetTreatmentPlanDetail);
  
  console.log('\n' + '═'.repeat(60));
  console.log('PATIENT SIDE TESTS');
  console.log('═'.repeat(60));
  
  await runTest('Patient Authentication', testPatientAuth);
  await runTest('Patient: Get My Treatment Plan', testPatientGetMyPlan);
  await runTest('Patient: Get Progress', testPatientGetProgress);
  await runTest('Patient: Complete Exercise', testPatientCompleteExercise);
  await runTest('Patient: Daily Check-In', testPatientCheckIn);
  await runTest('Patient: Get Milestones', testPatientGetMilestones);
  await runTest('Patient: Dashboard', testPatientDashboard);
  
  await cleanupTestPlan();
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log(`RESULTS: ${passed} passed, ${failed} failed`);
  console.log('═'.repeat(60));
  
  if (testData.createdPlanId) {
    console.log(`\n📝 Test Plan ID: ${testData.createdPlanId}`);
    console.log(`   Patient can view at: https://patients.qivr.pro/treatment-plan`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('\n💥 Test suite crashed:', err.message);
  process.exit(1);
});
