import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Description as DescriptionIcon,
  Healing as HealingIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, addDays, isPast, isToday, isTomorrow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface DashboardStats {
  upcomingAppointments: number;
  pendingPROMs: number;
  completedEvaluations: number;
  lastVisit?: string;
}

interface UpcomingAppointment {
  id: string;
  providerName: string;
  appointmentType: string;
  scheduledStart: string;
  locationT: string;
  status: string;
}

interface PendingPROM {
  id: string;
  templateName: string;
  scheduledFor: string;
  daysOverdue?: number;
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/dashboard/stats').then(res => res.data),
  });

  const { data: appointments, isLoading: appointmentsLoading } = useQuery<UpcomingAppointment[]>({
    queryKey: ['upcoming-appointments'],
    queryFn: () => api.get('/appointments/upcoming?limit=3').then(res => res.data),
  });

  const { data: proms, isLoading: promsLoading } = useQuery<PendingPROM[]>({
    queryKey: ['pending-proms'],
    queryFn: () => api.get('/proms/pending?limit=3').then(res => res.data),
  });

  const getAppointmentChipColor = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'error';
    if (isTomorrow(date)) return 'warning';
    return 'default';
  };

  const getAppointmentChipLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM d');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || 'Patient'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your health journey
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>
                  <CalendarIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.upcomingAppointments || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upcoming Appointments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.light', mr: 2 }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.pendingPROMs || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pending Assessments
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'success.light', mr: 2 }}>
                  <DescriptionIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">
                    {stats?.completedEvaluations || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Evaluations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
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
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
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

            {appointmentsLoading ? (
              <LinearProgress />
            ) : appointments?.length === 0 ? (
              <Alert severity="info">No upcoming appointments</Alert>
            ) : (
              <List>
                {appointments?.map((appointment) => (
                  <ListItem
                    key={appointment.id}
                    button
                    onClick={() => navigate(`/appointments/${appointment.id}`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <EventIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={appointment.providerName}
                      secondary={
                        <>
                          {appointment.appointmentType} • {format(new Date(appointment.scheduledStart), 'h:mm a')}
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Chip
                        label={getAppointmentChipLabel(appointment.scheduledStart)}
                        color={getAppointmentChipColor(appointment.scheduledStart)}
                        size="small"
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {appointments && appointments.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  onClick={() => navigate('/appointments')}
                  endIcon={<ChevronRightIcon />}
                >
                  View All Appointments
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Pending PROMs */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Pending Assessments</Typography>
              <Chip label={`${proms?.length || 0} pending`} color="warning" size="small" />
            </Box>

            {promsLoading ? (
              <LinearProgress />
            ) : proms?.length === 0 ? (
              <Alert severity="success">All assessments completed!</Alert>
            ) : (
              <List>
                {proms?.map((prom) => (
                  <ListItem
                    key={prom.id}
                    button
                    onClick={() => navigate(`/proms/${prom.id}/complete`)}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: prom.daysOverdue ? 'error.main' : 'warning.main' }}>
                        <AssignmentIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={prom.templateName}
                      secondary={
                        prom.daysOverdue
                          ? `${prom.daysOverdue} days overdue`
                          : `Due ${format(new Date(prom.scheduledFor), 'MMM d')}`
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => navigate(`/proms/${prom.id}/complete`)}
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}

            {proms && proms.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Button
                  onClick={() => navigate('/proms')}
                  endIcon={<ChevronRightIcon />}
                >
                  View All Assessments
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HealingIcon />}
                  onClick={() => navigate('/medical-records')}
                  sx={{ py: 2 }}
                >
                  Medical Records
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CalendarIcon />}
                  onClick={() => navigate('/appointments/book')}
                  sx={{ py: 2 }}
                >
                  Book Appointment
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingIcon />}
                  onClick={() => navigate('/analytics')}
                  sx={{ py: 2 }}
                >
                  Health Analytics
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => navigate('/documents')}
                  sx={{ py: 2 }}
                >
                  Documents
                </Button>
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<HealingIcon />}
                  onClick={() => window.open('https://widget.qivr.health', '_blank')}
                  sx={{ py: 2 }}
                >
                  New Evaluation
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => navigate('/evaluations')}
                  sx={{ py: 2 }}
                >
                  Past Evaluations
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<TrendingIcon />}
                  onClick={() => navigate('/proms')}
                  sx={{ py: 2 }}
                >
                  Assessments
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<ScheduleIcon />}
                  onClick={() => navigate('/profile')}
                  sx={{ py: 2 }}
                >
                  Profile
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};
