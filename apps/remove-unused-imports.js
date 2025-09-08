#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Function to detect and remove unused imports
function removeUnusedImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Extract all imports
    const importRegex = /^import\s+(?:(\*\s+as\s+\w+)|({[^}]+})|(\w+))\s+from\s+['"][^'"]+['"];?$/gm;
    const namedImportRegex = /import\s+{([^}]+)}\s+from/g;
    const defaultImportRegex = /import\s+(\w+)(?:,\s*{[^}]+})?\s+from/g;
    const typeImportRegex = /import\s+type\s+{([^}]+)}\s+from/g;
    
    // Find all imported symbols
    const imports = new Map();
    let match;
    
    // Named imports
    while ((match = namedImportRegex.exec(content)) !== null) {
      const items = match[1].split(',').map(item => {
        const parts = item.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
      items.forEach(item => {
        if (item) imports.set(item, match[0]);
      });
    }
    
    // Default imports
    defaultImportRegex.lastIndex = 0;
    while ((match = defaultImportRegex.exec(content)) !== null) {
      if (match[1]) {
        imports.set(match[1], match[0]);
      }
    }
    
    // Type imports
    typeImportRegex.lastIndex = 0;
    while ((match = typeImportRegex.exec(content)) !== null) {
      const items = match[1].split(',').map(item => {
        const parts = item.trim().split(/\s+as\s+/);
        return parts[parts.length - 1].trim();
      });
      items.forEach(item => {
        if (item) imports.set(item, match[0]);
      });
    }
    
    // Check which imports are actually used in the code (excluding the import statements)
    const codeWithoutImports = content.replace(/^import\s+.*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    
    const unusedImports = [];
    imports.forEach((importStatement, symbol) => {
      // Create a regex to check if the symbol is used
      // Look for the symbol followed by non-word character or at word boundary
      const usageRegex = new RegExp(`\\b${symbol}\\b(?![\\w:])`, 'g');
      
      if (!usageRegex.test(codeWithoutImports)) {
        unusedImports.push(symbol);
      }
    });
    
    // Remove unused imports from import statements
    if (unusedImports.length > 0) {
      unusedImports.forEach(symbol => {
        // Handle named imports
        content = content.replace(
          new RegExp(`(import\\s+{[^}]*?)\\b${symbol}\\s*(?:as\\s+\\w+)?\\s*,?\\s*([^}]*}\\s+from)`, 'g'),
          (match, before, after) => {
            const newImport = before + after;
            // Clean up extra commas
            return newImport.replace(/,\s*,/g, ',').replace(/{\s*,/g, '{').replace(/,\s*}/g, '}');
          }
        );
        
        // Handle default imports
        content = content.replace(
          new RegExp(`^import\\s+${symbol}\\s+from\\s+['"][^'"]+['"];?\\s*$`, 'gm'),
          ''
        );
        
        // Clean up empty import statements
        content = content.replace(/^import\s+{\s*}\s+from\s+['"][^'"]+['"];?\s*$/gm, '');
      });
      
      // Clean up multiple blank lines
      content = content.replace(/\n\n+/g, '\n\n');
    }
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✓ Cleaned ${filePath} - Removed ${unusedImports.length} unused imports`);
      return unusedImports.length;
    }
    
    return 0;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return 0;
  }
}

// Function to recursively find all TypeScript files
function findTsFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findTsFiles(fullPath, files);
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const directories = [
  '/Users/oliver/Projects/qivr/apps/clinic-dashboard/src',
  '/Users/oliver/Projects/qivr/apps/patient-portal/src',
  '/Users/oliver/Projects/qivr/apps/widget/src',
  '/Users/oliver/Projects/qivr/apps/shared'
];

let totalRemoved = 0;

directories.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`\nProcessing ${dir}...`);
    const files = findTsFiles(dir);
    
    files.forEach(file => {
      totalRemoved += removeUnusedImports(file);
    });
  }
});

console.log(`\n✨ Total unused imports removed: ${totalRemoved}`);
