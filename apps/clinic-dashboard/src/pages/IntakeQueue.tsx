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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tab,
  Tabs,
  Badge,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Assignment as AssignIcon,
  Schedule as ScheduleIcon,
  Flag as FlagIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  CheckCircle,
  PersonAdd as PersonAddIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  CalendarMonth as CalendarIcon,
  LocalHospital as MedicalIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { intakeApi, type IntakeSubmission } from '../services/intakeApi';
import { ScheduleAppointmentDialog } from '../components/ScheduleAppointmentDialog';
import { patientApi } from '../services/patientApi';
import { downloadCSV, downloadExcel, prepareIntakeExportData, intakeQueueColumns } from '../utils/exportUtils';
import { Menu } from '@mui/material';


const IntakeQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedIntake, setSelectedIntake] = useState<IntakeSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [createPatientOpen, setCreatePatientOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');
  const [patientFormData, setPatientFormData] = useState<any>({});
  const [exportMenuAnchor, setExportMenuAnchor] = useState<null | HTMLElement>(null);

  // Fetch intake submissions from API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['intakeQueue'],
    queryFn: async () => {
      try {
        const result = await intakeApi.getIntakes();
        console.log('Fetched intakes:', result);
        return result;
      } catch (err) {
        console.error('Error fetching intakes:', err);
        throw err;
      }
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
  
  const intakes = data?.data || [];
  
  // Show error alert if fetch failed
  React.useEffect(() => {
    if (error) {
      enqueueSnackbar('Failed to load intake queue', { variant: 'error' });
    }
  }, [error, enqueueSnackbar]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'default';
    }
  };

  const getStatusColor = (status: string) => {
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

  const handleAssign = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
    setAssignOpen(true);
  };

  const handleApprove = async (intakeId: string) => {
    try {
      await intakeApi.updateIntakeStatus(intakeId, 'Triaged');
      enqueueSnackbar('Intake approved successfully', { variant: 'success' });
      await refetch();
    } catch (error: any) {
      console.error('Failed to approve intake:', error);
      enqueueSnackbar(error?.message || 'Failed to approve intake', { variant: 'error' });
    }
  };

  const handleReject = async (intakeId: string) => {
    try {
      await intakeApi.updateIntakeStatus(intakeId, 'Archived');
      enqueueSnackbar('Intake rejected', { variant: 'info' });
      await refetch();
    } catch (error: any) {
      console.error('Failed to reject intake:', error);
      enqueueSnackbar(error?.message || 'Failed to reject intake', { variant: 'error' });
    }
  };

  const handleSchedule = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
    setScheduleOpen(true);
  };

  const handleCreatePatient = (intake: IntakeSubmission) => {
    setSelectedIntake(intake);
    setCreatePatientOpen(true);
  };

  const handleExportCSV = () => {
    const exportData = prepareIntakeExportData(filteredIntakes);
    downloadCSV(exportData, 'intake_queue', intakeQueueColumns);
    enqueueSnackbar('Intake queue exported as CSV', { variant: 'success' });
    setExportMenuAnchor(null);
  };

  const handleExportExcel = () => {
    const exportData = prepareIntakeExportData(filteredIntakes);
    downloadExcel(exportData, 'intake_queue', intakeQueueColumns);
    enqueueSnackbar('Intake queue exported as Excel', { variant: 'success' });
    setExportMenuAnchor(null);
  };

  const handleSavePatient = async () => {
    if (!selectedIntake) return;
    
    try {
      // Extract name parts
      const nameParts = selectedIntake.patientName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Create patient data
      const patientData = {
        firstName: patientFormData.firstName || firstName,
        lastName: patientFormData.lastName || lastName,
        email: patientFormData.email || selectedIntake.email,
        phone: patientFormData.phone || selectedIntake.phone || '',
        dateOfBirth: patientFormData.dateOfBirth || '',
        gender: patientFormData.gender || 'Not specified',
        address: {
          street: patientFormData.street || '',
          city: patientFormData.city || '',
          state: patientFormData.state || 'NSW',
          postcode: patientFormData.postcode || '',
        },
        insuranceProvider: patientFormData.insuranceProvider || '',
        medicareNumber: patientFormData.medicareNumber || '',
        initialConditions: [selectedIntake.conditionType],
        intakeId: selectedIntake.id,
      };
      
      // Create patient from intake
      const newPatient = await patientApi.createPatientFromIntake(selectedIntake.id, patientData);
      
      enqueueSnackbar('Patient created successfully', { variant: 'success' });
      setCreatePatientOpen(false);
      
      // Update the intake to mark it as having a patient
      await refetch();
      
      // After creating patient, open scheduling dialog with the new patient ID
      setSelectedIntake({ ...selectedIntake, patientId: newPatient.id });
      setScheduleOpen(true);
    } catch (error: any) {
      console.error('Failed to create patient:', error);
      enqueueSnackbar(error?.message || 'Failed to create patient', { variant: 'error' });
    }
  };

  const filteredIntakes = React.useMemo(() => {
    return intakes.filter(intake => {
      // Search filter
      const matchesSearch = !searchQuery || 
        intake.patientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intake.conditionType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        intake.email?.toLowerCase().includes(searchQuery.toLowerCase());
      
      // Urgency filter
      const matchesUrgency = filterUrgency === 'all' || intake.severity === filterUrgency;
      
      // Tab filter
      let matchesTab = true;
      if (selectedTab === 0) {
        matchesTab = intake.status === 'pending';
      } else if (selectedTab === 1) {
        matchesTab = intake.status === 'reviewing';
      } else if (selectedTab === 2) {
        matchesTab = ['approved', 'rejected', 'scheduled'].includes(intake.status);
      }
      
      return matchesSearch && matchesUrgency && matchesTab;
    });
  }, [intakes, searchQuery, filterUrgency, selectedTab]);

  return (
    <Box>
      {/* Header */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            Intake Queue
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and manage patient intake submissions
          </Typography>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => refetch()}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={(e) => setExportMenuAnchor(e.currentTarget)}
          >
            Export
          </Button>
          <Menu
            anchorEl={exportMenuAnchor}
            open={Boolean(exportMenuAnchor)}
            onClose={() => setExportMenuAnchor(null)}
          >
            <MenuItem onClick={handleExportCSV}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon fontSize="small" />
                Export as CSV
              </Box>
            </MenuItem>
            <MenuItem onClick={handleExportExcel}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DownloadIcon fontSize="small" />
                Export as Excel
              </Box>
            </MenuItem>
          </Menu>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <InfoIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Pending Review
                  </Typography>
                  <Typography variant="h4">
                    {intakes.filter(i => i.status === 'pending').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <WarningIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    High Priority
                  </Typography>
                  <Typography variant="h4">
                    {intakes.filter(i => i.severity === 'high' || i.severity === 'critical').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    In Review
                  </Typography>
                  <Typography variant="h4">
                    {intakes.filter(i => i.status === 'reviewing').length}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Processed Today
                  </Typography>
                  <Typography variant="h4">12</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by patient name or complaint..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Urgency Filter</InputLabel>
                <Select
                  value={filterUrgency}
                  label="Urgency Filter"
                  onChange={(e) => setFilterUrgency(e.target.value)}
                >
                  <MenuItem value="all">All Urgencies</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
              >
                More Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Tabs
          value={selectedTab}
          onChange={(e, v) => setSelectedTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            label={
              <Badge badgeContent={intakes.filter(i => i.status === 'pending').length} color="error">
                Pending
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={intakes.filter(i => i.status === 'reviewing').length} color="warning">
                In Review
              </Badge>
            }
          />
          <Tab 
            label={
              <Badge badgeContent={intakes.filter(i => ['approved', 'rejected', 'scheduled'].includes(i.status)).length} color="success">
                Processed
              </Badge>
            }
          />
        </Tabs>

        {/* Table */}
        <TableContainer>
          {isLoading && <LinearProgress />}
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Chief Complaint</TableCell>
                <TableCell>Pain Level</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>AI Risk Score</TableCell>
                <TableCell>Submitted</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredIntakes.length === 0 && !isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box>
                      <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No intakes found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {searchQuery || filterUrgency !== 'all' 
                          ? 'Try adjusting your filters' 
                          : selectedTab === 0 
                            ? 'No pending intakes at the moment'
                            : selectedTab === 1
                              ? 'No intakes currently in review'
                              : 'No processed intakes yet'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
              filteredIntakes.map((intake) => (
                <TableRow key={intake.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1">{intake.patientName || 'Unknown Patient'}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {intake.email || 'No email provided'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{intake.conditionType || 'Not specified'}</Typography>
                      {intake.symptoms && Array.isArray(intake.symptoms) && intake.symptoms.length > 0 && (
                        <Box sx={{ mt: 0.5 }}>
                          {intake.symptoms.slice(0, 2).map((symptom, index) => (
                            <Chip
                              key={`${intake.id}-symptom-${index}`}
                              label={symptom}
                              size="small"
                              sx={{ mr: 0.5 }}
                            />
                          ))}
                          {intake.symptoms.length > 2 && (
                            <Chip
                              label={`+${intake.symptoms.length - 2} more`}
                              size="small"
                              sx={{ mr: 0.5 }}
                              variant="outlined"
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={intake.painLevel * 10}
                        sx={{ width: 50, height: 8, borderRadius: 4 }}
                        color={intake.painLevel > 7 ? 'error' : intake.painLevel > 4 ? 'warning' : 'success'}
                      />
                      <Typography variant="body2">{intake.painLevel}/10</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={intake.severity.toUpperCase()}
                      color={getSeverityColor(intake.severity) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {intake.aiSummary && (
                      <Tooltip title={intake.aiSummary}>
                        <Chip
                          icon={<FlagIcon />}
                          label="AI Summary"
                          size="small"
                          color="info"
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(intake.submittedAt), 'MMM d, h:mm a')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={intake.status}
                      color={getStatusColor(intake.status) as any}
                      size="small"
                    />
                    {intake.assignedTo && (
                      <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                        {intake.assignedTo}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(intake)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Assign">
                        <IconButton
                          size="small"
                          onClick={() => handleAssign(intake)}
                        >
                          <AssignIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Schedule Appointment">
                        <IconButton 
                          size="small"
                          onClick={() => handleSchedule(intake)}
                        >
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
                      {intake.status === 'pending' && !intake.patientId && (
                        <Tooltip title="Create Patient">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleCreatePatient(intake)}
                          >
                            <PersonAddIcon />
                          </IconButton>
                        </Tooltip>
                      )}
                      {intake.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => handleApprove(intake.id)}
                            >
                              <ApproveIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleReject(intake.id)}
                            >
                              <RejectIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Intake Details
            <Chip
              label={selectedIntake?.status || ''}
              color={getStatusColor(selectedIntake?.status || '') as any}
              size="small"
            />
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedIntake && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><PersonIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Patient Name"
                        secondary={selectedIntake.patientName}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><EmailIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Email"
                        secondary={selectedIntake.email}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><PhoneIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Phone"
                        secondary={selectedIntake.phone || 'Not provided'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Submitted"
                        secondary={format(new Date(selectedIntake.submittedAt), 'MMM d, yyyy h:mm a')}
                      />
                    </ListItem>
                  </List>
                </Grid>
                <Grid item xs={12} md={6}>
                  <List dense>
                    <ListItem>
                      <ListItemIcon><MedicalIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Chief Complaint"
                        secondary={selectedIntake.conditionType}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><WarningIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Pain Level"
                        secondary={`${selectedIntake.painLevel}/10`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><FlagIcon /></ListItemIcon>
                      <ListItemText 
                        primary="Urgency"
                        secondary={selectedIntake.severity.toUpperCase()}
                      />
                    </ListItem>
                    {selectedIntake.assignedTo && (
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText 
                          primary="Assigned To"
                          secondary={selectedIntake.assignedTo}
                        />
                      </ListItem>
                    )}
                  </List>
                </Grid>
                {selectedIntake.symptoms && selectedIntake.symptoms.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Symptoms</Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedIntake.symptoms.map((symptom, index) => (
                        <Chip key={`detail-symptom-${index}`} label={symptom} variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                )}
                {selectedIntake.aiSummary && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>AI Analysis</Typography>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {selectedIntake.aiSummary}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {selectedIntake.bodyMap && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Body Mapping Data</Typography>
                    <Alert severity="info">
                      3D body mapping data available - {selectedIntake.bodyMap.painPoints?.length || 0} pain points identified
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          {selectedIntake && !selectedIntake.patientId && (
            <Button 
              variant="outlined" 
              startIcon={<PersonAddIcon />}
              onClick={() => {
                setDetailsOpen(false);
                handleCreatePatient(selectedIntake);
              }}
            >
              Create Patient
            </Button>
          )}
          <Button 
            variant="contained" 
            startIcon={<ScheduleIcon />}
            onClick={() => {
              setDetailsOpen(false);
              handleSchedule(selectedIntake!);
            }}
          >
            Schedule Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Intake</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign To</InputLabel>
            <Select label="Assign To">
              <MenuItem value="dr-chen">Dr. Emily Chen</MenuItem>
              <MenuItem value="dr-williams">Dr. James Williams</MenuItem>
              <MenuItem value="dr-patel">Dr. Priya Patel</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAssignOpen(false)}>
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Appointment Dialog */}
      <ScheduleAppointmentDialog
        open={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false);
          refetch(); // Refresh the intake list after scheduling
        }}
        patient={selectedIntake?.patientId ? {
          id: selectedIntake.patientId,
          firstName: selectedIntake.patientName.split(' ')[0],
          lastName: selectedIntake.patientName.split(' ').slice(1).join(' '),
          email: selectedIntake.email,
          phone: selectedIntake.phone || '',
        } : undefined}
        intakeId={selectedIntake?.id}
        prefilledData={{
          chiefComplaint: selectedIntake?.conditionType,
          urgency: selectedIntake?.severity,
        }}
      />

      {/* Create Patient Dialog */}
      <Dialog open={createPatientOpen} onClose={() => setCreatePatientOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Patient</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Creating patient record from intake submission
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="First Name"
                defaultValue={selectedIntake?.patientName.split(' ')[0]}
                onChange={(e) => setPatientFormData({ ...patientFormData, firstName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Last Name"
                defaultValue={selectedIntake?.patientName.split(' ').slice(1).join(' ')}
                onChange={(e) => setPatientFormData({ ...patientFormData, lastName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                defaultValue={selectedIntake?.email}
                onChange={(e) => setPatientFormData({ ...patientFormData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Phone"
                defaultValue={selectedIntake?.phone}
                onChange={(e) => setPatientFormData({ ...patientFormData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Date of Birth"
                type="date"
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setPatientFormData({ ...patientFormData, dateOfBirth: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select 
                  label="Gender"
                  value={patientFormData.gender || ''}
                  onChange={(e) => setPatientFormData({ ...patientFormData, gender: e.target.value })}
                >
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                  <MenuItem value="Prefer not to say">Prefer not to say</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="City"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>State</InputLabel>
                <Select label="State">
                  <MenuItem value="NSW">NSW</MenuItem>
                  <MenuItem value="VIC">VIC</MenuItem>
                  <MenuItem value="QLD">QLD</MenuItem>
                  <MenuItem value="WA">WA</MenuItem>
                  <MenuItem value="SA">SA</MenuItem>
                  <MenuItem value="TAS">TAS</MenuItem>
                  <MenuItem value="ACT">ACT</MenuItem>
                  <MenuItem value="NT">NT</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Postcode"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Initial Condition Notes"
                multiline
                rows={3}
                defaultValue={selectedIntake?.conditionType}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreatePatientOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSavePatient}>
            Create Patient & Continue to Scheduling
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default IntakeQueue;
