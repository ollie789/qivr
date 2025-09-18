import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemAvatar,
  Divider,
  Stack,
  LinearProgress,
  CircularProgress,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Rating,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon,
  Favorite as HeartIcon,
  LocalHospital as MedicalIcon,
  Assignment as PROMIcon,
  Science as LabIcon,
  MedicalServices as MedicationIcon,
  CalendarMonth as CalendarIcon,
  Speed as SpeedIcon,
  Psychology as MentalHealthIcon,
  DirectionsRun as ActivityIcon,
  Restaurant as NutritionIcon,
  Hotel as SleepIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CompareArrows as CompareIcon,
  DateRange as DateRangeIcon,
  FilterList as FilterIcon,
  Bloodtype as BloodIcon,
  MonitorHeart as VitalIcon,
  EmojiEvents as GoalIcon,
  Flag as MilestoneIcon,
  AutoGraph as PredictiveIcon,
} from '@mui/icons-material';
import { format, parseISO, subDays, subMonths, differenceInDays, startOfWeek, endOfWeek } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie,
  RadarChart, Radar, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip,
  ResponsiveContainer, Legend, Cell, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine, ReferenceArea, ComposedChart
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import apiClient from '../services/apiClient';

// Interfaces
interface HealthMetric {
  id: string;
  category: string;
  name: string;
  value: number;
  unit: string;
  date: string;
  trend: 'up' | 'down' | 'stable';
  percentageChange: number;
  status: 'good' | 'warning' | 'critical';
  target?: number;
}

interface PROMAnalytics {
  templateName: string;
  completionRate: number;
  averageScore: number;
  trendData: Array<{ date: string; score: number }>;
  categoryScores: Record<string, number>;
  responseTime: number; // in minutes
}

interface HealthGoal {
  id: string;
  title: string;
  category: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  progress: number;
  status: 'on-track' | 'behind' | 'achieved';
}

interface Correlation {
  metric1: string;
  metric2: string;
  correlation: number;
  significance: 'high' | 'medium' | 'low';
}

const AnalyticsEnhanced: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [activeTab, setActiveTab] = useState(0);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [compareMode, setCompareMode] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // Fetch analytics data
  const { data: healthMetrics = [] } = useQuery({
    queryKey: ['healthMetrics', timeRange],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/Analytics/health-metrics', {
          params: { timeRange },
        });
        return response.data;
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  const { data: promAnalytics = [] } = useQuery({
    queryKey: ['promAnalytics', timeRange],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/Analytics/prom-analytics', {
          params: { timeRange },
        });
        return response.data;
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  const { data: healthGoals = [] } = useQuery({
    queryKey: ['healthGoals'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/Analytics/health-goals');
        return response.data;
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  const { data: correlations = [] } = useQuery({
    queryKey: ['correlations'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/Analytics/correlations');
        return response.data;
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  // Mock data for demonstration
  const vitalTrendsData = [
    { date: 'Jan 1', bp_systolic: 120, bp_diastolic: 80, heartRate: 72, weight: 170, glucose: 95 },
    { date: 'Jan 8', bp_systolic: 122, bp_diastolic: 82, heartRate: 75, weight: 169, glucose: 92 },
    { date: 'Jan 15', bp_systolic: 118, bp_diastolic: 78, heartRate: 70, weight: 168, glucose: 90 },
    { date: 'Jan 22', bp_systolic: 119, bp_diastolic: 79, heartRate: 71, weight: 167, glucose: 93 },
    { date: 'Jan 29', bp_systolic: 117, bp_diastolic: 77, heartRate: 69, weight: 166, glucose: 89 },
  ];

  const promScoreTrends = [
    { date: 'Week 1', physical: 75, mental: 82, pain: 65, overall: 74 },
    { date: 'Week 2', physical: 78, mental: 85, pain: 62, overall: 75 },
    { date: 'Week 3', physical: 80, mental: 83, pain: 60, overall: 74 },
    { date: 'Week 4', physical: 82, mental: 87, pain: 58, overall: 76 },
    { date: 'Week 5', physical: 85, mental: 89, pain: 55, overall: 76 },
  ];

  const healthScoreBreakdown = [
    { category: 'Vitals', score: 85, color: '#4CAF50' },
    { category: 'Lab Results', score: 78, color: '#2196F3' },
    { category: 'PROM Scores', score: 72, color: '#FF9800' },
    { category: 'Medication', score: 90, color: '#9C27B0' },
    { category: 'Activity', score: 65, color: '#F44336' },
  ];

  const wellbeingRadarData = [
    { axis: 'Physical', value: 80, fullMark: 100 },
    { axis: 'Mental', value: 75, fullMark: 100 },
    { axis: 'Social', value: 70, fullMark: 100 },
    { axis: 'Sleep', value: 85, fullMark: 100 },
    { axis: 'Nutrition', value: 72, fullMark: 100 },
    { axis: 'Activity', value: 68, fullMark: 100 },
  ];

  const predictiveInsights = [
    {
      type: 'positive',
      title: 'Improving Blood Pressure',
      description: 'Your blood pressure has shown consistent improvement over the past month',
      impact: '+12%',
      confidence: 85,
    },
    {
      type: 'warning',
      title: 'Activity Level Below Target',
      description: 'Your physical activity is 30% below recommended levels',
      impact: '-8%',
      confidence: 92,
    },
    {
      type: 'neutral',
      title: 'Stable Mental Health Scores',
      description: 'Your mental health assessments show stable positive trends',
      impact: '0%',
      confidence: 78,
    },
  ];

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'vitals': return <VitalIcon />;
      case 'lab': return <LabIcon />;
      case 'prom': return <PROMIcon />;
      case 'medication': return <MedicationIcon />;
      case 'activity': return <ActivityIcon />;
      case 'mental': return <MentalHealthIcon />;
      case 'sleep': return <SleepIcon />;
      case 'nutrition': return <NutritionIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'success';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const calculateOverallHealthScore = () => {
    const total = healthScoreBreakdown.reduce((acc, item) => acc + item.score, 0);
    return Math.round(total / healthScoreBreakdown.length);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Health Analytics & Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track your health progress and gain insights from your data
          </Typography>
        </Box>

        {/* Controls Bar */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <MenuItem value="7days">Last 7 Days</MenuItem>
                <MenuItem value="30days">Last 30 Days</MenuItem>
                <MenuItem value="90days">Last 90 Days</MenuItem>
                <MenuItem value="1year">Last Year</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
            
            {timeRange === 'custom' && (
              <>
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </>
            )}
            
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="overview">Overview</ToggleButton>
              <ToggleButton value="detailed">Detailed</ToggleButton>
            </ToggleButtonGroup>
            
            <Box flex={1} />
            
            <Button startIcon={<CompareIcon />} onClick={() => setCompareMode(!compareMode)}>
              Compare
            </Button>
            <Button startIcon={<DownloadIcon />}>Export</Button>
            <Button startIcon={<ShareIcon />}>Share</Button>
          </Stack>
        </Paper>

        {/* Overall Health Score */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Overall Health Score
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="center" sx={{ my: 3 }}>
                  <Box position="relative" display="inline-flex">
                    <CircularProgress
                      variant="determinate"
                      value={calculateOverallHealthScore()}
                      size={120}
                      thickness={4}
                      sx={{ color: 'success.main' }}
                    />
                    <Box
                      top={0}
                      left={0}
                      bottom={0}
                      right={0}
                      position="absolute"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Box textAlign="center">
                        <Typography variant="h3" component="div">
                          {calculateOverallHealthScore()}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          /100
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
                <Stack spacing={1}>
                  {healthScoreBreakdown.map((item) => (
                    <Box key={item.category} display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ flex: 1 }}>
                        {item.category}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={item.score}
                        sx={{ width: 100, mx: 2 }}
                        color={item.score >= 80 ? 'success' : item.score >= 60 ? 'warning' : 'error'}
                      />
                      <Typography variant="body2">{item.score}</Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Key Health Metrics
                </Typography>
                <List>
                  {[
                    { label: 'Blood Pressure', value: '118/78', trend: 'down', good: true },
                    { label: 'Heart Rate', value: '72 bpm', trend: 'stable', good: true },
                    { label: 'Weight', value: '166 lbs', trend: 'down', good: true },
                    { label: 'Blood Sugar', value: '89 mg/dL', trend: 'down', good: true },
                    { label: 'Sleep Quality', value: '85%', trend: 'up', good: true },
                  ].map((metric, index) => (
                    <React.Fragment key={metric.label}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: metric.good ? 'success.light' : 'warning.light' }}>
                            <VitalIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={metric.label}
                          secondary={metric.value}
                        />
                        <Chip
                          icon={
                            metric.trend === 'up' ? <TrendingUpIcon /> :
                            metric.trend === 'down' ? <TrendingDownIcon /> :
                            <TrendingUpIcon />
                          }
                          label={metric.trend}
                          size="small"
                          color={metric.good ? 'success' : 'warning'}
                        />
                      </ListItem>
                      {index < 4 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Wellbeing Assessment
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={wellbeingRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="axis" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Main Analytics Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
            <Tab label="Vital Trends" icon={<VitalIcon />} iconPosition="start" />
            <Tab label="PROM Analytics" icon={<PROMIcon />} iconPosition="start" />
            <Tab label="Health Goals" icon={<GoalIcon />} iconPosition="start" />
            <Tab label="Predictive Insights" icon={<PredictiveIcon />} iconPosition="start" />
            <Tab label="Correlations" icon={<CompareIcon />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && (
              // Vital Trends Tab
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Vital Signs Over Time
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <ComposedChart data={vitalTrendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <ChartTooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="bp_systolic"
                        fill="#8884d8"
                        stroke="#8884d8"
                        fillOpacity={0.3}
                        name="Systolic BP"
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="bp_diastolic"
                        fill="#82ca9d"
                        stroke="#82ca9d"
                        fillOpacity={0.3}
                        name="Diastolic BP"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ffc658"
                        name="Heart Rate"
                      />
                      <Bar
                        yAxisId="right"
                        dataKey="glucose"
                        fill="#ff7c7c"
                        name="Blood Sugar"
                      />
                      <ReferenceLine y={120} stroke="red" strokeDasharray="3 3" label="BP Target" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Weight Trend
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={vitalTrendsData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[160, 175]} />
                          <ChartTooltip />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#8884d8"
                            strokeWidth={2}
                            dot={{ fill: '#8884d8' }}
                          />
                          <ReferenceLine y={165} stroke="green" strokeDasharray="3 3" label="Target" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Recent Lab Results
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Test</TableCell>
                              <TableCell>Value</TableCell>
                              <TableCell>Range</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {[
                              { test: 'Cholesterol', value: '185', range: '<200', status: 'good' },
                              { test: 'HDL', value: '52', range: '>40', status: 'good' },
                              { test: 'LDL', value: '112', range: '<100', status: 'warning' },
                              { test: 'Triglycerides', value: '145', range: '<150', status: 'good' },
                              { test: 'HbA1c', value: '5.4', range: '<5.7', status: 'good' },
                            ].map((lab) => (
                              <TableRow key={lab.test}>
                                <TableCell>{lab.test}</TableCell>
                                <TableCell>{lab.value}</TableCell>
                                <TableCell>{lab.range}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={lab.status}
                                    size="small"
                                    color={getStatusColor(lab.status) as any}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 1 && (
              // PROM Analytics Tab
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    PROM Score Trends by Category
                  </Typography>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={promScoreTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="physical"
                        stroke="#4CAF50"
                        strokeWidth={2}
                        name="Physical Health"
                      />
                      <Line
                        type="monotone"
                        dataKey="mental"
                        stroke="#2196F3"
                        strokeWidth={2}
                        name="Mental Health"
                      />
                      <Line
                        type="monotone"
                        dataKey="pain"
                        stroke="#FF9800"
                        strokeWidth={2}
                        name="Pain Level"
                      />
                      <Line
                        type="monotone"
                        dataKey="overall"
                        stroke="#9C27B0"
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        name="Overall"
                      />
                      <ReferenceArea y1={70} y2={100} stroke="#4CAF50" fillOpacity={0.1} fill="#4CAF50" />
                    </LineChart>
                  </ResponsiveContainer>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        PROM Completion Stats
                      </Typography>
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Completion Rate</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LinearProgress
                              variant="determinate"
                              value={85}
                              sx={{ width: 100 }}
                              color="success"
                            />
                            <Typography variant="body2">85%</Typography>
                          </Box>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Average Response Time</Typography>
                          <Typography variant="body2">12 min</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Total Completed</Typography>
                          <Typography variant="body2">24</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="body2">Streak</Typography>
                          <Chip label="7 days" size="small" color="success" />
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Category Performance
                      </Typography>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={[
                          { category: 'Physical', score: 82, target: 75 },
                          { category: 'Mental', score: 87, target: 80 },
                          { category: 'Social', score: 75, target: 70 },
                          { category: 'Functional', score: 79, target: 75 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="category" />
                          <YAxis domain={[0, 100]} />
                          <ChartTooltip />
                          <Bar dataKey="score" fill="#8884d8" name="Your Score" />
                          <Bar dataKey="target" fill="#82ca9d" name="Target" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 2 && (
              // Health Goals Tab
              <Grid container spacing={3}>
                {[
                  {
                    title: 'Weight Loss',
                    target: 10,
                    current: 4,
                    unit: 'lbs',
                    deadline: '2024-03-01',
                    progress: 40,
                    status: 'on-track',
                    icon: <ScaleIcon />,
                  },
                  {
                    title: 'Daily Steps',
                    target: 10000,
                    current: 7500,
                    unit: 'steps',
                    deadline: 'Daily',
                    progress: 75,
                    status: 'behind',
                    icon: <ActivityIcon />,
                  },
                  {
                    title: 'Blood Pressure',
                    target: 120,
                    current: 118,
                    unit: 'mmHg',
                    deadline: '2024-02-15',
                    progress: 95,
                    status: 'achieved',
                    icon: <HeartIcon />,
                  },
                  {
                    title: 'Sleep Duration',
                    target: 8,
                    current: 7.2,
                    unit: 'hours',
                    deadline: 'Daily',
                    progress: 90,
                    status: 'on-track',
                    icon: <SleepIcon />,
                  },
                ].map((goal) => (
                  <Grid item xs={12} md={6} key={goal.title}>
                    <Card>
                      <CardContent>
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                          <Avatar sx={{ bgcolor: `${goal.status === 'achieved' ? 'success' : goal.status === 'on-track' ? 'info' : 'warning'}.light` }}>
                            {goal.icon}
                          </Avatar>
                          <Box flex={1}>
                            <Typography variant="h6">{goal.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              Target: {goal.target} {goal.unit} by {goal.deadline}
                            </Typography>
                          </Box>
                          <Chip
                            label={goal.status}
                            color={goal.status === 'achieved' ? 'success' : goal.status === 'on-track' ? 'info' : 'warning'}
                            size="small"
                          />
                        </Box>
                        <Box>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="body2">Progress</Typography>
                            <Typography variant="body2">
                              {goal.current} / {goal.target} {goal.unit}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={goal.progress}
                            sx={{ height: 8, borderRadius: 4 }}
                            color={goal.status === 'achieved' ? 'success' : goal.status === 'on-track' ? 'info' : 'warning'}
                          />
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                            {goal.progress}% complete
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {activeTab === 3 && (
              // Predictive Insights Tab
              <Grid container spacing={3}>
                {predictiveInsights.map((insight, index) => (
                  <Grid item xs={12} key={index}>
                    <Alert
                      severity={insight.type === 'positive' ? 'success' : insight.type === 'warning' ? 'warning' : 'info'}
                      icon={insight.type === 'positive' ? <TrendingUpIcon /> : insight.type === 'warning' ? <WarningIcon /> : <InfoIcon />}
                    >
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            {insight.title}
                          </Typography>
                          <Typography variant="body2">
                            {insight.description}
                          </Typography>
                        </Box>
                        <Box textAlign="center">
                          <Typography variant="h4" color={insight.type === 'positive' ? 'success.main' : insight.type === 'warning' ? 'warning.main' : 'info.main'}>
                            {insight.impact}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {insight.confidence}% confidence
                          </Typography>
                        </Box>
                      </Box>
                    </Alert>
                  </Grid>
                ))}

                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        30-Day Health Projection
                      </Typography>
                      <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={[
                          { day: 'Today', actual: 75, projected: 75 },
                          { day: 'Day 7', actual: null, projected: 77 },
                          { day: 'Day 14', actual: null, projected: 79 },
                          { day: 'Day 21', actual: null, projected: 82 },
                          { day: 'Day 30', actual: null, projected: 85 },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis domain={[70, 90]} />
                          <ChartTooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="projected"
                            stroke="#8884d8"
                            fill="#8884d8"
                            fillOpacity={0.3}
                            strokeDasharray="5 5"
                            name="Projected Score"
                          />
                          <Area
                            type="monotone"
                            dataKey="actual"
                            stroke="#82ca9d"
                            fill="#82ca9d"
                            fillOpacity={0.6}
                            name="Actual Score"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}

            {activeTab === 4 && (
              // Correlations Tab
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Health Metric Correlations
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        Discover relationships between different health metrics
                      </Typography>
                      <ResponsiveContainer width="100%" height={400}>
                        <ScatterChart>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="x" name="Sleep Hours" unit="hrs" />
                          <YAxis dataKey="y" name="Energy Level" unit="%" />
                          <ChartTooltip cursor={{ strokeDasharray: '3 3' }} />
                          <Scatter
                            name="Sleep vs Energy"
                            data={[
                              { x: 5, y: 45 },
                              { x: 6, y: 58 },
                              { x: 7, y: 72 },
                              { x: 7.5, y: 78 },
                              { x: 8, y: 85 },
                              { x: 8.5, y: 88 },
                              { x: 9, y: 82 },
                            ]}
                            fill="#8884d8"
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Metric 1</TableCell>
                          <TableCell>Metric 2</TableCell>
                          <TableCell>Correlation</TableCell>
                          <TableCell>Significance</TableCell>
                          <TableCell>Insight</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          {
                            metric1: 'Sleep Quality',
                            metric2: 'Energy Level',
                            correlation: 0.82,
                            significance: 'high',
                            insight: 'Better sleep strongly correlates with higher energy',
                          },
                          {
                            metric1: 'Exercise Minutes',
                            metric2: 'Mood Score',
                            correlation: 0.75,
                            significance: 'high',
                            insight: 'Physical activity positively impacts mood',
                          },
                          {
                            metric1: 'Stress Level',
                            metric2: 'Blood Pressure',
                            correlation: 0.68,
                            significance: 'medium',
                            insight: 'Higher stress moderately increases BP',
                          },
                          {
                            metric1: 'Water Intake',
                            metric2: 'Skin Health',
                            correlation: 0.45,
                            significance: 'low',
                            insight: 'Hydration shows minor impact on skin condition',
                          },
                        ].map((corr, index) => (
                          <TableRow key={index}>
                            <TableCell>{corr.metric1}</TableCell>
                            <TableCell>{corr.metric2}</TableCell>
                            <TableCell>
                              <Box display="flex" alignItems="center" gap={1}>
                                <LinearProgress
                                  variant="determinate"
                                  value={corr.correlation * 100}
                                  sx={{ width: 60 }}
                                  color={corr.correlation > 0.7 ? 'success' : corr.correlation > 0.4 ? 'warning' : 'info'}
                                />
                                <Typography variant="body2">
                                  {corr.correlation}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={corr.significance}
                                size="small"
                                color={corr.significance === 'high' ? 'error' : corr.significance === 'medium' ? 'warning' : 'info'}
                              />
                            </TableCell>
                            <TableCell>{corr.insight}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            )}
          </Box>
        </Paper>

        {/* Action Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'primary.light' }}>
                    <CalendarIcon />
                  </Avatar>
                  <Typography variant="h6">Upcoming</Typography>
                </Box>
                <Stack spacing={1}>
                  <Alert severity="info">
                    PROM questionnaire due tomorrow
                  </Alert>
                  <Alert severity="warning">
                    Lab work scheduled for Feb 15
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'success.light' }}>
                    <MilestoneIcon />
                  </Avatar>
                  <Typography variant="h6">Milestones</Typography>
                </Box>
                <Stack spacing={1}>
                  <Alert severity="success">
                    30-day exercise streak achieved!
                  </Alert>
                  <Alert severity="success">
                    Blood pressure goal reached
                  </Alert>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar sx={{ bgcolor: 'warning.light' }}>
                    <LightbulbIcon />
                  </Avatar>
                  <Typography variant="h6">Recommendations</Typography>
                </Box>
                <Stack spacing={1}>
                  <Typography variant="body2">
                    • Increase daily water intake by 2 glasses
                  </Typography>
                  <Typography variant="body2">
                    • Add 15 min of meditation for stress
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </LocalizationProvider>
  );
};

// Missing imports
import {
  Lightbulb as LightbulbIcon,
  FitnessCenter as ScaleIcon,
} from '@mui/icons-material';

export default AnalyticsEnhanced;