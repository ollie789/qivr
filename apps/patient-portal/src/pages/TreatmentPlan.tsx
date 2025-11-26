import { Box, Typography, Card, CardContent, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export default function TreatmentPlan() {
  const { data, isLoading } = useQuery({
    queryKey: ['treatment-plan'],
    queryFn: async () => {
      const response: any = await api.get('/api/treatment-plans/current');
      return response.data || response;
    },
  });

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading treatment plan...</Typography>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>Treatment Plan</Typography>
        <Typography color="text.secondary">No active treatment plan found.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Treatment Plan</Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Plan Details</Typography>
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
        </CardContent>
      </Card>

      {data.sessions && data.sessions.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Sessions</Typography>
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
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
