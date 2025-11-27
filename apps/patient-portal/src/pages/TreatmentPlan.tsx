import { Box, Typography, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { InfoCard, SectionLoader, AuraEmptyState } from '@qivr/design-system';

export default function TreatmentPlan() {
  const { data, isLoading } = useQuery({
    queryKey: ['treatment-plan'],
    queryFn: async () => {
      const response: any = await api.get('/api/treatment-plans/current');
      return response.data || response;
    },
  });

  if (isLoading) {
    return <SectionLoader message="Loading treatment plan..." />;
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Treatment Plan</Typography>
        <AuraEmptyState
          title="No Treatment Plan"
          description="No active treatment plan found. Your provider will create one during your visits."
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Treatment Plan</Typography>
      
      <InfoCard title="Plan Details" sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Status: <Chip label={data.status} size="small" color="primary" />
        </Typography>
        {data.diagnosis && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Diagnosis:</strong> {data.diagnosis}
          </Typography>
        )}
        {data.goals && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Goals:</strong> {data.goals}
          </Typography>
        )}
      </InfoCard>

      {data.sessions && data.sessions.length > 0 && (
        <InfoCard title="Sessions">
          <List>
            {data.sessions.map((session: any, index: number) => (
              <ListItem key={index}>
                <ListItemText
                  primary={`Session ${index + 1}`}
                  secondary={session.description || session.type}
                />
              </ListItem>
            ))}
          </List>
        </InfoCard>
      )}
    </Box>
  );
}
