import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
// Temporarily disabled due to version conflict - will fix later
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Only import devtools in development
const ReactQueryDevtools = import.meta.env.DEV 
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : () => null;
// import { enAU } from 'date-fns/locale/en-AU';

// Initialize Amplify
import './config/amplify.config';

// Theme
import { theme } from './theme';

// Auth
import { AuthProvider } from './contexts/AuthContext';

// App Content
import { AppContent } from './AppContent';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
    },
  },
});

function App() {
  console.log('App component rendering...');
  
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          {/* LocalizationProvider temporarily disabled - date pickers will work without localization */}
          <CssBaseline />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          {import.meta.env.DEV && (
            <React.Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </React.Suspense>
          )}
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return <div>Error loading app: {String(error)}</div>;
  }
}

export default App;
