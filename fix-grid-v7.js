#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const files = [
  'apps/patient-portal/src/components/intake/PainMapSelector.tsx',
  'apps/patient-portal/src/features/analytics/components/AnalyticsPage.tsx',
  'apps/patient-portal/src/features/appointments/components/AppointmentsPage.tsx',
  'apps/patient-portal/src/features/dashboard/components/DashboardPage.tsx',
  'apps/patient-portal/src/features/documents/components/DocumentsPage.tsx',
  'apps/patient-portal/src/features/medical-records/components/MedicalRecordsPage.tsx',
  'apps/patient-portal/src/features/profile/components/ProfilePage.tsx',
  'apps/patient-portal/src/features/proms/components/PromsPage.tsx',
  'apps/patient-portal/src/pages/BookAppointment.tsx',
  'apps/patient-portal/src/pages/EvaluationDetail.tsx',
  'apps/patient-portal/src/pages/Evaluations.tsx',
  'apps/clinic-dashboard/src/components/documents/OCRResultsViewer.tsx',
  'apps/clinic-dashboard/src/components/intake/PainMapSelector.tsx',
  'apps/clinic-dashboard/src/components/messaging/PROMSender.tsx',
  'apps/clinic-dashboard/src/features/intake/components/EvaluationViewer.tsx',
  'apps/clinic-dashboard/src/features/proms/components/PromBuilder.tsx',
  'apps/clinic-dashboard/src/pages/Analytics.tsx',
  'apps/clinic-dashboard/src/pages/Appointments.tsx',
  'apps/clinic-dashboard/src/pages/ClinicRegistration.tsx',
  'apps/clinic-dashboard/src/pages/Dashboard.tsx',
  'apps/clinic-dashboard/src/pages/Documents.tsx',
  'apps/clinic-dashboard/src/pages/DocumentUpload.tsx',
  'apps/clinic-dashboard/src/pages/IntakeManagement.tsx',
  'apps/clinic-dashboard/src/pages/MedicalRecords.tsx',
  'apps/clinic-dashboard/src/pages/PROM.tsx',
  'apps/clinic-dashboard/src/pages/Providers.tsx',
  'apps/clinic-dashboard/src/pages/Settings.tsx',
  'apps/clinic-dashboard/src/pages/Signup.tsx',
  'apps/clinic-dashboard/src/pages/ThemeShowcase.tsx',
];

function convertGridProps(content) {
  // Pattern: item xs={12} md={6} etc
  content = content.replace(
    /<Grid\s+item\s+((?:xs|sm|md|lg|xl)(?:=\{?\d+\}?)?\s*)+/g,
    (match) => {
      // Extract just "item xs={12} md={6}" part
      const propsStr = match.replace('<Grid ', '').trim();
      
      // Check if it's just "item xs" without a value (flex grow)
      if (/^item\s+xs\s*$/.test(propsStr)) {
        return '<Grid size="grow"';
      }
      
      const breakpoints = {};
      const breakpointRegex = /(xs|sm|md|lg|xl)(?:=\{?(\d+)\}?)?/g;
      let bpMatch;
      
      while ((bpMatch = breakpointRegex.exec(propsStr)) !== null) {
        const [, bp, value] = bpMatch;
        breakpoints[bp] = value ? parseInt(value, 10) : 12;
      }
      
      const bpKeys = Object.keys(breakpoints);
      if (bpKeys.length === 0) {
        return '<Grid';
      }
      
      // If only one breakpoint and it's a number, use simple syntax
      if (bpKeys.length === 1 && typeof breakpoints[bpKeys[0]] === 'number') {
        return `<Grid size={${breakpoints[bpKeys[0]]}}`;
      }
      
      // Multiple breakpoints: use object syntax
      const sizeObj = bpKeys.map(bp => `${bp}: ${breakpoints[bp]}`).join(', ');
      return `<Grid size={{ ${sizeObj} }}`;
    }
  );
  
  return content;
}

let totalFixed = 0;
files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${file} (not found)`);
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf8');
  const updated = convertGridProps(content);
  
  if (content !== updated) {
    fs.writeFileSync(fullPath, updated, 'utf8');
    console.log(`✓ Fixed ${file}`);
    totalFixed++;
  } else {
    console.log(`- No changes needed in ${file}`);
  }
});

console.log(`\n✓ Fixed ${totalFixed} files`);
