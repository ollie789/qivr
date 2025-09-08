import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';

function organizeImportsInFile(filePath: string, program: ts.Program) {
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) return;

  const languageService = ts.createLanguageService({
    getCompilationSettings: () => program.getCompilerOptions(),
    getScriptFileNames: () => [filePath],
    getScriptVersion: () => '0',
    getScriptSnapshot: (fileName) => {
      if (!fs.existsSync(fileName)) {
        return undefined;
      }
      return ts.ScriptSnapshot.fromString(fs.readFileSync(fileName).toString());
    },
    getCurrentDirectory: () => process.cwd(),
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
  });

  const fileTextChanges = languageService.organizeImports(
    { type: 'file', fileName: filePath },
    { 
      skipDestructiveCodeActions: false 
    },
    {}
  );

  if (fileTextChanges && fileTextChanges.length > 0) {
    let content = sourceFile.getText();
    
    // Apply changes in reverse order to maintain correct positions
    const changes = fileTextChanges[0].textChanges.sort((a, b) => b.span.start - a.span.start);
    
    for (const change of changes) {
      const start = change.span.start;
      const end = change.span.start + change.span.length;
      content = content.substring(0, start) + change.newText + content.substring(end);
    }

    fs.writeFileSync(filePath, content);
    console.log(`✓ Organized imports in ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  
  return false;
}

function findTsFiles(dir: string): string[] {
  const files: string[] = [];
  
  function walk(currentDir: string) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build') {
        walk(fullPath);
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx')) && !item.endsWith('.d.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function main() {
  const directories = [
    '/Users/oliver/Projects/qivr/apps/clinic-dashboard/src',
    '/Users/oliver/Projects/qivr/apps/patient-portal/src',
    '/Users/oliver/Projects/qivr/apps/widget/src',
    '/Users/oliver/Projects/qivr/apps/shared'
  ];

  let totalOrganized = 0;

  for (const dir of directories) {
    if (!fs.existsSync(dir)) continue;
    
    console.log(`\nProcessing ${dir}...`);
    
    const files = findTsFiles(dir);
    const configPath = path.join(path.dirname(dir), 'tsconfig.json');
    
    // Try to find tsconfig.json
    let config: ts.ParsedCommandLine;
    if (fs.existsSync(configPath)) {
      const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
      config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath));
    } else {
      // Use default config
      config = {
        options: {
          target: ts.ScriptTarget.ES2020,
          module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.React,
          esModuleInterop: true,
          skipLibCheck: true,
          strict: false,
          moduleResolution: ts.ModuleResolutionKind.NodeJs,
        },
        fileNames: files,
        errors: []
      };
    }

    const program = ts.createProgram(files, config.options);
    
    for (const file of files) {
      if (organizeImportsInFile(file, program)) {
        totalOrganized++;
      }
    }
  }

  console.log(`\n✨ Successfully organized imports in ${totalOrganized} files`);
}

main();
