const fs = require('fs');
const path = require('path');

const providers = [
  'AccountsProvider',
  'AuthProvider',
  'BulkSelectProvider',
  'CalendarProvider',
  'ChatProvider',
  'DealsProvider',
  'EcommerceProvider',
  'EmailProvider',
  'FaqProvider',
  'FileManagerProvider',
  'HiringProvider',
  'KanbanProvider',
  'SettingsPanelProvider',
  'ThemeProvider',
];

const baseDir = path.join(__dirname, 'src', 'aura', 'providers');

providers.forEach(providerName => {
  const hookName = 'use' + providerName.replace('Provider', '');
  const contextName = providerName.replace('Provider', 'Context');
  
  const content = `import { createContext, useContext, ReactNode } from 'react';

const ${contextName} = createContext<any>(null);

export const ${providerName} = ({ children }: { children: ReactNode }) => {
  return <${contextName}.Provider value={{}}>{children}</${contextName}.Provider>;
};

export const ${hookName} = () => useContext(${contextName});
export default ${providerName};
`;
  
  const filePath = path.join(baseDir, providerName + '.tsx');
  fs.writeFileSync(filePath, content);
  console.log(`Created ${providerName}.tsx`);
});

console.log('\nAll providers created!');
