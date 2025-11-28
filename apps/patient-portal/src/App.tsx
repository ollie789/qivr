import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { QivrThemeProvider, SnackbarCloseButton, SnackbarIcon } from '@qivr/design-system';
import { SnackbarProvider } from 'notistack';

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
        <QivrThemeProvider brand="patient" defaultMode="system">
          <SnackbarProvider
            maxSnack={3}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            action={(snackbarKey) => (
              <SnackbarCloseButton snackbarKey={snackbarKey} />
            )}
            iconVariant={{
              success: <SnackbarIcon variant="success" icon="solar:check-circle-bold" />,
              error: <SnackbarIcon variant="error" icon="solar:danger-bold" />,
              warning: <SnackbarIcon variant="warning" icon="solar:bell-bing-bold" />,
              info: <SnackbarIcon variant="info" icon="solar:info-circle-bold" />,
            }}
          >
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </SnackbarProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QivrThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return <div>Error loading app: {String(error)}</div>;
  }
}

export default App;
