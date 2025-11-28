import { Paper, Typography, Box } from '@mui/material';
import { Assignment } from '@mui/icons-material';
import { glassTokens } from '../../theme/auraTokens';

export const TreatmentPlanCard = () => (
  <Paper
    elevation={0}
    sx={{
      p: 3,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      boxShadow: glassTokens.shadow.subtle,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
      <Assignment color="primary" />
      <Typography variant="h6" fontWeight={600}>Treatment Plan</Typography>
    </Box>
    <Typography color="text.secondary">
      Your treatment plan will appear here once your provider creates one.
    </Typography>
  </Paper>
);
