const fs = require('fs');
const path = require('path');

// List of missing data modules
const dataModules = [
  'data/account/account-tabs',
  'data/account/credit-cards',
  'data/account/date-time',
  'data/account/language-region',
  'data/account/notification-alerts',
  'data/account/privacy-protection',
  'data/analytics/dashboard',
  'data/calendar',
  'data/chat',
  'data/colorPicker',
  'data/common/months',
  'data/countries',
  'data/crm/dashboard',
  'data/crm/deal-details',
  'data/crm/deals',
  'data/crm/lead-details',
  'data/e-commerce/activities',
  'data/e-commerce/dashboard',
  'data/e-commerce/greetings',
  'data/e-commerce/marketShare',
  'data/e-commerce/orders',
  'data/e-commerce/product-listing',
  'data/e-commerce/products',
  'data/email',
  'data/events',
  'data/faqs',
  'data/file-manager',
  'data/hiring/dashboard',
  'data/invoice',
  'data/kanban/boards',
  'data/kanban/createBoard',
  'data/kanban/kanban',
  'data/landing/faqs',
  'data/landing/homepage',
  'data/notifications',
  'data/pricing',
  'data/project/dashboard',
  'data/showcase',
  'data/social',
  'data/time-tracker/dashboard',
  'data/users',
  'data/weeks',
];

const baseDir = path.join(__dirname, 'src', 'aura');

// Create stub data files
dataModules.forEach(modulePath => {
  const fullPath = path.join(baseDir, modulePath + '.ts');
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Create stub file with both default and named exports
  const moduleName = modulePath.split('/').pop();
  const camelName = moduleName.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
  
  const stubContent = `// Auto-generated stub for ${modulePath}
export const ${camelName} = [];
export default ${camelName};
`;
  
  fs.writeFileSync(fullPath, stubContent);
  console.log(`Created: ${modulePath}.ts`);
});

console.log('\nStub data files created successfully!');
