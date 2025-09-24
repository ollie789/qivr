#!/usr/bin/env node
/**
 * Script to automatically fix unescaped entities in React components
 * Fixes apostrophes and quotes that should be HTML entities
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  { file: 'src/components/PromPreview.tsx', lines: [233] },
  { file: 'src/components/ScheduleAppointmentDialog.tsx', lines: [459] },
  { file: 'src/features/appointments/components/AppointmentScheduler.tsx', lines: [505] },
  { file: 'src/pages/Analytics.tsx', lines: [219] },
  { file: 'src/pages/Appointments.tsx', lines: [761] },
  { file: 'src/pages/Dashboard.tsx', lines: [251, 270] },
  { file: 'src/pages/IntakeManagement.tsx', lines: [407] },
  { file: 'src/pages/Login.tsx', lines: [177] },
  { file: 'src/features/proms/components/PromBuilder.tsx', lines: [749] },
];

function fixFile(filePath, lineNumbers) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  
  lineNumbers.forEach(lineNum => {
    const index = lineNum - 1; // Convert to 0-based index
    if (index < lines.length) {
      const line = lines[index];
      
      // Fix patterns in JSX text content (not in attributes)
      // Look for patterns like: >text with 's or "s<
      
      // Pattern 1: Single quotes in text content
      // Match text between > and < that contains apostrophes
      lines[index] = line.replace(
        />(.[^<]*)'([^<]*)</g, 
        (match, before, after) => `>${before}{'\\''}<${after}`
      );
      
      // Pattern 2: Double quotes in text content
      lines[index] = lines[index].replace(
        />(.[^<]*)"([^<]*)"([^<]*)</g,
        (match, before, middle, after) => `>${before}{'"'}${middle}{'"'}${after}<`
      );
      
      // Special case for contractions like "don't", "can't", etc.
      lines[index] = lines[index].replace(
        />([^<]*)(don't|can't|won't|isn't|aren't|doesn't|didn't|wouldn't|couldn't|shouldn't|hasn't|haven't|wasn't|weren't)([^<]*)</gi,
        (match, before, contraction, after) => {
          const fixed = contraction.replace("'", "{'\\''}")
          return `>${before}${fixed}${after}<`;
        }
      );
    }
  });
  
  const newContent = lines.join('\n');
  if (content !== newContent) {
    fs.writeFileSync(fullPath, newContent, 'utf8');
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`⚠️  No changes needed for ${filePath}`);
  }
}

console.log('🔧 Fixing unescaped entities in React components...\n');

filesToFix.forEach(({ file, lines }) => {
  fixFile(file, lines);
});

console.log('\n✨ Done! Run npm run lint to verify the fixes.');