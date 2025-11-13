import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Tooltip,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Menu,
} from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import {
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Schedule as ScheduleIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  PersonAdd as PersonAddIcon,
  Download as DownloadIcon,
  Warning as WarningIcon,
  Queue as QueueIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useAuthGuard } from '../hooks/useAuthGuard';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { PatientInviteDialog } from '../components/PatientInviteDialog';
import { intakeApi, type IntakeSubmission } from '../services/intakeApi';
import { ScheduleAppointmentDialog } from '../components/ScheduleAppointmentDialog';
import IntakeDetailsDialog from '../components/IntakeDetailsDialog';
import { downloadCSV, downloadExcel, prepareIntakeExportData, intakeQueueColumns } from '../utils/exportUtils';
import { handleApiError } from '../lib/api-client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`intake-tabpanel-${index}`}
      aria-labelledby={`intake-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const IntakeManagement: React.FC = () => {
  const { canMakeApiCalls } = useAuthGuard();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const { enqueueSnackbar } = useSnackbar();
  
  // State Management
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedIntake, setSelectedIntake] = useState<IntakeSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Fetch intake submissions
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['intakeManagement'],
    queryFn: async () => {
      try {
        const result = await intakeApi.getIntakes();
        return result;
      } catch (err) {
        console.error('Error fetching intakes:', err);
        throw err;
      }
    },
    enabled: canMakeApiCalls,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const intakes = data?.data || [];

  // Filter intakes based on search and filters
  const filteredIntakes = intakes.filter((intake) => {
    const matchesSearch = searchQuery === '' || 
      intake.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intake.conditionType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || intake.status === filterStatus;
    const matchesUrgency = filterUrgency === 'all' || intake.severity === filterUrgency;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Separate intakes by status for different tabs
  const pendingIntakes = filteredIntakes.filter(i => i.status === 'pending');
  const reviewingIntakes = filteredIntakes.filter(i => i.status === 'reviewing');
  const processedIntakes = filteredIntakes.filter(i => ['approved', 'rejected', 'scheduled'].includes(i.status));

  // Statistics
  const stats = {
    total: intakes.length,
    pending: pendingIntakes.length,
    reviewing: reviewingIntakes.length,
    processed: processedIntakes.length,
    critical: intakes.filter(i => i.severity === 'critical').length,
    todayIntakes: intakes.filter(i => {
      const today = new Date().toDateString();
      return new Date(i.submittedAt).toDateString() === today;
    }).length,
  };

  // Show error alert if fetch failed
  React.useEffect(() => {
    if (error) {
      enqueueSnackbar('Failed to load intake data', { variant: 'error' });
    }
  }, [error, enqueueSnackbar]);

  const getSeverityColor = (severity: IntakeSubmission['severity']): ChipProps['color'] => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: IntakeSubmission['status']): ChipProps['color'] => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'reviewing': return 'warning';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  const handleViewDetails = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
    setDetailsOpen(true);
  };

  const handleSchedule = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
    setScheduleOpen(true);
  };

  const handleReject = async (intakeId: string) => {
    try {
      await intakeApi.updateIntakeStatus(intakeId, 'Archived');
      enqueueSnackbar('Intake archived', { variant: 'info' });
      await refetch();
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, 'Failed to archive intake');
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleStartReview = async (intakeId: string) => {
    try {
      await intakeApi.updateIntakeStatus(intakeId, 'Reviewed');
      enqueueSnackbar('Started reviewing intake', { variant: 'info' });
      await refetch();
    } catch (error: unknown) {
      const errorMessage = handleApiError(error, 'Failed to update intake status');
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleExportCSV = () => {
    const exportData = prepareIntakeExportData(filteredIntakes);
    downloadCSV(exportData, 'intake_management', intakeQueueColumns);
    enqueueSnackbar('Data exported as CSV', { variant: 'success' });
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    const exportData = prepareIntakeExportData(filteredIntakes);
    downloadExcel(exportData, 'intake_management', intakeQueueColumns);
    enqueueSnackbar('Data exported as Excel', { variant: 'success' });
    setExportMenuAnchor(null);
  };

  const handleInvitePatient = async (email: string, firstName: string, lastName: string) => {
    const response = await fetch('/api/patientinvitations/invite', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, firstName, lastName }),
    });

    if (!response.ok) {
      throw new Error('Failed to send invitation');
    }

    const result = await response.json();
    enqueueSnackbar(`Invitation sent! Link: ${result.invitationUrl}`, { variant: 'success' });
  };

  const renderIntakeRow = (intake: IntakeSubmission) => (
    <TableRow key={intake.id} hover>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {intake.patientName.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" fontWeight="medium">
              {intake.patientName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {intake.email}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      <TableCell>{intake.conditionType}</TableCell>
      <TableCell>
        <Chip 
          label={intake.severity}
          color={getSeverityColor(intake.severity)}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="body2">{intake.painLevel}/10</Typography>
          {intake.painLevel >= 7 && <WarningIcon color="warning" fontSize="small" />}
        </Box>
      </TableCell>
      <TableCell>
        {format(new Date(intake.submittedAt), 'MMM dd, yyyy HH:mm')}
      </TableCell>
      <TableCell>
        <Chip 
          label={intake.status}
          color={getStatusColor(intake.status)}
          size="small"
          variant="outlined"
        />
      </TableCell>
      <TableCell>
        <Stack direction="row" spacing={1}>
          <Tooltip title="View Details">
            <IconButton size="small" onClick={() => handleViewDetails(intake)}>
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          
          {intake.status === 'pending' && (
            <>
              <Tooltip title="Start Review">
                <IconButton 
                  size="small" 
                  color="info"
                  onClick={() => handleStartReview(intake.id)}
                >
                  <AssignIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {intake.status === 'reviewing' && (
            <>
              <Tooltip title="Approve & Schedule">
                <IconButton 
                  size="small" 
                  color="success"
                  onClick={() => handleSchedule(intake)}
                >
                  <ScheduleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Reject">
                <IconButton 
                  size="small" 
                  color="error"
                  onClick={() => handleReject(intake.id)}
                >
                  <RejectIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
          
          {intake.status === 'approved' && !intake.status.includes('scheduled') && (
            <Tooltip title="Schedule Appointment">
              <IconButton 
                size="small" 
                color="primary"
                onClick={() => handleSchedule(intake)}
              >
                <ScheduleIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </TableCell>
    </TableRow>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Intake Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Process and manage patient intake submissions
        </Typography>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">
                Total Intakes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Badge badgeContent={stats.pending} color="warning">
                <Typography variant="h4">{stats.pending}</Typography>
              </Badge>
              <Typography variant="body2" color="text.secondary">
                Pending Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="info.main">
                {stats.reviewing}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Under Review
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="success.main">
                {stats.processed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Processed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="error.main">
                {stats.critical}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Critical Cases
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h4" color="primary.main">
                {stats.todayIntakes}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Today{"'s"} Intakes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Actions */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or condition..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="reviewing">Reviewing</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Urgency</InputLabel>
              <Select
                value={filterUrgency}
                onChange={(e) => setFilterUrgency(e.target.value)}
                label="Urgency"
              >
                <MenuItem value="all">All Urgency</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              startIcon={<PersonAddIcon />}
              onClick={() => setInviteDialogOpen(true)}
              variant="contained"
              color="primary"
            >
              Invite Patient
            </Button>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={() => refetch()}
              variant="outlined"
            >
              Refresh
            </Button>
            <Button
              startIcon={<DownloadIcon />}
              onClick={(e) => setExportMenuAnchor(e.currentTarget)}
              variant="outlined"
            >
              Export
            </Button>
            <Menu
              anchorEl={exportMenuAnchor}
              open={Boolean(exportMenuAnchor)}
              onClose={() => setExportMenuAnchor(null)}
            >
              <MenuItem onClick={handleExportCSV}>Export as CSV</MenuItem>
              <MenuItem onClick={handleExportExcel}>Export as Excel</MenuItem>
            </Menu>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={currentTab} 
          onChange={(_, newValue) => setCurrentTab(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={pendingIntakes.length} color="warning">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <QueueIcon />
                  Pending
                </Box>
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={reviewingIntakes.length} color="info">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssignIcon />
                  Under Review
                </Box>
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={processedIntakes.length} color="success">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon />
                  Processed
                </Box>
              </Badge>
            }
          />
        </Tabs>

        {/* Tab Panels */}
        <TabPanel value={currentTab} index={0}>
          {isLoading ? (
            <LinearProgress />
          ) : pendingIntakes.length === 0 ? (
            <Alert severity="info">No pending intakes to review</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Pain Level</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingIntakes.map(renderIntakeRow)}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {isLoading ? (
            <LinearProgress />
          ) : reviewingIntakes.length === 0 ? (
            <Alert severity="info">No intakes currently under review</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Pain Level</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reviewingIntakes.map(renderIntakeRow)}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {isLoading ? (
            <LinearProgress />
          ) : processedIntakes.length === 0 ? (
            <Alert severity="info">No processed intakes</Alert>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Condition</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Pain Level</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedIntakes.map(renderIntakeRow)}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Dialogs */}
      {selectedIntake && (
        <>
          <IntakeDetailsDialog
            intake={{
              ...selectedIntake,
              chiefComplaint: selectedIntake.conditionType || 'Not specified'
            }}
            open={detailsOpen}
            onClose={() => {
              setDetailsOpen(false);
              setSelectedIntake(null);
            }}
          />
          <ScheduleAppointmentDialog
            intakeId={selectedIntake.id}
            open={scheduleOpen}
            onClose={() => {
              setScheduleOpen(false);
              setSelectedIntake(null);
              refetch();
            }}
          />
        </>
      )}

      <PatientInviteDialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        onInvite={handleInvitePatient}
      />
    </Box>
  );
};

export default IntakeManagement;
