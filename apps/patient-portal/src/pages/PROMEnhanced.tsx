import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  Button,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Badge,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Tabs,
  Tab,
  Divider,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  RadioGroup,
  Radio,
  Checkbox,
  FormGroup,
  Slider,
  Rating,
  Select,
  MenuItem,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Tooltip,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Timer as TimerIcon,
  PlayArrow as StartIcon,
  Save as SaveIcon,
  Send as SendIcon,
  ExpandMore as ExpandMoreIcon,
  Psychology as PsychologyIcon,
  Favorite as HeartIcon,
  LocalHospital as MedicalIcon,
  SentimentSatisfied as SatisfiedIcon,
  SentimentDissatisfied as DissatisfiedIcon,
  SentimentNeutral as NeutralIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Info as InfoIcon,
  Star as StarIcon,
  EmojiEvents as AchievementIcon,
  NotificationsActive as ReminderIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  RadioButtonChecked as RadioIcon,
  CheckBox as CheckboxIcon,
  LinearScale as ScaleIcon,
  ShortText as TextIcon,
  CalendarToday as DateIcon,
  AccessTime as TimeIcon,
  Close as CloseIcon,
  CalendarToday,
  PlayArrow,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays, addDays, isPast } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import apiClient from '../services/apiClient';

// Interfaces
interface PROMTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: number; // in minutes
  questions: PROMQuestion[];
  scoringMethod: 'sum' | 'average' | 'weighted' | 'custom';
  maxScore?: number;
  tags?: string[];
  frequency?: string; // daily, weekly, monthly
}

interface PROMQuestion {
  id: string;
  text: string;
  type: 'text' | 'radio' | 'checkbox' | 'scale' | 'rating' | 'date' | 'time' | 'number';
  required: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  weight?: number;
  helpText?: string;
}

interface PROMInstance {
  id: string;
  templateId: string;
  templateName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'expired';
  assignedDate: string;
  dueDate: string;
  startedDate?: string;
  completedDate?: string;
  score?: number;
  responses?: Record<string, any>;
  feedback?: string;
  priority?: 'high' | 'medium' | 'low';
}

interface PROMHistory {
  id: string;
  templateName: string;
  completedDate: string;
  score: number;
  maxScore: number;
  percentageScore: number;
  trend?: 'improving' | 'stable' | 'declining';
}

interface PROMStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  averageScore: number;
  completionRate: number;
  streak: number;
  lastCompleted?: string;
  nextDue?: string;
}

const PROMEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPROM, setSelectedPROM] = useState<PROMInstance | null>(null);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Fetch PROM instances
  const { data: promInstances, isLoading: instancesLoading } = useQuery({
    queryKey: ['promInstances'],
    queryFn: async () => {
      const response = await apiClient.get('/api/PromInstance');
      return response.data;
    },
  });

  // Fetch PROM history
  const { data: promHistory } = useQuery({
    queryKey: ['promHistory'],
    queryFn: async () => {
      const response = await apiClient.get('/api/PromInstance/history');
      return response.data;
    },
  });

  // Fetch PROM statistics
  const { data: promStats } = useQuery({
    queryKey: ['promStats'],
    queryFn: async () => {
      const response = await apiClient.get('/api/PromInstance/stats');
      return response.data;
    },
  });

  // Submit PROM responses
  const submitPROMMutation = useMutation({
    mutationFn: async (data: { instanceId: string; responses: Record<string, any>; timeSpent: number }) => {
      const response = await apiClient.post(`/api/PromInstance/${data.instanceId}/submit`, {
        responses: data.responses,
        timeSpent: data.timeSpent,
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['promInstances'] });
      queryClient.invalidateQueries({ queryKey: ['promHistory'] });
      queryClient.invalidateQueries({ queryKey: ['promStats'] });
      setCompletionDialogOpen(false);
      setSelectedPROM(null);
      setResponses({});
      setCurrentQuestionIndex(0);
    },
  });

  // Save draft
  const saveDraftMutation = useMutation({
    mutationFn: async (data: { instanceId: string; responses: Record<string, any>; questionIndex: number }) => {
      const response = await apiClient.post(`/api/PromInstance/${data.instanceId}/draft`, {
        responses: data.responses,
        lastQuestionIndex: data.questionIndex,
      });
      return response.data;
    },
  });

  // Timer effect
  useEffect(() => {
    if (startTime) {
      const interval = setInterval(() => {
        setTimeSpent(Math.floor((new Date().getTime() - startTime.getTime()) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [startTime]);

  // Group instances by category
  const groupedInstances = promInstances?.reduce((acc: any, instance: PROMInstance) => {
    const category = instance.templateName.split(' ')[0]; // Simple categorization
    if (!acc[category]) acc[category] = [];
    acc[category].push(instance);
    return acc;
  }, {}) || {};

  // Calculate scores for charts
  const scoreHistory = promHistory?.slice(-10).map((h: PROMHistory) => ({
    date: format(parseISO(h.completedDate), 'MMM dd'),
    score: h.percentageScore,
    name: h.templateName.substring(0, 15),
  })) || [];

  const categoryScores = promHistory?.reduce((acc: any, h: PROMHistory) => {
    const category = h.templateName.split(' ')[0];
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += h.percentageScore;
    acc[category].count += 1;
    return acc;
  }, {}) || {};

  const categoryChartData = Object.entries(categoryScores).map(([category, data]: [string, any]) => ({
    category,
    score: Math.round(data.total / data.count),
  }));

  // Upcoming PROMs
  const upcomingPROMs = promInstances
    ?.filter((p: PROMInstance) => p.status === 'pending')
    .sort((a: PROMInstance, b: PROMInstance) => 
      new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5) || [];

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircleIcon color="success" />;
      case 'in-progress': return <ScheduleIcon color="info" />;
      case 'pending': return <AssignmentIcon color="warning" />;
      case 'expired': return <WarningIcon color="error" />;
      default: return <AssignmentIcon />;
    }
  };

  const getQuestionIcon = (type: string) => {
    switch (type) {
      case 'radio': return <RadioIcon />;
      case 'checkbox': return <CheckboxIcon />;
      case 'scale': return <ScaleIcon />;
      case 'rating': return <StarIcon />;
      case 'text': return <TextIcon />;
      case 'date': return <DateIcon />;
      case 'time': return <TimeIcon />;
      default: return <AssignmentIcon />;
    }
  };

  const handleStartPROM = (instance: PROMInstance) => {
    setSelectedPROM(instance);
    setCompletionDialogOpen(true);
    setStartTime(new Date());
    setCurrentQuestionIndex(0);
    setResponses({});
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (selectedPROM && currentQuestionIndex < selectedPROM.templateName.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      // Auto-save draft every 3 questions
      if ((currentQuestionIndex + 1) % 3 === 0) {
        saveDraftMutation.mutate({
          instanceId: selectedPROM.id,
          responses,
          questionIndex: currentQuestionIndex + 1,
        });
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (selectedPROM) {
      submitPROMMutation.mutate({
        instanceId: selectedPROM.id,
        responses,
        timeSpent,
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Patient Reported Outcomes (PROM)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your health progress by completing questionnaires from your care team
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Pending
                  </Typography>
                  <Typography variant="h4">
                    {promStats?.pending || 0}
                  </Typography>
                  {promStats?.nextDue && (
                    <Typography variant="caption" color="text.secondary">
                      Next due: {format(parseISO(promStats.nextDue), 'MMM dd')}
                    </Typography>
                  )}
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AssignmentIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Completion Rate
                  </Typography>
                  <Typography variant="h4">
                    {promStats?.completionRate || 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={promStats?.completionRate || 0} 
                    sx={{ mt: 1 }}
                    color="success"
                  />
                </Box>
                <CircularProgress
                  variant="determinate"
                  value={promStats?.completionRate || 0}
                  size={50}
                  thickness={4}
                  sx={{ color: 'success.main' }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Average Score
                  </Typography>
                  <Typography variant="h4">
                    {promStats?.averageScore || 0}%
                  </Typography>
                  <Box display="flex" alignItems="center" sx={{ mt: 0.5 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                      +5% from last month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <TrendingUpIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Completion Streak
                  </Typography>
                  <Typography variant="h4">
                    {promStats?.streak || 0} days
                  </Typography>
                  <Box display="flex" alignItems="center" sx={{ mt: 0.5 }}>
                    <AchievementIcon color="warning" fontSize="small" />
                    <Typography variant="caption" color="warning.main" sx={{ ml: 0.5 }}>
                      Keep it up!
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AchievementIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Left Column - Active PROMs */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Active Questionnaires</Typography>
              <Chip 
                label={`${upcomingPROMs.length} pending`} 
                color="warning" 
                size="small"
              />
            </Box>
            
            <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
              <Tab label="All" />
              <Tab label="High Priority" />
              <Tab label="Due Soon" />
              <Tab label="By Category" />
            </Tabs>

            {activeTab === 3 ? (
              // Category View
              <Box>
                {Object.entries(groupedInstances).map(([category, instances]: [string, any]) => (
                  <Accordion 
                    key={category}
                    expanded={expandedCategory === category}
                    onChange={() => setExpandedCategory(expandedCategory === category ? null : category)}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                        <Typography>{category}</Typography>
                        <Chip label={instances.length} size="small" sx={{ mr: 2 }} />
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {instances.map((instance: PROMInstance) => (
                          <ListItem key={instance.id} sx={{ mb: 1 }}>
                            <Card sx={{ width: '100%' }}>
                              <CardContent>
                                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                                  <Box>
                                    <Typography variant="h6">
                                      {instance.templateName}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary" gutterBottom>
                                      Due: {format(parseISO(instance.dueDate), 'MMM dd, yyyy')}
                                    </Typography>
                                  </Box>
                                  <Button
                                    variant="contained"
                                    size="small"
                                    startIcon={<StartIcon />}
                                    onClick={() => handleStartPROM(instance)}
                                  >
                                    Start
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            ) : (
              // List View
              <Grid container spacing={2}>
                {promInstances
                  ?.filter((p: PROMInstance) => {
                    if (activeTab === 1) return p.priority === 'high';
                    if (activeTab === 2) return differenceInDays(parseISO(p.dueDate), new Date()) <= 3;
                    return p.status === 'pending';
                  })
                  .map((instance: PROMInstance) => (
                    <Grid item xs={12} key={instance.id}>
                      <Card>
                        <CardContent>
                          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                            <Box display="flex" gap={2}>
                              <Avatar sx={{ bgcolor: 'primary.light' }}>
                                {getStatusIcon(instance.status)}
                              </Avatar>
                              <Box>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Typography variant="h6">
                                    {instance.templateName}
                                  </Typography>
                                  {instance.priority && (
                                    <Chip 
                                      label={instance.priority} 
                                      size="small"
                                      color={getPriorityColor(instance.priority) as any}
                                    />
                                  )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Assigned: {format(parseISO(instance.assignedDate), 'MMM dd, yyyy')}
                                </Typography>
                                <Box display="flex" alignItems="center" gap={2}>
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <TimerIcon fontSize="small" color="action" />
                                    <Typography variant="caption">15 min</Typography>
                                  </Box>
                                  <Box display="flex" alignItems="center" gap={0.5}>
                                    <CalendarToday fontSize="small" color="action" />
                                    <Typography variant="caption">
                                      Due: {format(parseISO(instance.dueDate), 'MMM dd')}
                                    </Typography>
                                  </Box>
                                  {isPast(parseISO(instance.dueDate)) && (
                                    <Chip 
                                      label="Overdue" 
                                      size="small" 
                                      color="error"
                                    />
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            <Box>
                              {instance.status === 'in-progress' ? (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  startIcon={<PlayArrow />}
                                  onClick={() => handleStartPROM(instance)}
                                >
                                  Resume
                                </Button>
                              ) : (
                                <Button
                                  variant="contained"
                                  size="small"
                                  startIcon={<StartIcon />}
                                  onClick={() => handleStartPROM(instance)}
                                  disabled={instance.status !== 'pending'}
                                >
                                  Start
                                </Button>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            )}

            {promInstances?.filter((p: PROMInstance) => p.status === 'pending').length === 0 && (
              <Box textAlign="center" py={4}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  All caught up!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You have no pending questionnaires at this time
                </Typography>
              </Box>
            )}
          </Paper>

          {/* Score History Chart */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Score Trends
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={scoreHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6}
                  name="Score %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Right Column - History & Insights */}
        <Grid item xs={12} md={4}>
          {/* Recent Completions */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Completions
            </Typography>
            <List dense>
              {promHistory?.slice(0, 5).map((history: PROMHistory) => (
                <ListItem key={history.id}>
                  <ListItemIcon>
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'success.light' }}>
                      <CheckCircleIcon fontSize="small" />
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText
                    primary={history.templateName}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {format(parseISO(history.completedDate), 'MMM dd, yyyy')}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1}>
                          <LinearProgress 
                            variant="determinate" 
                            value={history.percentageScore} 
                            sx={{ width: 60, height: 4 }}
                            color={history.percentageScore >= 70 ? 'success' : 'warning'}
                          />
                          <Typography variant="caption">
                            {history.percentageScore}%
                          </Typography>
                        </Box>
                      </Box>
                    }
                  />
                  {history.trend && (
                    <ListItemSecondaryAction>
                      <Chip
                        label={history.trend}
                        size="small"
                        color={
                          history.trend === 'improving' ? 'success' :
                          history.trend === 'declining' ? 'error' : 'default'
                        }
                      />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Category Performance */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Category Performance
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={categoryChartData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="category" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar 
                  name="Score" 
                  dataKey="score" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.6} 
                />
                <ChartTooltip />
              </RadarChart>
            </ResponsiveContainer>
          </Paper>

          {/* Achievements */}
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Achievements
            </Typography>
            <Grid container spacing={2}>
              {[
                { icon: <AchievementIcon />, label: '7 Day Streak', color: 'warning' },
                { icon: <StarIcon />, label: 'High Scorer', color: 'success' },
                { icon: <CheckCircleIcon />, label: '10 Completed', color: 'info' },
                { icon: <TimerIcon />, label: 'Quick Responder', color: 'primary' },
              ].map((achievement, index) => (
                <Grid item xs={6} key={index}>
                  <Box textAlign="center">
                    <Avatar 
                      sx={{ 
                        width: 56, 
                        height: 56, 
                        bgcolor: `${achievement.color}.light`,
                        mx: 'auto',
                        mb: 1
                      }}
                    >
                      {achievement.icon}
                    </Avatar>
                    <Typography variant="caption">
                      {achievement.label}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* PROM Completion Dialog */}
      <Dialog 
        open={completionDialogOpen} 
        onClose={() => setCompletionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">
              {selectedPROM?.templateName}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <TimerIcon />
                <Typography>{formatTime(timeSpent)}</Typography>
              </Box>
              <IconButton onClick={() => setCompletionDialogOpen(false)}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={(currentQuestionIndex + 1) / 10 * 100} 
            sx={{ mt: 2 }}
          />
          <Typography variant="caption" color="text.secondary">
            Question {currentQuestionIndex + 1} of 10
          </Typography>
        </DialogTitle>
        <DialogContent>
          {/* Sample question rendering - would be dynamic based on template */}
          <Box sx={{ minHeight: 200 }}>
            <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
              <Avatar sx={{ bgcolor: 'primary.light' }}>
                {getQuestionIcon('scale')}
              </Avatar>
              <Box flex={1}>
                <Typography variant="h6" gutterBottom>
                  How would you rate your overall pain level today?
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Please rate on a scale of 0 (no pain) to 10 (worst pain imaginable)
                </Typography>
                
                {/* Sample scale question */}
                <Box sx={{ mt: 3, px: 2 }}>
                  <Slider
                    value={responses[`q${currentQuestionIndex}`] || 5}
                    onChange={(e, value) => handleResponseChange(`q${currentQuestionIndex}`, value)}
                    step={1}
                    marks
                    min={0}
                    max={10}
                    valueLabelDisplay="on"
                  />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption">No pain</Typography>
                    <Typography variant="caption">Worst pain</Typography>
                  </Box>
                </Box>

                {/* Pain location selector */}
                <Typography variant="body2" sx={{ mt: 3 }} gutterBottom>
                  Where do you feel the pain? (Select all that apply)
                </Typography>
                <FormGroup row>
                  {['Head', 'Neck', 'Back', 'Joints', 'Other'].map(location => (
                    <FormControlLabel
                      key={location}
                      control={<Checkbox />}
                      label={location}
                    />
                  ))}
                </FormGroup>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            startIcon={<BackIcon />}
          >
            Previous
          </Button>
          <Box flex={1} />
          <Button 
            onClick={() => {
              saveDraftMutation.mutate({
                instanceId: selectedPROM!.id,
                responses,
                questionIndex: currentQuestionIndex,
              });
              setCompletionDialogOpen(false);
            }}
            startIcon={<SaveIcon />}
          >
            Save Draft
          </Button>
          {currentQuestionIndex < 9 ? (
            <Button 
              variant="contained"
              onClick={handleNext}
              endIcon={<NextIcon />}
            >
              Next
            </Button>
          ) : (
            <Button 
              variant="contained"
              onClick={handleSubmit}
              startIcon={<SendIcon />}
              color="success"
            >
              Submit
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PROMEnhanced;