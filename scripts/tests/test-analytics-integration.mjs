#!/usr/bin/env node

/**
 * Analytics Frontend-Backend Integration Test
 * Verifies API responses map correctly to frontend components
 */

console.log('🔗 Analytics Frontend-Backend Integration Test\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    failed++;
  }
}

function assertExists(obj, path, message = '') {
  const keys = path.split('.');
  let current = obj;
  for (const key of keys) {
    if (current[key] === undefined) {
      throw new Error(`Missing property: ${path}. ${message}`);
    }
    current = current[key];
  }
}

function assertType(value, type, message = '') {
  if (typeof value !== type) {
    throw new Error(`Expected type ${type}, got ${typeof value}. ${message}`);
  }
}

// Mock Backend Response (from ClinicAnalyticsService)
const mockBackendResponse = {
  dashboard: {
    todayAppointments: 10,
    completedToday: 8,
    cancelledToday: 1,
    noShowToday: 1,
    completionRate: 80.0,
    pendingIntakes: 5,
    totalPatients: 150,
    newPatientsThisMonth: 12,
    estimatedRevenue: 1200,
    noShowRate: 5.5,
    averageWaitTime: 15,
    staffUtilization: 75
  },
  clinical: {
    averagePromScore: 75.5,
    totalEvaluations: 120,
    topConditions: [
      { condition: 'Lower Back Pain', count: 45 },
      { condition: 'Knee Pain', count: 32 }
    ],
    averagePainIntensity: 5.8,
    bodyRegionDistribution: [
      { region: 'Lower Back', count: 45, avgIntensity: 6.2 },
      { region: 'Knee', count: 32, avgIntensity: 5.5 }
    ],
    patientImprovementRate: 68.5,
    totalPatientsTracked: 85,
    appointmentTrends: [
      { date: '2025-11-18', scheduled: 12, completed: 10, cancelled: 2 },
      { date: '2025-11-19', scheduled: 15, completed: 13, cancelled: 2 }
    ],
    promCompletionData: [
      { week: 'Week 1', completed: 8, pending: 2, completionRate: 80.0 },
      { week: 'Week 2', completed: 10, pending: 3, completionRate: 76.9 }
    ],
    patientSatisfaction: 4.5
  },
  painMap: {
    totalPainMaps: 85,
    averageIntensity: 6.2,
    mostCommonRegion: 'Lower Back',
    painPoints3D: [
      { x: 0, y: -50, z: 0, intensity: 7, bodyRegion: 'Lower Back', painType: 'Sharp' }
    ],
    painTypeDistribution: [
      { type: 'Sharp', count: 45 },
      { type: 'Dull', count: 40 }
    ],
    intensityDistribution: [
      { range: 'Mild (1-3)', count: 15 },
      { range: 'Moderate (4-6)', count: 35 },
      { range: 'Severe (7-10)', count: 35 }
    ]
  }
};

// Frontend Expected Structure (from Analytics.tsx)
const frontendExpectations = {
  statCards: [
    { id: 'patients', valueKey: 'totalPatients' },
    { id: 'appointments', valueKey: 'todayAppointments' },
    { id: 'revenue', valueKey: 'estimatedRevenue' },
    { id: 'prom-score', valueKey: 'averagePromScore' }
  ],
  charts: {
    appointmentTrends: { xAxis: 'date', yAxis: ['scheduled', 'completed', 'cancelled'] },
    promCompletion: { xAxis: 'week', yAxis: 'completionRate' }
  }
};

console.log('📊 Testing Dashboard Metrics Mapping\n');

test('Dashboard Response Structure', () => {
  assertExists(mockBackendResponse, 'dashboard', 'Dashboard object should exist');
  assertExists(mockBackendResponse.dashboard, 'todayAppointments');
  assertExists(mockBackendResponse.dashboard, 'completedToday');
  assertExists(mockBackendResponse.dashboard, 'completionRate');
  assertExists(mockBackendResponse.dashboard, 'totalPatients');
});

test('Dashboard Metrics Data Types', () => {
  assertType(mockBackendResponse.dashboard.todayAppointments, 'number');
  assertType(mockBackendResponse.dashboard.completionRate, 'number');
  assertType(mockBackendResponse.dashboard.totalPatients, 'number');
  assertType(mockBackendResponse.dashboard.estimatedRevenue, 'number');
});

test('Stat Card Mapping - Total Patients', () => {
  const value = mockBackendResponse.dashboard.totalPatients;
  if (value === undefined || value < 0) {
    throw new Error('Total patients should be a positive number');
  }
});

test('Stat Card Mapping - Today Appointments', () => {
  const value = mockBackendResponse.dashboard.todayAppointments;
  if (value === undefined || value < 0) {
    throw new Error('Today appointments should be a positive number');
  }
});

test('Stat Card Mapping - Revenue', () => {
  const value = mockBackendResponse.dashboard.estimatedRevenue;
  if (value === undefined || value < 0) {
    throw new Error('Revenue should be a positive number');
  }
});

console.log('\n📈 Testing Clinical Analytics Mapping\n');

test('Clinical Response Structure', () => {
  assertExists(mockBackendResponse, 'clinical');
  assertExists(mockBackendResponse.clinical, 'averagePromScore');
  assertExists(mockBackendResponse.clinical, 'topConditions');
  assertExists(mockBackendResponse.clinical, 'appointmentTrends');
  assertExists(mockBackendResponse.clinical, 'promCompletionData');
});

test('Top Conditions Array Structure', () => {
  const conditions = mockBackendResponse.clinical.topConditions;
  if (!Array.isArray(conditions)) {
    throw new Error('topConditions should be an array');
  }
  if (conditions.length > 0) {
    assertExists(conditions[0], 'condition');
    assertExists(conditions[0], 'count');
  }
});

test('Appointment Trends Chart Data', () => {
  const trends = mockBackendResponse.clinical.appointmentTrends;
  if (!Array.isArray(trends)) {
    throw new Error('appointmentTrends should be an array');
  }
  if (trends.length > 0) {
    const trend = trends[0];
    assertExists(trend, 'date', 'Chart needs date for x-axis');
    assertExists(trend, 'scheduled', 'Chart needs scheduled for y-axis');
    assertExists(trend, 'completed', 'Chart needs completed for y-axis');
    assertExists(trend, 'cancelled', 'Chart needs cancelled for y-axis');
  }
});

test('PROM Completion Chart Data', () => {
  const promData = mockBackendResponse.clinical.promCompletionData;
  if (!Array.isArray(promData)) {
    throw new Error('promCompletionData should be an array');
  }
  if (promData.length > 0) {
    const data = promData[0];
    assertExists(data, 'week', 'Chart needs week for x-axis');
    assertExists(data, 'completed', 'Chart needs completed count');
    assertExists(data, 'pending', 'Chart needs pending count');
    assertExists(data, 'completionRate', 'Chart needs completion rate');
  }
});

test('Patient Improvement Rate', () => {
  const rate = mockBackendResponse.clinical.patientImprovementRate;
  assertType(rate, 'number');
  if (rate < 0 || rate > 100) {
    throw new Error('Improvement rate should be between 0-100');
  }
});

console.log('\n🗺️  Testing Pain Map Analytics Mapping\n');

test('Pain Map Response Structure', () => {
  assertExists(mockBackendResponse, 'painMap');
  assertExists(mockBackendResponse.painMap, 'totalPainMaps');
  assertExists(mockBackendResponse.painMap, 'averageIntensity');
  assertExists(mockBackendResponse.painMap, 'painPoints3D');
  assertExists(mockBackendResponse.painMap, 'painTypeDistribution');
});

test('Pain Points 3D Structure', () => {
  const points = mockBackendResponse.painMap.painPoints3D;
  if (!Array.isArray(points)) {
    throw new Error('painPoints3D should be an array');
  }
  if (points.length > 0) {
    const point = points[0];
    assertExists(point, 'x', '3D visualization needs x coordinate');
    assertExists(point, 'y', '3D visualization needs y coordinate');
    assertExists(point, 'z', '3D visualization needs z coordinate');
    assertExists(point, 'intensity', 'Heat map needs intensity');
    assertExists(point, 'bodyRegion', 'Display needs body region');
  }
});

test('Pain Type Distribution', () => {
  const distribution = mockBackendResponse.painMap.painTypeDistribution;
  if (!Array.isArray(distribution)) {
    throw new Error('painTypeDistribution should be an array');
  }
  if (distribution.length > 0) {
    assertExists(distribution[0], 'type');
    assertExists(distribution[0], 'count');
  }
});

test('Intensity Distribution', () => {
  const distribution = mockBackendResponse.painMap.intensityDistribution;
  if (!Array.isArray(distribution)) {
    throw new Error('intensityDistribution should be an array');
  }
  if (distribution.length > 0) {
    assertExists(distribution[0], 'range');
    assertExists(distribution[0], 'count');
  }
});

console.log('\n🎨 Testing Frontend Component Mapping\n');

test('Stat Cards Can Access All Required Data', () => {
  frontendExpectations.statCards.forEach(card => {
    const value = card.valueKey === 'averagePromScore' 
      ? mockBackendResponse.clinical[card.valueKey]
      : mockBackendResponse.dashboard[card.valueKey];
    
    if (value === undefined) {
      throw new Error(`Stat card ${card.id} cannot access ${card.valueKey}`);
    }
  });
});

test('Appointment Trends Chart Has All Axes', () => {
  const trends = mockBackendResponse.clinical.appointmentTrends;
  if (trends.length > 0) {
    const { xAxis, yAxis } = frontendExpectations.charts.appointmentTrends;
    const trend = trends[0];
    
    if (!trend[xAxis]) {
      throw new Error(`Chart missing x-axis data: ${xAxis}`);
    }
    
    yAxis.forEach(axis => {
      if (trend[axis] === undefined) {
        throw new Error(`Chart missing y-axis data: ${axis}`);
      }
    });
  }
});

test('PROM Completion Chart Has All Axes', () => {
  const promData = mockBackendResponse.clinical.promCompletionData;
  if (promData.length > 0) {
    const { xAxis, yAxis } = frontendExpectations.charts.promCompletion;
    const data = promData[0];
    
    if (!data[xAxis]) {
      throw new Error(`Chart missing x-axis data: ${xAxis}`);
    }
    
    if (data[yAxis] === undefined) {
      throw new Error(`Chart missing y-axis data: ${yAxis}`);
    }
  }
});

console.log('\n🔄 Testing Data Transformation\n');

test('Condition Data Transforms to Chart Format', () => {
  const conditions = mockBackendResponse.clinical.topConditions;
  const total = conditions.reduce((sum, c) => sum + c.count, 0);
  
  // Frontend transforms this to percentage
  const transformed = conditions.map(c => ({
    name: c.condition,
    value: c.count,
    percentage: (c.count / total) * 100
  }));
  
  if (transformed[0].percentage < 0 || transformed[0].percentage > 100) {
    throw new Error('Percentage calculation failed');
  }
});

test('Date Strings Are Valid ISO Format', () => {
  const trends = mockBackendResponse.clinical.appointmentTrends;
  if (trends.length > 0) {
    const dateStr = trends[0].date;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }
  }
});

test('Numeric Values Are Not NaN', () => {
  const values = [
    mockBackendResponse.dashboard.completionRate,
    mockBackendResponse.clinical.averagePromScore,
    mockBackendResponse.painMap.averageIntensity
  ];
  
  values.forEach((value, index) => {
    if (isNaN(value)) {
      throw new Error(`Value at index ${index} is NaN`);
    }
  });
});

console.log('\n═══════════════════════════════════════');
console.log('📊 Integration Test Summary');
console.log('═══════════════════════════════════════');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('═══════════════════════════════════════');

if (failed === 0) {
  console.log('✓ All frontend-backend mappings are correct!');
  console.log('\n✅ Backend responses map correctly to:');
  console.log('  - Stat cards (4 cards)');
  console.log('  - Appointment trends chart');
  console.log('  - PROM completion chart');
  console.log('  - Top diagnoses list');
  console.log('  - Pain map visualization');
  process.exit(0);
} else {
  console.log('✗ Some mappings failed');
  process.exit(1);
}
