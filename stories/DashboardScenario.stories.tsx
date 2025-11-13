import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  Container,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
  Typography,
  CardContent,
} from '@mui/material';
import {
  People as PeopleIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  AccessTime as TimeIcon,
  CheckCircle as CheckIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import {
  QivrCard,
  QivrButton,
  PageHeader,
  EmptyState,
  SkeletonLoader,
  DashboardSectionCard,
} from '@qivr/design-system';

/**
 * Full dashboard view demonstrating all design system components in action
 */
const DashboardView: React.FC<{ loading?: boolean }> = ({ loading = false }) => {
  const [view, setView] = useState<'overview' | 'appointments' | 'intakes'>('overview');

  const stats = [
    { title: 'Appointments Today', value: '12', icon: <CalendarIcon />, color: '#1976d2' },
    { title: 'Pending Intakes', value: '5', icon: <AssignmentIcon />, color: '#ed6c02' },
    { title: 'Active Patients', value: '248', icon: <PeopleIcon />, color: '#9c27b0' },
    { title: 'Avg Wait Time', value: '8 min', icon: <TimeIcon />, color: '#2e7d32' },
    { title: 'Completed Today', value: '8', icon: <CheckIcon />, color: '#2e7d32' },
    { title: 'Satisfaction', value: '4.8', icon: <StarIcon />, color: '#ed6c02' },
  ];

  const appointments = [
    { id: 1, patient: 'John Smith', time: '9:00 AM', type: 'Consultation', status: 'confirmed' },
    { id: 2, patient: 'Sarah Johnson', time: '10:30 AM', type: 'Follow-up', status: 'in-progress' },
    { id: 3, patient: 'Mike Williams', time: '2:00 PM', type: 'Assessment', status: 'scheduled' },
  ];

  const intakes = [
    { id: 1, patient: 'Emma Brown', time: '8:45 AM', urgency: 'high' },
    { id: 2, patient: 'Chris Davis', time: '9:15 AM', urgency: 'medium' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <PageHeader
        title="Welcome back, Dr. Smith"
        description="Here's your clinic overview for today"
        actions={
          <>
            <QivrButton variant="outlined" emphasize="subtle">
              View Reports
            </QivrButton>
            <QivrButton variant="contained" onClick={() => setView('appointments')}>
              Manage Schedule
            </QivrButton>
          </>
        }
      />

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={2} key={index}>
            <QivrCard elevated>
              <CardContent>
                <Grid container spacing={1} alignItems="center">
                  <Grid item>
                    <Avatar sx={{ bgcolor: stat.color, width: 40, height: 40 }}>
                      {stat.icon}
                    </Avatar>
                  </Grid>
                  <Grid item xs>
                    <Typography variant="caption" color="text.secondary">
                      {stat.title}
                    </Typography>
                    <Typography variant="h6">{stat.value}</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </QivrCard>
          </Grid>
        ))}
      </Grid>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Today's Appointments */}
        <Grid item xs={12} md={6}>
          <QivrCard elevated>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Today's Appointments
              </Typography>
              {loading ? (
                <SkeletonLoader type="list" count={3} />
              ) : appointments.length > 0 ? (
                <>
                  <List>
                    {appointments.map((apt) => (
                      <ListItem key={apt.id} sx={{ px: 0 }}>
                        <ListItemAvatar>
                          <Avatar>{apt.patient.split(' ').map(n => n[0]).join('')}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={apt.patient}
                          secondary={`${apt.time} - ${apt.type}`}
                        />
                        <Chip
                          label={apt.status}
                          size="small"
                          color={apt.status === 'confirmed' ? 'success' : apt.status === 'in-progress' ? 'info' : 'default'}
                          variant="outlined"
                        />
                      </ListItem>
                    ))}
                  </List>
                  <QivrButton fullWidth variant="outlined" sx={{ mt: 2 }}>
                    View All Appointments
                  </QivrButton>
                </>
              ) : (
                <EmptyState
                  icon={<CalendarIcon />}
                  title="No appointments today"
                  description="Your schedule is clear."
                  sx={{ py: 3 }}
                />
              )}
            </CardContent>
          </QivrCard>
        </Grid>

        {/* Recent Intakes */}
        <Grid item xs={12} md={6}>
          <DashboardSectionCard
            header={
              <Typography variant="h6" gutterBottom>
                Recent Intake Submissions
              </Typography>
            }
          >
            {loading ? (
              <SkeletonLoader type="list" count={2} />
            ) : intakes.length > 0 ? (
              <>
                <List>
                  {intakes.map((intake) => (
                    <ListItem key={intake.id} sx={{ px: 0 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: intake.urgency === 'high' ? 'error.main' : 'grey.500',
                          }}
                        >
                          {intake.patient[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={intake.patient}
                        secondary={`Submitted at ${intake.time}`}
                      />
                      <Chip
                        label={intake.urgency}
                        size="small"
                        color={intake.urgency === 'high' ? 'error' : 'warning'}
                      />
                    </ListItem>
                  ))}
                </List>
                <QivrButton fullWidth variant="outlined" sx={{ mt: 2 }}>
                  Review Intake Queue
                </QivrButton>
              </>
            ) : (
              <EmptyState
                icon={<AssignmentIcon />}
                title="No recent intakes"
                description="No submissions to review."
                sx={{ py: 3 }}
              />
            )}
          </DashboardSectionCard>
        </Grid>
      </Grid>
    </Container>
  );
};

const meta: Meta<typeof DashboardView> = {
  title: 'App Scenarios/Dashboard View',
  component: DashboardView,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A complete dashboard view showcasing stats cards, appointment lists, intake queue, and all major design system components working together.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const BusyDay: Story = {
  render: () => <DashboardView />,
};
