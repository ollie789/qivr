#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Map of files and their unused imports based on the TypeScript errors
const filesToClean = {
  'apps/clinic-dashboard/src/components/MessageComposer.tsx': {
    params: ['e'],
  },
  'apps/clinic-dashboard/src/components/NotificationBell.tsx': {
    imports: ['useEffect', 'MenuItem'],
    icons: ['CheckIcon', 'MoreIcon'],
  },
  'apps/clinic-dashboard/src/components/PromPreview.tsx': {
    imports: ['FormLabel', 'Divider'],
  },
  'apps/clinic-dashboard/src/components/SendPromDialog.tsx': {
    imports: ['List', 'ListItem'],
    icons: ['ScheduleIcon', 'EventIcon'],
    props: ['templateName'],
  },
  'apps/clinic-dashboard/src/features/appointments/components/AppointmentScheduler.tsx': {
    variables: ['response'],
  },
  'apps/clinic-dashboard/src/features/intake/components/EvaluationViewer.tsx': {
    imports: ['Tooltip'],
    icons: ['Notes', 'Psychology', 'Timeline'],
  },
  'apps/clinic-dashboard/src/features/proms/components/PromBuilder.tsx': {
    imports: ['useCallback', 'ListItemIcon', 'Slider', 'Radio', 'RadioGroup'],
    icons: ['Save', 'Cancel', 'TextFields', 'RadioButtonChecked', 'CheckBox', 'LinearScale', 'CalendarToday', 'Schedule', 'AccountTree'],
  },
  'apps/clinic-dashboard/src/lib/api-client.ts': {
    imports: ['HttpError'],
  },
  'apps/clinic-dashboard/src/pages/Analytics.tsx': {
    imports: ['useEffect', 'Paper', 'Alert', 'CircularProgress', 'Skeleton'],
    functions: ['subDays'],
    variables: ['conditionLoading', 'performanceLoading', 'revenueLoading', 'promLoading', 'isLoading'],
    params: ['e', 'n'],
  },
  'apps/clinic-dashboard/src/pages/Appointments.tsx': {
    imports: ['useMemo'],
  },
};

function removeUnusedFromFile(filePath, config) {
  const fullPath = path.join('/Users/oliver/Projects/qivr', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return false;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Remove unused imports
  if (config.imports) {
    config.imports.forEach(imp => {
      // Handle React hooks
      const hookRegex = new RegExp(`(,\\s*)?\\b${imp}\\b(\\s*,)?`, 'g');
      const newContent = content.replace(hookRegex, (match, before, after) => {
        if (before && after) return ',';
        return '';
      });
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  Removed import: ${imp}`);
      }
    });
  }
  
  // Remove unused icons
  if (config.icons) {
    config.icons.forEach(icon => {
      const iconRegex = new RegExp(`.*${icon}.*\\n`, 'g');
      const newContent = content.replace(iconRegex, '');
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  Removed icon: ${icon}`);
      }
    });
  }
  
  // Remove unused variables
  if (config.variables) {
    config.variables.forEach(variable => {
      // For destructured variables
      const destructRegex = new RegExp(`(,\\s*)?\\b${variable}\\b(:\\s*\\w+)?(\\s*,)?`, 'g');
      const newContent = content.replace(destructRegex, (match, before, type, after) => {
        if (before && after) return ',';
        return '';
      });
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  Removed variable: ${variable}`);
      }
    });
  }
  
  // Fix parameter issues (mark as used with underscore or add type)
  if (config.params) {
    config.params.forEach(param => {
      // Replace 'e' with '_e' to indicate it's intentionally unused
      const paramRegex = new RegExp(`\\((${param})(,|\\))`, 'g');
      const newContent = content.replace(paramRegex, `(_$1$2`);
      if (newContent !== content) {
        content = newContent;
        modified = true;
        console.log(`  Fixed parameter: ${param} -> _${param}`);
      }
    });
  }
  
  // Clean up empty import statements and multiple blank lines
  content = content.replace(/^import\s*{\s*}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');
  content = content.replace(/\n\n\n+/g, '\n\n');
  content = content.replace(/,\s*,/g, ',');
  content = content.replace(/{\s*,/g, '{');
  content = content.replace(/,\s*}/g, '}');
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✓ Cleaned: ${filePath}`);
    return true;
  }
  
  return false;
}

// Process all files
console.log('Starting TypeScript cleanup...\n');
let totalCleaned = 0;

Object.entries(filesToClean).forEach(([filePath, config]) => {
  if (removeUnusedFromFile(filePath, config)) {
    totalCleaned++;
  }
});

console.log(`\n✨ Cleanup complete! Modified ${totalCleaned} files.`);
