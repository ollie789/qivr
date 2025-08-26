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
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
import { intakeApi, type IntakeSubmission } from '../services/intakeApi';


const IntakeQueue: React.FC = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedIntake, setSelectedIntake] = useState<IntakeSubmission | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<string>('all');

  // Fetch intake submissions from API
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['intakeQueue', selectedTab, filterUrgency, searchQuery],
    queryFn: async () => {
      const filters = {
        status: selectedTab === 0 ? 'pending' : selectedTab === 1 ? 'reviewing' : selectedTab === 2 ? 'approved' : undefined,
        severity: filterUrgency !== 'all' ? filterUrgency : undefined,
        search: searchQuery || undefined,
      };
      return intakeApi.getIntakes(filters);
    },
  });
  
  const intakes = data?.data || [];

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
      await intakeApi.updateIntakeStatus(intakeId, 'approved');
      enqueueSnackbar('Intake approved successfully', { variant: 'success' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to approve intake', { variant: 'error' });
    }
  };

  const handleReject = async (intakeId: string) => {
    try {
      await intakeApi.updateIntakeStatus(intakeId, 'rejected');
      enqueueSnackbar('Intake rejected', { variant: 'info' });
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to reject intake', { variant: 'error' });
    }
  };

  const filteredIntakes = intakes.filter(intake => {
    const matchesSearch = intake.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         intake.conditionType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesUrgency = filterUrgency === 'all' || intake.severity === filterUrgency;
    return matchesSearch && matchesUrgency;
  });

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
          >
            Export
          </Button>
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
          <Tab label="Processed" />
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
              {filteredIntakes.map((intake) => (
                <TableRow key={intake.id} hover>
                  <TableCell>
                    <Box>
                      <Typography variant="body1">{intake.patientName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {intake.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{intake.conditionType}</Typography>
                      {intake.symptoms && (
                        <Box sx={{ mt: 0.5 }}>
                          {intake.symptoms.slice(0, 2).map((symptom) => (
                            <Chip
                              key={symptom}
                              label={symptom}
                              size="small"
                              sx={{ mr: 0.5 }}
                            />
                          ))}
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
                      <Tooltip title="Schedule">
                        <IconButton size="small">
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
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
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Intake Details</DialogTitle>
        <DialogContent>
          {selectedIntake && (
            <Box>
              {/* Add detailed intake view here */}
              <Typography>Patient: {selectedIntake.patientName}</Typography>
              <Typography>Condition: {selectedIntake.conditionType}</Typography>
              {/* Add more details */}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained">Schedule Appointment</Button>
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
    </Box>
  );
};

export default IntakeQueue;
