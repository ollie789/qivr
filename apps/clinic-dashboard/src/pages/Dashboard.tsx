import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  LinearProgress,
  Chip,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';
import dashboardApi from '../services/dashboardApi';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Fetch dashboard stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch recent activity
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: dashboardApi.getRecentActivity,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch today's appointments
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['today-appointments'],
    queryFn: dashboardApi.getTodayAppointments,
    refetchInterval: 60000,
  });

  // Create stats array with real data
  const stats = statsData ? [
    { 
      title: 'Appointments Today', 
      value: statsData.todayAppointments.toString(), 
      icon: <CalendarIcon />, 
      color: '#2563eb' 
    },
    { 
      title: 'Pending Intakes', 
      value: statsData.pendingIntakes.toString(), 
      icon: <AssignmentIcon />, 
      color: '#f59e0b' 
    },
    { 
      title: 'Active Patients', 
      value: statsData.activePatients.toString(), 
      icon: <PeopleIcon />, 
      color: '#7c3aed' 
    },
    { 
      title: 'Avg Wait Time', 
      value: `${statsData.averageWaitTime} min`, 
      icon: <AccessTimeIcon />, 
      color: '#10b981' 
    },
    { 
      title: 'Completed Today', 
      value: statsData.completedToday.toString(), 
      icon: <CheckCircleIcon />, 
      color: '#10b981' 
    },
    { 
      title: 'Patient Satisfaction', 
      value: statsData.patientSatisfaction.toFixed(1), 
      icon: <StarIcon />, 
      color: '#f59e0b' 
    },
  ] : [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.name || 'Doctor'}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Here's your clinic overview for today
      </Typography>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {statsLoading ? (
          // Loading skeletons
          [...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="rectangular" height={80} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={2} key={index}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: stat.color, mr: 2 }}>
                    {stat.icon}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography color="text.secondary" variant="body2">
                      {stat.title}
                    </Typography>
                    <Typography variant="h5">
                      {stat.value}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          ))
        )}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Upcoming Appointments */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Appointments
              </Typography>
              <List>
                {appointmentsLoading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : appointmentsData?.length ? (
                  appointmentsData.map((apt) => (
                    <ListItem key={apt.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar>{apt.patientName.split(' ').map(n => n[0]).join('')}</Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={apt.patientName}
                        secondary={`${apt.time} - ${apt.type}`}
                      />
                      <Chip
                        label={apt.status}
                        size="small"
                        color={
                          apt.status === 'completed' ? 'success' :
                          apt.status === 'in-progress' ? 'info' :
                          apt.status === 'scheduled' ? 'default' : 'warning'
                        }
                        variant="outlined"
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No appointments scheduled for today
                  </Typography>
                )}
              </List>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/appointments')}
              >
                View All Appointments
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Intakes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Intake Submissions
              </Typography>
              <List>
                {activityLoading ? (
                  <Skeleton variant="rectangular" height={200} />
                ) : activityData?.length ? (
                  activityData.filter(a => a.type === 'intake').slice(0, 3).map((activity) => (
                    <ListItem key={activity.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: activity.status === 'urgent' ? '#ef4444' : '#6b7280' }}>
                          {activity.status === 'urgent' ? <WarningIcon /> : activity.patientName[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.patientName}
                        secondary={`${activity.description} • ${new Date(activity.timestamp).toLocaleTimeString()}`}
                      />
                      <Chip
                        label={activity.status || 'pending'}
                        size="small"
                        color={
                          activity.status === 'urgent' ? 'error' :
                          activity.status === 'pending' ? 'warning' : 'default'
                        }
                      />
                    </ListItem>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No recent intake submissions
                  </Typography>
                )}
              </List>
              <Button 
                fullWidth 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/intake-queue')}
              >
                Review Intake Queue
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Chart */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Weekly Performance
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Grid container spacing={2}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, index) => (
                    <Grid item key={day} xs>
                      <Typography variant="caption" display="block" textAlign="center" gutterBottom>
                        {day}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={60 + Math.random() * 30}
                        sx={{ height: 100, borderRadius: 1 }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
