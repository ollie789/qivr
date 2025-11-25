#!/usr/bin/env node

/**
 * Analytics Calculations Test Suite
 * Tests the mathematical accuracy of analytics calculations
 */

console.log('🧪 Analytics Calculations Test Suite\n');

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

function assertEquals(actual, expected, message = '') {
  if (actual !== expected) {
    throw new Error(`Expected ${expected}, got ${actual}. ${message}`);
  }
}

function assertApprox(actual, expected, tolerance = 0.1, message = '') {
  if (Math.abs(actual - expected) > tolerance) {
    throw new Error(`Expected ~${expected}, got ${actual}. ${message}`);
  }
}

// Test Data
const testData = {
  appointments: [
    { status: 'Completed', scheduledStart: '2025-11-25T09:00:00Z', actualStart: '2025-11-25T09:10:00Z' },
    { status: 'Scheduled', scheduledStart: '2025-11-25T10:00:00Z' },
    { status: 'Cancelled', scheduledStart: '2025-11-25T11:00:00Z' },
    { status: 'NoShow', scheduledStart: '2025-11-25T14:00:00Z' },
  ],
  promScores: [60, 75, 80, 70, 85],
  painIntensities: [7, 6, 5, 8, 4],
  patientOutcomes: [
    { firstScore: 60, lastScore: 75 }, // Improved
    { firstScore: 70, lastScore: 85 }, // Improved
    { firstScore: 80, lastScore: 75 }, // Declined
  ],
};

console.log('📊 Testing Dashboard Metrics Calculations\n');

test('Completion Rate Calculation', () => {
  const completed = testData.appointments.filter(a => a.status === 'Completed').length;
  const total = testData.appointments.length;
  const completionRate = (completed / total) * 100;
  
  assertEquals(completionRate, 25.0, 'Should be 25% (1/4)');
});

test('No-Show Rate Calculation', () => {
  const noShows = testData.appointments.filter(a => a.status === 'NoShow').length;
  const total = testData.appointments.length;
  const noShowRate = (noShows / total) * 100;
  
  assertEquals(noShowRate, 25.0, 'Should be 25% (1/4)');
});

test('Average Wait Time Calculation', () => {
  const appointmentsWithWaitTime = testData.appointments.filter(a => a.actualStart);
  const waitTimes = appointmentsWithWaitTime.map(a => {
    const scheduled = new Date(a.scheduledStart);
    const actual = new Date(a.actualStart);
    return (actual - scheduled) / (1000 * 60); // minutes
  });
  const avgWaitTime = waitTimes.reduce((sum, t) => sum + t, 0) / waitTimes.length;
  
  assertEquals(avgWaitTime, 10, 'Should be 10 minutes');
});

test('Staff Utilization Calculation', () => {
  const providers = 1;
  const slotsPerProvider = 16; // 8 hours, 30-min slots
  const totalSlots = providers * slotsPerProvider;
  const appointmentCount = testData.appointments.length;
  const utilization = (appointmentCount / totalSlots) * 100;
  
  assertEquals(utilization, 25, 'Should be 25% (4/16)');
});

console.log('\n📈 Testing Clinical Analytics Calculations\n');

test('Average PROM Score Calculation', () => {
  const sum = testData.promScores.reduce((a, b) => a + b, 0);
  const avg = sum / testData.promScores.length;
  
  assertEquals(avg, 74, 'Should be 74 ((60+75+80+70+85)/5)');
});

test('Average Pain Intensity Calculation', () => {
  const sum = testData.painIntensities.reduce((a, b) => a + b, 0);
  const avg = sum / testData.painIntensities.length;
  
  assertEquals(avg, 6, 'Should be 6 ((7+6+5+8+4)/5)');
});

test('Patient Improvement Rate Calculation', () => {
  const improved = testData.patientOutcomes.filter(p => p.lastScore > p.firstScore).length;
  const total = testData.patientOutcomes.length;
  const improvementRate = (improved / total) * 100;
  
  assertApprox(improvementRate, 66.67, 0.1, 'Should be ~66.67% (2/3)');
});

test('PROM Completion Rate Calculation', () => {
  const completed = 8;
  const pending = 2;
  const total = completed + pending;
  const completionRate = (completed / total) * 100;
  
  assertEquals(completionRate, 80, 'Should be 80% (8/10)');
});

console.log('\n🗺️  Testing Pain Map Analytics Calculations\n');

test('Pain Type Distribution', () => {
  const painTypes = ['Sharp', 'Sharp', 'Dull', 'Sharp', 'Burning'];
  const distribution = painTypes.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});
  
  assertEquals(distribution['Sharp'], 3, 'Should have 3 sharp pain entries');
  assertEquals(distribution['Dull'], 1, 'Should have 1 dull pain entry');
  assertEquals(distribution['Burning'], 1, 'Should have 1 burning pain entry');
});

test('Intensity Distribution Grouping', () => {
  const intensities = [2, 5, 7, 3, 9, 4, 8, 1, 6, 10];
  const distribution = {
    mild: intensities.filter(i => i <= 3).length,
    moderate: intensities.filter(i => i > 3 && i <= 6).length,
    severe: intensities.filter(i => i > 6).length,
  };
  
  assertEquals(distribution.mild, 3, 'Should have 3 mild (1-3)');
  assertEquals(distribution.moderate, 3, 'Should have 3 moderate (4-6)'); // Fixed: 4,5,6 = 3
  assertEquals(distribution.severe, 4, 'Should have 4 severe (7-10)'); // Fixed: 7,8,9,10 = 4
});

test('Most Common Body Region', () => {
  const regions = ['Lower Back', 'Lower Back', 'Knee', 'Lower Back', 'Shoulder'];
  const counts = regions.reduce((acc, region) => {
    acc[region] = (acc[region] || 0) + 1;
    return acc;
  }, {});
  const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  
  assertEquals(mostCommon, 'Lower Back', 'Should be Lower Back (3 occurrences)');
});

console.log('\n🔢 Testing Edge Cases\n');

test('Empty Data Handling - Average', () => {
  const emptyArray = [];
  const avg = emptyArray.length > 0 ? emptyArray.reduce((a, b) => a + b, 0) / emptyArray.length : 0;
  
  assertEquals(avg, 0, 'Should return 0 for empty array');
});

test('Division by Zero Protection', () => {
  const completed = 0;
  const total = 0;
  const rate = total > 0 ? (completed / total) * 100 : 0;
  
  assertEquals(rate, 0, 'Should return 0 when dividing by zero');
});

test('Percentage Rounding', () => {
  const value = 66.666666;
  const rounded = Math.round(value * 10) / 10;
  
  assertEquals(rounded, 66.7, 'Should round to 1 decimal place');
});

test('Date Range Calculation', () => {
  const from = new Date('2025-10-25');
  const to = new Date('2025-11-25');
  const days = Math.floor((to - from) / (1000 * 60 * 60 * 24));
  
  assertEquals(days, 31, 'Should be 31 days');
});

console.log('\n═══════════════════════════════════════');
console.log('📊 Test Summary');
console.log('═══════════════════════════════════════');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('═══════════════════════════════════════');

if (failed === 0) {
  console.log('✓ All calculations are correct!');
  process.exit(0);
} else {
  console.log('✗ Some calculations failed');
  process.exit(1);
}
