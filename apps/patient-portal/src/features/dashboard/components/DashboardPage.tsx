import React, { useMemo } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  Healing as HealingIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
} from '@mui/icons-material';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboardData } from '../hooks';

const formatAppointmentTime = (isoDate: string) => {
  const date = parseISO(isoDate);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return format(date, 'MMM dd, yyyy • h:mm a');
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, upcomingAppointments, pendingProms, isLoading, error } = useDashboardData();

  const displayedAppointments = useMemo(
    () => upcomingAppointments.slice(0, 3),
    [upcomingAppointments],
  );
  const displayedProms = useMemo(() => pendingProms.slice(0, 3), [pendingProms]);

  const chipColor = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (Number.isNaN(date.getTime())) {
      return 'default';
    }
    if (isToday(date)) return 'error';
    if (isTomorrow(date)) return 'warning';
    return 'default';
  };

  const chipLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (Number.isNaN(date.getTime())) {
      return 'Upcoming';
    }
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || 'Patient'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your health journey
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Unable to load all dashboard data. Please try again later.
        </Alert>
      )}

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.upcomingAppointments ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Appointments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.pendingProms ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Assessments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                  <DescriptionIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.completedEvaluations ?? 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Evaluations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'info.light', mr: 2 }}>
                  <TrendingIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">85%</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recovery Progress
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Upcoming Appointments</Typography>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate('/appointments/book')}
              >
                Book New
              </Button>
            </Box>

            {displayedAppointments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No appointments scheduled.
              </Typography>
            ) : (
              <List>
                {displayedAppointments.map((appointment) => (
                  <ListItem key={appointment.id} sx={{ alignItems: 'flex-start' }}>
                    <ListItemAvatar>
                      <Avatar>
                        <EventIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            {appointment.providerName}
                          </Typography>
                          <Chip
                            label={chipLabel(appointment.scheduledStart)}
                            color={chipColor(appointment.scheduledStart)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.providerSpecialty} • {appointment.appointmentType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatAppointmentTime(appointment.scheduledStart)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.isVirtual ? 'Virtual appointment' : appointment.location || 'In person'}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => navigate(`/appointments/${appointment.id}`)}>
                        <ChevronRightIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Assessments & PROMs</Typography>
              <Button size="small" startIcon={<ScheduleIcon />} onClick={() => navigate('/proms')}>
                View All
              </Button>
            </Box>

            {displayedProms.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No pending assessments.
              </Typography>
            ) : (
              <List>
                {displayedProms.map((prom) => (
                  <ListItem key={prom.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <HealingIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={prom.templateName}
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Due {formatAppointmentTime(prom.scheduledFor)}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => navigate(`/proms/${prom.id}`)}>
                        <ChevronRightIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
