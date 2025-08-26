import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Button, Card, CardContent, Typography, Box, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2563eb',
    },
  },
});

function AppWithMUI() {
  console.log('AppWithMUI rendering');
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ padding: 3 }}>
        <Typography variant="h3" gutterBottom>
          Qivr Clinic Dashboard - MUI Test
        </Typography>
        
        <Card sx={{ maxWidth: 600, mb: 2 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom>
              Material-UI is Working!
            </Typography>
            <Typography variant="body1" paragraph>
              If you can see this styled card, Material-UI is loading correctly.
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => alert('MUI Button clicked!')}
            >
              Test MUI Button
            </Button>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
}

export default AppWithMUI;
