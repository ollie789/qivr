import { Paper, Typography, Box } from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { glassCard } from '../../styles/glassmorphism';

export const TreatmentPlanCard = () => (
  <Paper sx={{ p: 3, ...glassCard('light') }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Assignment color="primary" />
      <Typography variant="h6">Treatment Plan</Typography>
    </Box>
    <Typography color="text.secondary">
      Your treatment plan will appear here once your provider creates one.
    </Typography>
  </Paper>
);
