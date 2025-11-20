import { CssBaseline } from '@mui/material';
import { Experimental_CssVarsProvider as ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { theme } from '@qivr/design-system';

// Initialize Amplify
import './config/amplify.config';

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
          <CssBaseline />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return <div>Error loading app: {String(error)}</div>;
  }
}

export default App;
