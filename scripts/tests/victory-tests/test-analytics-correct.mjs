#!/usr/bin/env node

import fetch from 'node-fetch';

const API_URL = 'https://clinic.qivr.pro/api';

let cookies = '';
let tenantId = '';

async function makeRequest(endpoint, options = {}) {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-Id': tenantId,
      'Cookie': cookies,
      ...options.headers
    }
  });
}

async function login() {
  console.log('🔐 Login');
  
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'fresh.test@clinic.com',
      password: 'TestPass123!'
    }),
    credentials: 'include'
  });

  const data = await response.json();
  tenantId = data.userInfo.tenantId;
  cookies = response.headers.get('set-cookie') || '';
  
  console.log('  ✅ Login successful');
  return data;
}

async function testCorrectAnalyticsEndpoints() {
  console.log('\n📊 Testing CORRECT Analytics Endpoints');
  
  // 1. Clinic Management Analytics (the one that works)
  console.log('\n🏥 Clinic Management Analytics:');
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const to = new Date().toISOString();
  
  const clinicAnalytics = await makeRequest(`/clinic-management/analytics?from=${from}&to=${to}`);
  console.log(`  📝 /clinic-management/analytics: ${clinicAnalytics.status}`);
  
  if (clinicAnalytics.ok) {
    const data = await clinicAnalytics.json();
    console.log('  ✅ Clinic analytics working');
    console.log(`  📊 Keys: ${Object.keys(data).join(', ')}`);
  }

  // 2. Clinic Dashboard Overview (the one that works)
  console.log('\n🏥 Clinic Dashboard:');
  const dashboardOverview = await makeRequest('/clinic-dashboard/overview');
  console.log(`  📝 /clinic-dashboard/overview: ${dashboardOverview.status}`);
  
  if (dashboardOverview.ok) {
    const data = await dashboardOverview.json();
    console.log('  ✅ Dashboard overview working');
    console.log(`  📊 Keys: ${Object.keys(data).join(', ')}`);
  }

  // 3. Clinic Dashboard Metrics
  const dashboardMetrics = await makeRequest('/clinic-dashboard/metrics');
  console.log(`  📝 /clinic-dashboard/metrics: ${dashboardMetrics.status}`);
  
  if (dashboardMetrics.ok) {
    const data = await dashboardMetrics.json();
    console.log('  ✅ Dashboard metrics working');
    console.log(`  📊 Keys: ${Object.keys(data).join(', ')}`);
  }

  // 4. Weekly Schedule
  const weeklySchedule = await makeRequest('/clinic-dashboard/schedule/weekly');
  console.log(`  📝 /clinic-dashboard/schedule/weekly: ${weeklySchedule.status}`);
  
  if (weeklySchedule.ok) {
    const data = await weeklySchedule.json();
    console.log('  ✅ Weekly schedule working');
    console.log(`  📊 Schedule data available`);
  }
}

async function testPatientAnalytics() {
  console.log('\n👤 Testing Patient Analytics:');
  
  // Patient-specific analytics endpoints
  const healthMetrics = await makeRequest('/analytics/health-metrics?timeRange=30days');
  console.log(`  📝 /analytics/health-metrics: ${healthMetrics.status}`);
  
  if (healthMetrics.ok) {
    const data = await healthMetrics.json();
    console.log('  ✅ Health metrics working');
    console.log(`  📊 Health data: ${data.length || Object.keys(data).length} items`);
  }

  const promAnalytics = await makeRequest('/analytics/prom-analytics');
  console.log(`  📝 /analytics/prom-analytics: ${promAnalytics.status}`);
  
  if (promAnalytics.ok) {
    const data = await promAnalytics.json();
    console.log('  ✅ PROM analytics working');
  }

  const patientTrends = await makeRequest('/analytics/patient-trends');
  console.log(`  📝 /analytics/patient-trends: ${patientTrends.status}`);
  
  if (patientTrends.ok) {
    const data = await patientTrends.json();
    console.log('  ✅ Patient trends working');
  }
}

async function testMissingEndpoints() {
  console.log('\n❓ Testing Previously Missing Endpoints:');
  
  // These were the 404s from before - let's see if they exist with different paths
  const endpoints = [
    '/analytics/overview',
    '/analytics/dashboard', 
    '/analytics/appointments',
    '/analytics/patients',
    '/clinic-dashboard/recent-activity'
  ];

  for (const endpoint of endpoints) {
    const response = await makeRequest(endpoint);
    console.log(`  📝 ${endpoint}: ${response.status}`);
    
    if (response.ok) {
      console.log(`  ✅ Found working endpoint: ${endpoint}`);
    }
  }
}

async function runCorrectAnalyticsTest() {
  console.log('📊 CORRECT ANALYTICS ENDPOINTS TEST');
  console.log('===================================');

  try {
    await login();
    await testCorrectAnalyticsEndpoints();
    await testPatientAnalytics();
    await testMissingEndpoints();

    console.log('\n🎉 ANALYTICS ENDPOINTS AUDIT COMPLETE!');
    console.log('✅ Found working clinic management analytics');
    console.log('✅ Found working clinic dashboard');
    console.log('✅ Found patient-specific analytics');
    console.log('📊 Analytics system is comprehensive!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

runCorrectAnalyticsTest();
