// Production Component - PROM Builder with Enhanced Medical UI Styling
import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Stack,
  CircularProgress,
  Divider,
  Tooltip,
  LinearProgress,
  Fade,
  Grow,
  alpha,
  useTheme,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import {
  Send as SendIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Preview as PreviewIcon,
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Refresh as RefreshIcon,
  Assignment as AssignmentIcon,
  QuestionAnswer as QuestionIcon,
  BarChart as ChartIcon,
  Edit as EditIcon,
  ContentCopy as CopyIcon,
  Psychology as PsychologyIcon,
  Healing as HealingIcon,
  FitnessCenter as FitnessIcon,
  MoodBad as PainIcon,
  Favorite as HeartIcon,
  DragIndicator as DragIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ChartTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { customStyles } from '../../theme/theme';

// PROM Template Types
interface PROMQuestion {
  id: string;
  type: 'text' | 'scale' | 'multiple-choice' | 'yes-no' | 'date';
  question: string;
  description?: string;
  required: boolean;
  options?: string[];
  scaleMin?: number;
  scaleMax?: number;
  scaleLabels?: { min: string; max: string };
}

interface PROMTemplate {
  id: string;
  name: string;
  description: string;
  category: 'pain' | 'mobility' | 'mental-health' | 'recovery' | 'general';
  questions: PROMQuestion[];
  frequency: 'daily' | 'weekly' | 'monthly' | 'as-needed';
  estimatedTime: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  lastModified: Date;
  totalResponses: number;
  avgCompletionRate: number;
}

interface PROMResponse {
  id: string;
  templateId: string;
  patientId: string;
  patientName: string;
  status: 'completed' | 'pending' | 'in-progress' | 'expired';
  score?: number;
  completedAt?: Date;
  sentAt: Date;
  expiresAt: Date;
}

const PROMBuilder: React.FC = () => {
  const theme = useTheme();
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<PROMTemplate | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Mock data
  const templates: PROMTemplate[] = [
    {
      id: '1',
      name: 'Pain Assessment Scale',
      description: 'Comprehensive pain evaluation for chronic pain patients',
      category: 'pain',
      questions: [],
      frequency: 'daily',
      estimatedTime: 5,
      isActive: true,
      createdAt: new Date('2024-01-15'),
      lastModified: new Date('2024-02-10'),
      totalResponses: 245,
      avgCompletionRate: 82,
    },
    {
      id: '2',
      name: 'Post-Surgery Recovery',
      description: 'Track recovery progress after surgical procedures',
      category: 'recovery',
      questions: [],
      frequency: 'weekly',
      estimatedTime: 10,
      isActive: true,
      createdAt: new Date('2024-01-20'),
      lastModified: new Date('2024-02-15'),
      totalResponses: 189,
      avgCompletionRate: 76,
    },
    {
      id: '3',
      name: 'Mental Health Check-in',
      description: 'Regular mental health and wellbeing assessment',
      category: 'mental-health',
      questions: [],
      frequency: 'weekly',
      estimatedTime: 8,
      isActive: true,
      createdAt: new Date('2024-01-10'),
      lastModified: new Date('2024-02-05'),
      totalResponses: 312,
      avgCompletionRate: 91,
    },
  ];

  const responses: PROMResponse[] = [
    {
      id: '1',
      templateId: '1',
      patientId: 'p1',
      patientName: 'John Doe',
      status: 'completed',
      score: 7.5,
      completedAt: new Date('2024-02-20'),
      sentAt: new Date('2024-02-19'),
      expiresAt: new Date('2024-02-26'),
    },
    {
      id: '2',
      templateId: '2',
      patientId: 'p2',
      patientName: 'Jane Smith',
      status: 'pending',
      sentAt: new Date('2024-02-21'),
      expiresAt: new Date('2024-02-28'),
    },
    {
      id: '3',
      templateId: '1',
      patientId: 'p3',
      patientName: 'Robert Johnson',
      status: 'in-progress',
      sentAt: new Date('2024-02-21'),
      expiresAt: new Date('2024-02-28'),
    },
  ];

  const getCategoryIcon = (category: PROMTemplate['category']) => {
    switch (category) {
      case 'pain': return <PainIcon />;
      case 'mobility': return <FitnessIcon />;
      case 'mental-health': return <PsychologyIcon />;
      case 'recovery': return <HealingIcon />;
      default: return <AssessmentIcon />;
    }
  };

  const getCategoryColor = (category: PROMTemplate['category']) => {
    switch (category) {
      case 'pain': return theme.palette.error;
      case 'mobility': return theme.palette.info;
      case 'mental-health': return theme.palette.secondary;
      case 'recovery': return theme.palette.success;
      default: return theme.palette.primary;
    }
  };

  const getStatusColor = (status: PROMResponse['status']) => {
    switch (status) {
      case 'completed': return theme.palette.success;
      case 'pending': return theme.palette.warning;
      case 'in-progress': return theme.palette.info;
      case 'expired': return theme.palette.error;
      default: return { main: theme.palette.grey[500] };
    }
  };

  // Statistics
  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.isActive).length,
    totalResponses: responses.length,
    completedResponses: responses.filter(r => r.status === 'completed').length,
    pendingResponses: responses.filter(r => r.status === 'pending').length,
    avgCompletionRate: Math.round(templates.reduce((acc, t) => acc + t.avgCompletionRate, 0) / templates.length),
  };

  const chartData = [
    { name: 'Completed', value: stats.completedResponses, color: theme.palette.success.main },
    { name: 'Pending', value: stats.pendingResponses, color: theme.palette.warning.main },
    { name: 'In Progress', value: responses.filter(r => r.status === 'in-progress').length, color: theme.palette.info.main },
    { name: 'Expired', value: responses.filter(r => r.status === 'expired').length, color: theme.palette.error.main },
  ];

  const renderTemplateCard = (template: PROMTemplate) => {
    const categoryColor = getCategoryColor(template.category);
    
    return (
      <Grow in timeout={600} key={template.id}>
        <Card
          sx={{
            height: '100%',
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.9)
              : 'rgba(255, 255, 255, 0.98)',
            border: `1px solid ${alpha(categoryColor.main, 0.15)}`,
            borderTop: `4px solid ${categoryColor.main}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'visible',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: `0 12px 24px ${alpha(categoryColor.main, 0.15)}`,
              '&::before': {
                opacity: 1,
              },
            },
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `linear-gradient(135deg, ${alpha(categoryColor.light, 0.03)} 0%, transparent 100%)`,
              opacity: 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            },
          }}
          onClick={() => setSelectedTemplate(template)}
        >
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                <Avatar
                  sx={{
                    bgcolor: alpha(categoryColor.main, 0.1),
                    color: categoryColor.main,
                    width: 48,
                    height: 48,
                  }}
                >
                  {getCategoryIcon(template.category)}
                </Avatar>
                <Stack direction="row" spacing={1}>
                  {template.isActive && (
                    <Chip
                      label="Active"
                      size="small"
                      sx={{
                        height: 22,
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        fontWeight: 600,
                      }}
                    />
                  )}
                  <Chip
                    label={template.frequency}
                    size="small"
                    sx={{
                      height: 22,
                      backgroundColor: alpha(categoryColor.main, 0.1),
                      color: categoryColor.main,
                      fontWeight: 500,
                    }}
                  />
                </Stack>
              </Stack>

              <Box>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  {template.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {template.description}
                </Typography>
              </Box>

              <Stack direction="row" spacing={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Responses
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {template.totalResponses}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Completion Rate
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                      {template.avgCompletionRate}%
                    </Typography>
                    <CircularProgress
                      variant="determinate"
                      value={template.avgCompletionRate}
                      size={24}
                      thickness={6}
                      sx={{
                        color: categoryColor.main,
                        '& .MuiCircularProgress-circle': {
                          strokeLinecap: 'round',
                        },
                      }}
                    />
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Est. Time
                  </Typography>
                  <Typography variant="h6" fontWeight={600}>
                    {template.estimatedTime} min
                  </Typography>
                </Box>
              </Stack>

              <LinearProgress
                variant="determinate"
                value={template.avgCompletionRate}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: alpha(categoryColor.main, 0.1),
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: `linear-gradient(90deg, ${categoryColor.light} 0%, ${categoryColor.main} 100%)`,
                  },
                }}
              />
            </Stack>
          </CardContent>
          
          <CardActions sx={{ px: 2, pb: 2 }}>
            <Button
              size="small"
              startIcon={<PreviewIcon />}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTemplate(template);
                setPreviewOpen(true);
              }}
            >
              Preview
            </Button>
            <Button
              size="small"
              startIcon={<EditIcon />}
              onClick={(e) => {
                e.stopPropagation();
                // Edit logic
              }}
            >
              Edit
            </Button>
            <Button
              size="small"
              startIcon={<SendIcon />}
              onClick={(e) => {
                e.stopPropagation();
                // Send logic
              }}
              sx={{ ml: 'auto' }}
              variant="contained"
            >
              Send
            </Button>
          </CardActions>
        </Card>
      </Grow>
    );
  };

  return (
    <Box>
      {/* Header */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          borderRadius: 2,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              PROM Builder
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create and manage patient-reported outcome measures
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                background: theme.palette.primary.main,
                '&:hover': {
                  background: theme.palette.primary.dark,
                },
              }}
            >
              Create Template
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...customStyles.glassmorphism,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Active Templates
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.activeTemplates}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main }}>
                  <AssignmentIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...customStyles.glassmorphism,
              border: `1px solid ${alpha(theme.palette.success.main, 0.1)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Completed
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="success.main">
                    {stats.completedResponses}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main }}>
                  <CheckCircleIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...customStyles.glassmorphism,
              border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Pending
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="warning.main">
                    {stats.pendingResponses}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main }}>
                  <PendingIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card
            sx={{
              ...customStyles.glassmorphism,
              border: `1px solid ${alpha(theme.palette.info.main, 0.1)}`,
            }}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Avg. Completion
                  </Typography>
                  <Typography variant="h4" fontWeight={700} color="info.main">
                    {stats.avgCompletionRate}%
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main }}>
                  <ChartIcon />
                </Avatar>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, v) => setCurrentTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              minHeight: 56,
              textTransform: 'none',
              fontSize: '0.95rem',
            },
          }}
        >
          <Tab label="Templates" icon={<AssignmentIcon />} iconPosition="start" />
          <Tab label="Responses" icon={<QuestionIcon />} iconPosition="start" />
          <Tab label="Analytics" icon={<ChartIcon />} iconPosition="start" />
        </Tabs>

        {/* Templates Tab */}
        {currentTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {templates.map(template => (
                <Grid item xs={12} md={6} lg={4} key={template.id}>
                  {renderTemplateCard(template)}
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Responses Tab */}
        {currentTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Stack spacing={2}>
              {responses.map(response => {
                const statusColor = getStatusColor(response.status);
                return (
                  <Paper
                    key={response.id}
                    sx={{
                      p: 2,
                      border: `1px solid ${alpha(statusColor.main, 0.2)}`,
                      borderLeft: `4px solid ${statusColor.main}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: alpha(statusColor.main, 0.02),
                      },
                    }}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar sx={{ bgcolor: alpha(statusColor.main, 0.1), color: statusColor.main }}>
                          {response.patientName.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={600}>
                            {response.patientName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Template: {templates.find(t => t.id === response.templateId)?.name}
                          </Typography>
                        </Box>
                      </Stack>
                      
                      <Stack direction="row" spacing={2} alignItems="center">
                        {response.score && (
                          <Chip
                            label={`Score: ${response.score}/10`}
                            size="small"
                            sx={{
                              bgcolor: alpha(theme.palette.info.main, 0.1),
                              color: theme.palette.info.main,
                              fontWeight: 600,
                            }}
                          />
                        )}
                        <Chip
                          label={response.status}
                          size="small"
                          sx={{
                            bgcolor: alpha(statusColor.main, 0.1),
                            color: statusColor.main,
                            fontWeight: 600,
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Analytics Tab */}
        {currentTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 300 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Response Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: 300 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Template Usage
                  </Typography>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart
                      data={templates.map(t => ({
                        name: t.name.split(' ')[0],
                        responses: t.totalResponses,
                        completion: t.avgCompletionRate,
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar dataKey="responses" fill={theme.palette.primary.main} />
                    </BarChart>
                  </ResponsiveContainer>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default PROMBuilder;