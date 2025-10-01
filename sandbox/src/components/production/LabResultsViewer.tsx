// Production Component - Lab Results Viewer with Enhanced Medical UI Styling
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Alert,
  AlertTitle,
  Tabs,
  Tab,
  Badge,
  Avatar,
  Divider,
  LinearProgress,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  alpha,
  useTheme,
  Fade,
  Grow,
  Zoom,
} from '@mui/material';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts';
import {
  Science as LabIcon,
  Bloodtype as BloodIcon,
  Biotech as ChemistryIcon,
  Psychology as BrainIcon,
  MonitorHeart as HeartIcon,
  Water as UrineIcon,
  LocalHospital as HospitalIcon,
  TrendingUp as TrendUpIcon,
  TrendingDown as TrendDownIcon,
  TrendingFlat as TrendFlatIcon,
  Warning as WarningIcon,
  CheckCircle as NormalIcon,
  Error as AbnormalIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  CalendarToday as DateIcon,
  Schedule as TimeIcon,
  Person as DoctorIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Timeline as TimelineIcon,
  Assessment as ReportIcon,
  CompareArrows as CompareIcon,
} from '@mui/icons-material';
import { format, subDays, differenceInDays } from 'date-fns';
import { customStyles } from '../../theme/theme';

// Types
interface LabTest {
  id: string;
  name: string;
  value: number | string;
  unit: string;
  referenceMin?: number;
  referenceMax?: number;
  status: 'normal' | 'abnormal-high' | 'abnormal-low' | 'critical';
  trend?: 'up' | 'down' | 'stable';
  previousValue?: number | string;
  flag?: string;
}

interface LabPanel {
  id: string;
  name: string;
  category: 'blood' | 'chemistry' | 'urine' | 'cardiac' | 'hormone' | 'other';
  date: Date;
  orderedBy: string;
  status: 'completed' | 'pending' | 'processing';
  criticalCount: number;
  abnormalCount: number;
  tests: LabTest[];
}

interface HistoricalData {
  date: string;
  value: number;
  normal: boolean;
}

const LabResultsViewer: React.FC = () => {
  const theme = useTheme();
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPanel, setSelectedPanel] = useState<LabPanel | null>(null);
  const [expandedPanels, setExpandedPanels] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('table');
  const [timeRange, setTimeRange] = useState('30d');
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);

  // Mock lab results data
  const labPanels: LabPanel[] = [
    {
      id: '1',
      name: 'Complete Blood Count (CBC)',
      category: 'blood',
      date: new Date(),
      orderedBy: 'Dr. Emily Williams',
      status: 'completed',
      criticalCount: 0,
      abnormalCount: 2,
      tests: [
        {
          id: 't1',
          name: 'Hemoglobin',
          value: 14.5,
          unit: 'g/dL',
          referenceMin: 13.5,
          referenceMax: 17.5,
          status: 'normal',
          trend: 'stable',
          previousValue: 14.3,
        },
        {
          id: 't2',
          name: 'White Blood Cells',
          value: 11.2,
          unit: 'K/uL',
          referenceMin: 4.5,
          referenceMax: 10,
          status: 'abnormal-high',
          trend: 'up',
          previousValue: 9.8,
          flag: 'H',
        },
        {
          id: 't3',
          name: 'Platelets',
          value: 250,
          unit: 'K/uL',
          referenceMin: 150,
          referenceMax: 400,
          status: 'normal',
          trend: 'stable',
          previousValue: 245,
        },
        {
          id: 't4',
          name: 'Hematocrit',
          value: 38,
          unit: '%',
          referenceMin: 40,
          referenceMax: 54,
          status: 'abnormal-low',
          trend: 'down',
          previousValue: 41,
          flag: 'L',
        },
      ],
    },
    {
      id: '2',
      name: 'Basic Metabolic Panel',
      category: 'chemistry',
      date: new Date(),
      orderedBy: 'Dr. Emily Williams',
      status: 'completed',
      criticalCount: 1,
      abnormalCount: 3,
      tests: [
        {
          id: 't5',
          name: 'Glucose',
          value: 185,
          unit: 'mg/dL',
          referenceMin: 70,
          referenceMax: 99,
          status: 'critical',
          trend: 'up',
          previousValue: 145,
          flag: 'HH',
        },
        {
          id: 't6',
          name: 'Sodium',
          value: 140,
          unit: 'mmol/L',
          referenceMin: 136,
          referenceMax: 145,
          status: 'normal',
          trend: 'stable',
        },
        {
          id: 't7',
          name: 'Potassium',
          value: 4.5,
          unit: 'mmol/L',
          referenceMin: 3.5,
          referenceMax: 5.0,
          status: 'normal',
          trend: 'stable',
        },
        {
          id: 't8',
          name: 'Creatinine',
          value: 1.3,
          unit: 'mg/dL',
          referenceMin: 0.6,
          referenceMax: 1.2,
          status: 'abnormal-high',
          trend: 'up',
          previousValue: 1.1,
          flag: 'H',
        },
      ],
    },
    {
      id: '3',
      name: 'Lipid Panel',
      category: 'chemistry',
      date: subDays(new Date(), 7),
      orderedBy: 'Dr. Michael Chen',
      status: 'completed',
      criticalCount: 0,
      abnormalCount: 1,
      tests: [
        {
          id: 't9',
          name: 'Total Cholesterol',
          value: 220,
          unit: 'mg/dL',
          referenceMin: 0,
          referenceMax: 200,
          status: 'abnormal-high',
          trend: 'up',
          previousValue: 205,
          flag: 'H',
        },
        {
          id: 't10',
          name: 'HDL Cholesterol',
          value: 55,
          unit: 'mg/dL',
          referenceMin: 40,
          referenceMax: 100,
          status: 'normal',
          trend: 'stable',
        },
        {
          id: 't11',
          name: 'LDL Cholesterol',
          value: 130,
          unit: 'mg/dL',
          referenceMin: 0,
          referenceMax: 100,
          status: 'abnormal-high',
          trend: 'up',
          flag: 'H',
        },
        {
          id: 't12',
          name: 'Triglycerides',
          value: 140,
          unit: 'mg/dL',
          referenceMin: 0,
          referenceMax: 150,
          status: 'normal',
          trend: 'stable',
        },
      ],
    },
  ];

  // Mock historical data for charts
  const generateHistoricalData = (testName: string): HistoricalData[] => {
    const data: HistoricalData[] = [];
    for (let i = 30; i >= 0; i -= 5) {
      const baseValue = testName === 'Glucose' ? 95 : 14;
      const variation = Math.random() * 20 - 5;
      const value = baseValue + variation;
      data.push({
        date: format(subDays(new Date(), i), 'MMM d'),
        value: parseFloat(value.toFixed(1)),
        normal: testName === 'Glucose' ? value < 100 : value > 13.5 && value < 17.5,
      });
    }
    return data;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'blood': return <BloodIcon />;
      case 'chemistry': return <ChemistryIcon />;
      case 'urine': return <UrineIcon />;
      case 'cardiac': return <HeartIcon />;
      case 'hormone': return <BrainIcon />;
      default: return <LabIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'blood': return theme.palette.error;
      case 'chemistry': return theme.palette.primary;
      case 'urine': return theme.palette.warning;
      case 'cardiac': return theme.palette.secondary;
      case 'hormone': return theme.palette.info;
      default: return { main: theme.palette.grey[500] };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal': return <NormalIcon sx={{ color: theme.palette.success.main }} />;
      case 'abnormal-high':
      case 'abnormal-low': return <WarningIcon sx={{ color: theme.palette.warning.main }} />;
      case 'critical': return <AbnormalIcon sx={{ color: theme.palette.error.main }} />;
      default: return null;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendUpIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />;
      case 'down': return <TrendDownIcon sx={{ fontSize: 16, color: theme.palette.info.main }} />;
      case 'stable': return <TrendFlatIcon sx={{ fontSize: 16, color: theme.palette.success.main }} />;
      default: return null;
    }
  };

  const togglePanelExpansion = (panelId: string) => {
    setExpandedPanels(prev =>
      prev.includes(panelId)
        ? prev.filter(id => id !== panelId)
        : [...prev, panelId]
    );
  };

  const handleTestClick = (test: LabTest) => {
    setSelectedTest(test);
    setShowDetailsDialog(true);
  };

  const getStatusColor = (test: LabTest) => {
    if (test.status === 'critical') return theme.palette.error.main;
    if (test.status === 'abnormal-high' || test.status === 'abnormal-low') return theme.palette.warning.main;
    return theme.palette.success.main;
  };

  // Calculate summary statistics
  const totalTests = labPanels.reduce((sum, panel) => sum + panel.tests.length, 0);
  const totalCritical = labPanels.reduce((sum, panel) => sum + panel.criticalCount, 0);
  const totalAbnormal = labPanels.reduce((sum, panel) => sum + panel.abnormalCount, 0);

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
        }}
      >
        <Grid container alignItems="center" spacing={3}>
          <Grid item xs>
            <Stack spacing={1}>
              <Typography variant="h4" fontWeight={600}>
                Lab Results
              </Typography>
              <Typography variant="body2" color="text.secondary">
                View and analyze your laboratory test results
              </Typography>
            </Stack>
          </Grid>
          <Grid item>
            <Stack direction="row" spacing={1}>
              <IconButton>
                <PrintIcon />
              </IconButton>
              <IconButton>
                <DownloadIcon />
              </IconButton>
              <IconButton>
                <ShareIcon />
              </IconButton>
              <Button variant="contained" startIcon={<LabIcon />}>
                Request New Tests
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={3}>
            <Card sx={{ ...customStyles.glassmorphism }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Total Tests
                    </Typography>
                    <Typography variant="h4" fontWeight={600}>
                      {totalTests}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                    <LabIcon color="primary" />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ ...customStyles.glassmorphism }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Normal
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="success.main">
                      {totalTests - totalCritical - totalAbnormal}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1) }}>
                    <NormalIcon sx={{ color: theme.palette.success.main }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ ...customStyles.glassmorphism }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Abnormal
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="warning.main">
                      {totalAbnormal}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1) }}>
                    <WarningIcon sx={{ color: theme.palette.warning.main }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={3}>
            <Card sx={{ ...customStyles.glassmorphism }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="overline" color="text.secondary">
                      Critical
                    </Typography>
                    <Typography variant="h4" fontWeight={600} color="error.main">
                      {totalCritical}
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1) }}>
                    <AbnormalIcon sx={{ color: theme.palette.error.main }} />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {/* Critical Results Alert */}
      {totalCritical > 0 && (
        <Fade in>
          <Alert
            severity="error"
            sx={{
              mb: 3,
              ...customStyles.glassmorphism,
              '& .MuiAlert-icon': { fontSize: 28 },
            }}
          >
            <AlertTitle>Critical Results Require Immediate Attention</AlertTitle>
            You have {totalCritical} critical lab result{totalCritical > 1 ? 's' : ''} that should be reviewed with your healthcare provider immediately.
          </Alert>
        </Fade>
      )}

      {/* Navigation Tabs */}
      <Paper
        sx={{
          mb: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Tabs
          value={selectedTab}
          onChange={(e, v) => setSelectedTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Results" />
          <Tab 
            label="Blood Tests" 
            icon={<BloodIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Chemistry" 
            icon={<ChemistryIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Trends" 
            icon={<TimelineIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Compare" 
            icon={<CompareIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      {/* Main Content */}
      {selectedTab === 0 && (
        // All Results View
        <Stack spacing={3}>
          {labPanels.map((panel, index) => {
            const isExpanded = expandedPanels.includes(panel.id);
            const categoryColor = getCategoryColor(panel.category);
            
            return (
              <Zoom in key={panel.id} timeout={300 * (index + 1)}>
                <Paper
                  sx={{
                    ...customStyles.glassmorphism,
                    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                    },
                  }}
                >
                  {/* Panel Header */}
                  <Box
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      background: `linear-gradient(90deg, ${alpha(categoryColor.main, 0.05)} 0%, transparent 100%)`,
                    }}
                    onClick={() => togglePanelExpansion(panel.id)}
                  >
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(categoryColor.main, 0.1),
                            color: categoryColor.main,
                          }}
                        >
                          {getCategoryIcon(panel.category)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {panel.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              <DateIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {format(panel.date, 'MMM d, yyyy')}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              <DoctorIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                              {panel.orderedBy}
                            </Typography>
                          </Stack>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" alignItems="center" spacing={2}>
                        {panel.criticalCount > 0 && (
                          <Chip
                            label={`${panel.criticalCount} Critical`}
                            size="small"
                            color="error"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        {panel.abnormalCount > 0 && (
                          <Chip
                            label={`${panel.abnormalCount} Abnormal`}
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 600 }}
                          />
                        )}
                        <IconButton>
                          {isExpanded ? <CollapseIcon /> : <ExpandIcon />}
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>

                  {/* Panel Content */}
                  <Collapse in={isExpanded}>
                    <Divider />
                    <TableContainer sx={{ maxHeight: 400 }}>
                      <Table stickyHeader size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Test Name</TableCell>
                            <TableCell align="center">Result</TableCell>
                            <TableCell align="center">Reference Range</TableCell>
                            <TableCell align="center">Status</TableCell>
                            <TableCell align="center">Trend</TableCell>
                            <TableCell align="center">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {panel.tests.map((test) => (
                            <TableRow
                              key={test.id}
                              hover
                              sx={{
                                backgroundColor: test.status === 'critical' 
                                  ? alpha(theme.palette.error.main, 0.05)
                                  : test.status !== 'normal'
                                  ? alpha(theme.palette.warning.main, 0.03)
                                  : 'transparent',
                              }}
                            >
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {test.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                                  <Typography 
                                    variant="body2" 
                                    fontWeight={600}
                                    color={getStatusColor(test)}
                                  >
                                    {test.value} {test.unit}
                                  </Typography>
                                  {test.flag && (
                                    <Chip
                                      label={test.flag}
                                      size="small"
                                      sx={{
                                        height: 18,
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        bgcolor: getStatusColor(test),
                                        color: 'white',
                                      }}
                                    />
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <Typography variant="caption" color="text.secondary">
                                  {test.referenceMin !== undefined && test.referenceMax !== undefined
                                    ? `${test.referenceMin} - ${test.referenceMax} ${test.unit}`
                                    : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell align="center">
                                {getStatusIcon(test.status)}
                              </TableCell>
                              <TableCell align="center">
                                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
                                  {getTrendIcon(test.trend)}
                                  {test.previousValue && (
                                    <Typography variant="caption" color="text.secondary">
                                      ({test.previousValue})
                                    </Typography>
                                  )}
                                </Stack>
                              </TableCell>
                              <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={() => handleTestClick(test)}
                                >
                                  <ViewIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Collapse>
                </Paper>
              </Zoom>
            );
          })}
        </Stack>
      )}

      {selectedTab === 3 && (
        // Trends View
        <Paper
          sx={{
            p: 3,
            ...customStyles.glassmorphism,
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={600}>
              Test Result Trends
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Time Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Time Range"
              >
                <MenuItem value="7d">Last 7 days</MenuItem>
                <MenuItem value="30d">Last 30 days</MenuItem>
                <MenuItem value="90d">Last 90 days</MenuItem>
                <MenuItem value="1y">Last year</MenuItem>
              </Select>
            </FormControl>
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ ...customStyles.glassmorphism }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Glucose Levels
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={generateHistoricalData('Glucose')}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip />
                      <ReferenceArea y1={70} y2={99} fill={alpha(theme.palette.success.main, 0.1)} />
                      <ReferenceLine y={99} stroke={theme.palette.warning.main} strokeDasharray="5 5" />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={theme.palette.primary.main}
                        fill={alpha(theme.palette.primary.main, 0.3)}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card sx={{ ...customStyles.glassmorphism }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Hemoglobin Levels
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={generateHistoricalData('Hemoglobin')}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <ChartTooltip />
                      <ReferenceArea y1={13.5} y2={17.5} fill={alpha(theme.palette.success.main, 0.1)} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke={theme.palette.error.main}
                        strokeWidth={2}
                        dot={{ fill: theme.palette.error.main }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Test Details Dialog */}
      <Dialog
        open={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={2}>
            {selectedTest && getStatusIcon(selectedTest.status)}
            <Typography variant="h6">
              {selectedTest?.name} Details
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedTest && (
            <Stack spacing={3}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="overline" color="text.secondary">
                    Current Value
                  </Typography>
                  <Typography variant="h4" fontWeight={600} color={getStatusColor(selectedTest)}>
                    {selectedTest.value} {selectedTest.unit}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="overline" color="text.secondary">
                    Reference Range
                  </Typography>
                  <Typography variant="h6">
                    {selectedTest.referenceMin} - {selectedTest.referenceMax} {selectedTest.unit}
                  </Typography>
                </Grid>
              </Grid>

              {selectedTest.previousValue && (
                <Alert severity="info">
                  <Typography variant="body2">
                    Previous value: {selectedTest.previousValue} {selectedTest.unit}
                  </Typography>
                </Alert>
              )}

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Interpretation
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedTest.status === 'critical' && 
                    'This result is critically abnormal and requires immediate medical attention.'}
                  {selectedTest.status === 'abnormal-high' && 
                    'This result is above the normal reference range.'}
                  {selectedTest.status === 'abnormal-low' && 
                    'This result is below the normal reference range.'}
                  {selectedTest.status === 'normal' && 
                    'This result is within the normal reference range.'}
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Trend Analysis
                </Typography>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={generateHistoricalData(selectedTest.name).slice(-5)}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <ChartTooltip />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={theme.palette.primary.main}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)}>Close</Button>
          <Button variant="contained" startIcon={<PrintIcon />}>
            Print Report
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Export as both named and default
export { LabResultsViewer };
export default LabResultsViewer;