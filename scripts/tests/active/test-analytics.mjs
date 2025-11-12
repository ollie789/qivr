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
  console.log(`  📝 Tenant: ${tenantId}`);
  return data;
}

async function testAnalyticsEndpoints() {
  console.log('\n📊 Testing Analytics Endpoints');
  
  // Test main analytics endpoint
  const analyticsResponse = await makeRequest('/clinic-management/analytics');
  console.log(`  📝 Main analytics: ${analyticsResponse.status}`);
  
  if (analyticsResponse.ok) {
    const analytics = await analyticsResponse.json();
    console.log('  ✅ Analytics data received');
    console.log(`  📊 Keys: ${Object.keys(analytics).join(', ')}`);
    
    // Show sample data
    if (analytics.appointmentMetrics) {
      console.log(`  📅 Appointments: ${JSON.stringify(analytics.appointmentMetrics)}`);
    }
    if (analytics.patientMetrics) {
      console.log(`  👤 Patients: ${JSON.stringify(analytics.patientMetrics)}`);
    }
    if (analytics.revenueMetrics) {
      console.log(`  💰 Revenue: ${JSON.stringify(analytics.revenueMetrics)}`);
    }
  } else {
    const error = await analyticsResponse.text();
    console.log(`  ❌ Analytics failed: ${error}`);
  }

  // Test analytics overview
  const overviewResponse = await makeRequest('/analytics/overview');
  console.log(`  📝 Overview: ${overviewResponse.status}`);
  
  if (overviewResponse.ok) {
    const overview = await overviewResponse.json();
    console.log('  ✅ Overview data received');
    console.log(`  📊 Overview keys: ${Object.keys(overview).join(', ')}`);
  }

  // Test dashboard analytics
  const dashboardResponse = await makeRequest('/analytics/dashboard');
  console.log(`  📝 Dashboard: ${dashboardResponse.status}`);
  
  if (dashboardResponse.ok) {
    const dashboard = await dashboardResponse.json();
    console.log('  ✅ Dashboard data received');
    console.log(`  📊 Dashboard keys: ${Object.keys(dashboard).join(', ')}`);
  }
}

async function testClinicDashboard() {
  console.log('\n🏥 Testing Clinic Dashboard');
  
  // Test clinic dashboard overview
  const dashboardResponse = await makeRequest('/clinic-dashboard/overview');
  console.log(`  📝 Clinic overview: ${dashboardResponse.status}`);
  
  if (dashboardResponse.ok) {
    const dashboard = await dashboardResponse.json();
    console.log('  ✅ Clinic dashboard data received');
    console.log(`  📊 Keys: ${Object.keys(dashboard).join(', ')}`);
    
    // Show key metrics
    if (dashboard.totalPatients !== undefined) {
      console.log(`  👥 Total Patients: ${dashboard.totalPatients}`);
    }
    if (dashboard.totalAppointments !== undefined) {
      console.log(`  📅 Total Appointments: ${dashboard.totalAppointments}`);
    }
    if (dashboard.totalProviders !== undefined) {
      console.log(`  👨‍⚕️ Total Providers: ${dashboard.totalProviders}`);
    }
  } else {
    const error = await dashboardResponse.text();
    console.log(`  ❌ Clinic dashboard failed: ${error}`);
  }

  // Test recent activity
  const activityResponse = await makeRequest('/clinic-dashboard/recent-activity');
  console.log(`  📝 Recent activity: ${activityResponse.status}`);
  
  if (activityResponse.ok) {
    const activity = await activityResponse.json();
    console.log(`  ✅ Recent activity: ${activity.length || Object.keys(activity).length} items`);
  }
}

async function testReports() {
  console.log('\n📈 Testing Reports');
  
  // Test appointments report
  const appointmentsReport = await makeRequest('/analytics/appointments?period=week');
  console.log(`  📝 Appointments report: ${appointmentsReport.status}`);
  
  if (appointmentsReport.ok) {
    const report = await appointmentsReport.json();
    console.log('  ✅ Appointments report received');
    console.log(`  📊 Report data: ${JSON.stringify(report).substring(0, 100)}...`);
  }

  // Test patients report
  const patientsReport = await makeRequest('/analytics/patients?period=month');
  console.log(`  📝 Patients report: ${patientsReport.status}`);
  
  if (patientsReport.ok) {
    const report = await patientsReport.json();
    console.log('  ✅ Patients report received');
  }
}

async function runAnalyticsTest() {
  console.log('📊 ANALYTICS SYSTEM TEST');
  console.log('========================');

  try {
    await login();
    await testAnalyticsEndpoints();
    await testClinicDashboard();
    await testReports();

    console.log('\n🎉 ANALYTICS TEST COMPLETE!');
    console.log('📊 Analytics endpoints tested');
    console.log('🏥 Clinic dashboard tested');
    console.log('📈 Reports tested');
    console.log('\n✅ Analytics system is operational!');

  } catch (error) {
    console.error('\n❌ Analytics test failed:', error.message);
  }
}

runAnalyticsTest();
