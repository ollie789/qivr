#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files and their unused imports based on the error output
const fixes = [
  {
    file: 'src/features/appointments/components/AppointmentScheduler.tsx',
    changes: [
      { pattern: /const response = await getWithAuth/, replacement: 'await getWithAuth' }
    ]
  },
  {
    file: 'src/pages/Analytics.tsx', 
    changes: [
      { pattern: /import \{ format, subDays \}/, replacement: 'import { format }' }
    ]
  },
  {
    file: 'src/pages/Appointments.tsx',
    changes: [
      { pattern: /,\s*Alert/, replacement: '' },
      { pattern: /import \{\s*Edit as EditIcon,\s*Delete as DeleteIcon,\s*Person as PersonIcon,\s*Schedule as ScheduleIcon[^}]*\}[^;]*;/, replacement: '' },
      { pattern: /,\s*AccessTime/, replacement: '' },
      { pattern: /,\s*CheckCircle/, replacement: '' },
      { pattern: /,\s*Cancel/, replacement: '' },
      { pattern: /,\s*Pending/, replacement: '' },
      { pattern: /,\s*isSameMonth/, replacement: '' },
      { pattern: /\(apt, idx\)/, replacement: '(apt: any, idx: any)' },
      { pattern: /onChange=\{[^}]*\(e\)[^}]*\}/, replacement: 'onChange={(_e: any) => setView(_e.target.value)}' },
      { pattern: /onClick=\{[^}]*\(e\)[^}]*setAnchorEl/, replacement: 'onClick={(_e: any) => setAnchorEl(null)}' }
    ]
  },
  {
    file: 'src/pages/Dashboard.tsx',
    changes: [
      { pattern: /,\s*LinearProgress/, replacement: '' },
      { pattern: /,\s*Alert/, replacement: '' },
      { pattern: /,\s*Paper/, replacement: '' },
      { pattern: /import \{\s*TrendingUp as TrendingUpIcon[^}]*\}[^;]*;/, replacement: '' },
      { pattern: /import \{\s*Schedule as ScheduleIcon[^}]*\}[^;]*;/, replacement: '' }
    ]
  },
  {
    file: 'src/pages/Documents.tsx',
    changes: [
      { pattern: /,\s*List/, replacement: '' },
      { pattern: /,\s*ListItem/, replacement: '' },
      { pattern: /import \{\s*Add as AddIcon[^}]*\}[^;]*;/, replacement: '' },
      { pattern: /import \{\s*FilterList as FilterIcon[^}]*\}[^;]*;/, replacement: '' }
    ]
  },
  {
    file: 'src/pages/IntakeQueue.tsx',
    changes: [
      { pattern: /,\s*Divider/, replacement: '' },
      { pattern: /,\s*useMutation/, replacement: '' },
      { pattern: /import \{ handleApiError, isApiError \}/, replacement: 'import { handleApiError }' },
      { pattern: /const queryClient[^;]*;/, replacement: '' },
      { pattern: /onChange=\{\(\) => setSelectedTab\(e\.target\.value\)\}/, replacement: 'onChange={(_e: any) => setSelectedTab(_e.target.value)}' }
    ]
  },
  {
    file: 'src/pages/Messages.tsx',
    changes: [
      { pattern: /,\s*ListItemSecondaryAction/, replacement: '' },
      { pattern: /onClick=\{\(\) => handleThreadClick\(e\)\}/, replacement: 'onClick={() => handleThreadClick(thread)}' }
    ]
  },
  {
    file: 'src/pages/PatientDetail.tsx',
    changes: [
      { pattern: /^import React[^;]*;\n/, replacement: '' }
    ]
  },
  {
    file: 'src/pages/Patients.tsx',
    changes: [
      { pattern: /,\s*Paper/, replacement: '' },
      { pattern: /,\s*Divider/, replacement: '' },
      { pattern: /import \{\s*Delete as DeleteIcon[^}]*\}[^;]*;/, replacement: '' },
      { pattern: /import \{\s*History as HistoryIcon[^}]*\}[^;]*;/, replacement: '' },
      { pattern: /,\s*useMutation/, replacement: '' },
      { pattern: /const queryClient[^;]*;/, replacement: '' },
      { pattern: /\.filter\(\(patient\)/, replacement: '.filter((patient: any)' },
      { pattern: /\.find\(\(p\)/, replacement: '.find((p: any)' },
      { pattern: /onClick=\{\(\) => handleViewDetails\(patient\)\}/, replacement: 'onClick={() => handleViewDetails(patient)}' },
      { pattern: /\.map\(\(condition\)/, replacement: '.map((condition: any)' },
      { pattern: /onChange=\{\(e\) => setSearchTerm/, replacement: 'onChange={(_e: any) => setSearchTerm(_e.target.value)' }
    ]
  },
  {
    file: 'src/services/jwtAuthService.ts',
    changes: [
      { pattern: /import \{ getJson[^}]*\}/, replacement: 'import { postJson }' },
      { pattern: /const \{ accessToken, refreshToken, expiresIn, mfaSetupRequired \}/, replacement: 'const { accessToken, refreshToken }' },
      { pattern: /const \{ success, code \} = await/, replacement: 'const { success } = await' },
      { pattern: /async resetPassword\([^)]*\)/, replacement: 'async resetPassword(_email: string)' }
    ]
  },
  {
    file: 'src/services/promInstanceApi.ts',
    changes: [
      { pattern: /const BASE_PATH[^;]*;/, replacement: '' }
    ]
  },
  {
    file: 'src/features/intake/components/EvaluationViewer.tsx',
    changes: [
      { pattern: /onUpdate\?: \(evaluation: EvaluationData\) => void;/, replacement: '_onUpdate?: (evaluation: EvaluationData) => void;' },
      { pattern: /onUpdate,/, replacement: '_onUpdate,' }
    ]
  }
];

// Process each file
fixes.forEach(({ file, changes }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  changes.forEach(({ pattern, replacement }) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (before !== content) {
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
  } else {
    console.log(`⏭️  No changes needed: ${file}`);
  }
});

// Also fix shared components
const sharedFixes = [
  {
    file: '../shared/components/DocumentUpload.tsx',
    changes: [
      { pattern: /allowedTypes[^,]*,/, replacement: '' },
      { pattern: /maxSize[^,]*,/, replacement: '' }
    ]
  }
];

sharedFixes.forEach(({ file, changes }) => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Shared file not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  changes.forEach(({ pattern, replacement }) => {
    const before = content;
    content = content.replace(pattern, replacement);
    if (before !== content) {
      modified = true;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed shared: ${file}`);
  }
});

console.log('\n✨ Cleanup complete!');
