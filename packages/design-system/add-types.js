const fs = require('fs');
const path = require('path');

// Common type exports to add
const typeExports = {
  'data/kanban/kanban.ts': ['Task', 'TaskList', 'Subtask'],
  'data/faqs.ts': ['FAQ', 'FaqCategory', 'FaqItem'],
  'data/landing/homepage.ts': ['Feature', 'Testimonial', 'BlogData', 'GalleryItem', 'ShowcaseItem', 'Stat'],
  'data/showcase.ts': ['Share'],
  'data/e-commerce/orders.ts': ['Order'],
  'data/e-commerce/product-listing.ts': ['RefundFormValues'],
  'data/hiring/dashboard.ts': ['CandidateInfoType'],
  'data/account/account-tabs.ts': ['accountTabs'],
};

const baseDir = path.join(__dirname, 'src', 'aura');

Object.entries(typeExports).forEach(([filePath, types]) => {
  const fullPath = path.join(baseDir, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`Skipping ${filePath} - doesn't exist`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  types.forEach(typeName => {
    if (!content.includes(`export type ${typeName}`) && !content.includes(`export const ${typeName}`)) {
      // Add before default export
      const lines = content.split('\n');
      const defaultIndex = lines.findIndex(l => l.startsWith('export default'));
      
      if (defaultIndex !== -1) {
        lines.splice(defaultIndex, 0, `export type ${typeName} = any;`);
        content = lines.join('\n');
      }
    }
  });
  
  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${filePath}`);
});

console.log('Done!');
