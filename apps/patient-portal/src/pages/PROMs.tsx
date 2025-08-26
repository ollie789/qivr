import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
  Stack,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Notifications as NotificationsIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, isPast, isToday, isTomorrow, differenceInDays } from 'date-fns';
import apiClient from '../services/apiClient';

interface PromInstance {
  id: string;
  templateId: string;
  templateName: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Expired' | 'Cancelled';
  scheduledFor: string;
  completedAt?: string;
  dueDate: string;
  score?: number;
  category?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const PROMs = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [proms, setProms] = useState<PromInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProms();
  }, []);

  const fetchProms = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<PromInstance[]>('/v1/proms/instances');
      setProms(response.data);
    } catch (err) {
      console.error('Error fetching PROMs:', err);
      setError('Failed to load PROMs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Expired':
        return 'error';
      case 'InProgress':
        return 'info';
      default:
        return 'default';
    }
  };

  const getDueDateLabel = (dueDate: string) => {
    const due = new Date(dueDate);
    const daysUntilDue = differenceInDays(due, new Date());
    
    if (isPast(due)) return { text: 'Overdue', color: 'error.main' };
    if (isToday(due)) return { text: 'Due today', color: 'warning.main' };
    if (isTomorrow(due)) return { text: 'Due tomorrow', color: 'info.main' };
    if (daysUntilDue <= 3) return { text: `Due in ${daysUntilDue} days`, color: 'info.main' };
    return { text: format(due, 'MMM d, yyyy'), color: 'text.secondary' };
  };

  const pendingProms = proms.filter(p => p.status === 'Pending' || p.status === 'InProgress');
  const completedProms = proms.filter(p => p.status === 'Completed');
  const expiredProms = proms.filter(p => p.status === 'Expired');

  const renderPromCard = (prom: PromInstance) => {
    const dueDateInfo = prom.status === 'Pending' ? getDueDateLabel(prom.dueDate) : null;
    
    return (
      <Card key={prom.id} sx={{ mb: 2, '&:hover': { boxShadow: 3 } }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Typography variant="h6" gutterBottom>
                {prom.templateName}
              </Typography>
              
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Chip 
                  label={prom.status}
                  size="small"
                  color={getStatusColor(prom.status)}
                />
                {prom.category && (
                  <Chip
                    label={prom.category}
                    size="small"
                    variant="outlined"
                  />
                )}
              </Stack>

              <Stack spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  <ScheduleIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Scheduled: {format(new Date(prom.scheduledFor), 'MMM d, yyyy h:mm a')}
                </Typography>
                
                {prom.status === 'Completed' ? (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      <CheckCircleIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle', color: 'success.main' }} />
                      Completed: {format(new Date(prom.completedAt!), 'MMM d, yyyy h:mm a')}
                    </Typography>
                    {prom.score !== undefined && (
                      <Typography variant="body2">
                        <TrendingUpIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                        Score: {prom.score.toFixed(1)}
                      </Typography>
                    )}
                  </>
                ) : (
                  dueDateInfo && (
                    <Typography variant="body2" sx={{ color: dueDateInfo.color, fontWeight: 500 }}>
                      {dueDateInfo.text}
                    </Typography>
                  )
                )}
              </Stack>
            </Box>
            
            {prom.status === 'Pending' && (
              <Button
                variant="contained"
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate(`/proms/complete/${prom.id}`)}
                size="small"
              >
                Complete
              </Button>
            )}
            
            {prom.status === 'Completed' && (
              <Button
                variant="outlined"
                onClick={() => navigate(`/proms/${prom.id}`)}
                size="small"
              >
                View Results
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchProms}>
            Retry
          </Button>
        }>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          Patient-Reported Outcome Measures (PROMs)
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Complete your assessments to help track your health progress
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending
                  </Typography>
                  <Typography variant="h4">
                    {pendingProms.length}
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, color: 'warning.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completed
                  </Typography>
                  <Typography variant="h4">
                    {completedProms.length}
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completion Rate
                  </Typography>
                  <Typography variant="h4">
                    {proms.length > 0 
                      ? `${Math.round((completedProms.length / proms.length) * 100)}%`
                      : 'N/A'
                    }
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
              {proms.length > 0 && (
                <LinearProgress 
                  variant="determinate" 
                  value={(completedProms.length / proms.length) * 100}
                  sx={{ mt: 2 }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs for different PROM states */}
      <Card>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tab label={`Pending (${pendingProms.length})`} />
          <Tab label={`Completed (${completedProms.length})`} />
          {expiredProms.length > 0 && <Tab label={`Expired (${expiredProms.length})`} />}
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box px={2}>
            {pendingProms.length === 0 ? (
              <Alert severity="info">
                No pending assessments at this time.
              </Alert>
            ) : (
              pendingProms.map(renderPromCard)
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box px={2}>
            {completedProms.length === 0 ? (
              <Alert severity="info">
                No completed assessments yet.
              </Alert>
            ) : (
              completedProms.map(renderPromCard)
            )}
          </Box>
        </TabPanel>
        
        {expiredProms.length > 0 && (
          <TabPanel value={tabValue} index={2}>
            <Box px={2}>
              {expiredProms.map(renderPromCard)}
            </Box>
          </TabPanel>
        )}
      </Card>
    </Box>
  );
};
