import { useState } from 'react';
import { Container, Typography, Paper } from '@mui/material';
import { PainMap3D } from '@qivr/design-system';

export default function PainMap3DTest() {
  const [regions, setRegions] = useState([]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        3D Pain Map Test
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <PainMap3D value={regions} onChange={setRegions} />
      </Paper>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="h6" gutterBottom>Debug: Selected Regions</Typography>
        <pre>{JSON.stringify(regions, null, 2)}</pre>
      </Paper>
    </Container>
  );
}
