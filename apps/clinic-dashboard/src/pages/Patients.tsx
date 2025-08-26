import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  LinearProgress,
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  History as HistoryIcon,
  MedicalServices as MedicalIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { patientApi, type Patient as PatientType } from '../services/patientApi';

// Using Patient type from patientApi


const Patients: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<PatientType | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);

  // Fetch patients from API
  const { data: patientsData, isLoading, refetch } = useQuery({
    queryKey: ['patients', searchQuery, filterStatus],
    queryFn: () => patientApi.getPatients({
      search: searchQuery || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    }),
  });

  const patients = patientsData?.data || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const handleViewDetails = (patient: PatientType) => {
    setSelectedPatient(patient);
    setDetailsOpen(true);
  };

  const handleEdit = (patient: PatientType) => {
    setSelectedPatient(patient);
    setEditOpen(true);
  };

  const handleScheduleAppointment = (patient: PatientType) => {
    // Navigate to appointment booking with patient pre-selected
    enqueueSnackbar(`Scheduling appointment for ${patient.firstName} ${patient.lastName}`, { variant: 'info' });
  };

  const handleCreatePatient = () => {
    setCreateOpen(true);
  };

  const handleSavePatient = async (patientData: any) => {
    try {
      if (editOpen && selectedPatient) {
        // Update existing patient
        await patientApi.updatePatient(selectedPatient.id, patientData);
        enqueueSnackbar('Patient updated successfully', { variant: 'success' });
      } else {
        // Create new patient
        await patientApi.createPatient(patientData);
        enqueueSnackbar('Patient created successfully', { variant: 'success' });
      }
      setEditOpen(false);
      setCreateOpen(false);
      refetch();
    } catch (error) {
      enqueueSnackbar('Failed to save patient', { variant: 'error' });
    }
  };

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.medicalRecordNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Box>
      {/* Header */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Typography variant="h4" gutterBottom>
            Patients
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage patient records and medical history
          </Typography>
        </Grid>
        <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Export
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreatePatient}
          >
            New Patient
          </Button>
        </Grid>
      </Grid>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Patients
                  </Typography>
                  <Typography variant="h4">{patientsData?.total || patients.length}</Typography>
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
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Active Patients
                  </Typography>
                  <Typography variant="h4">
                    {patients.filter(p => p.status === 'active').length}
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
                  <CalendarIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Appointments Today
                  </Typography>
                  <Typography variant="h4">8</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    New This Month
                  </Typography>
                  <Typography variant="h4">12</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search patients by name, email, or MRN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  label="Status"
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                sx={{ height: '56px' }}
              >
                More Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        {isLoading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>MRN</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Last Visit</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>Provider</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPatients
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((patient) => (
                <TableRow key={patient.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        {patient.firstName[0]}{patient.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')} • {patient.gender}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {patient.medicalRecordNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">{patient.email}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {patient.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {patient.lastVisit ? (
                      <Box>
                        <Typography variant="body2">
                          {format(new Date(patient.lastVisit), 'MMM d, yyyy')}
                        </Typography>
                        {patient.nextAppointment && (
                          <Typography variant="caption" color="primary">
                            Next: {format(new Date(patient.nextAppointment), 'MMM d')}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {patient.conditions.slice(0, 2).map((condition) => (
                        <Chip
                          key={condition}
                          label={condition}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {patient.conditions.length > 2 && (
                        <Chip
                          label={`+${patient.conditions.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{patient.provider || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={patient.status}
                      color={getStatusColor(patient.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(patient)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleEdit(patient)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Schedule Appointment">
                        <IconButton
                          size="small"
                          onClick={() => handleScheduleAppointment(patient)}
                        >
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredPatients.length}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Card>

      {/* Patient Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            Patient Details
            <Box>
              <IconButton onClick={() => handleEdit(selectedPatient!)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => setDetailsOpen(false)}>
                ×
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPatient && (
            <Box>
              <Tabs value={detailsTab} onChange={(e, v) => setDetailsTab(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Medical History" />
                <Tab label="Appointments" />
                <Tab label="Documents" />
              </Tabs>
              
              {detailsTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <List>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText
                          primary="Full Name"
                          secondary={`${selectedPatient.firstName} ${selectedPatient.lastName}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CalendarIcon /></ListItemIcon>
                        <ListItemText
                          primary="Date of Birth"
                          secondary={format(new Date(selectedPatient.dateOfBirth), 'MMMM d, yyyy')}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><EmailIcon /></ListItemIcon>
                        <ListItemText
                          primary="Email"
                          secondary={selectedPatient.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PhoneIcon /></ListItemIcon>
                        <ListItemText
                          primary="Phone"
                          secondary={selectedPatient.phone}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <List>
                      <ListItem>
                        <ListItemIcon><LocationIcon /></ListItemIcon>
                        <ListItemText
                          primary="Address"
                          secondary={`${selectedPatient.address.street}, ${selectedPatient.address.city}, ${selectedPatient.address.state} ${selectedPatient.address.postcode}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><MedicalIcon /></ListItemIcon>
                        <ListItemText
                          primary="MRN"
                          secondary={selectedPatient.medicalRecordNumber}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText
                          primary="Primary Provider"
                          secondary={selectedPatient.provider || 'Not assigned'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><AssignmentIcon /></ListItemIcon>
                        <ListItemText
                          primary="Insurance"
                          secondary={selectedPatient.insuranceProvider || 'Not provided'}
                        />
                      </ListItem>
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Active Conditions
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {selectedPatient.conditions.map((condition) => (
                        <Chip key={condition} label={condition} />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              )}

              {detailsTab === 1 && (
                <Typography>Medical history will be displayed here</Typography>
              )}

              {detailsTab === 2 && (
                <Typography>Appointment history will be displayed here</Typography>
              )}

              {detailsTab === 3 && (
                <Typography>Documents will be displayed here</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
          <Button variant="contained" onClick={() => handleScheduleAppointment(selectedPatient!)}>
            Schedule Appointment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create/Edit Patient Dialog */}
      <PatientFormDialog
        open={editOpen || createOpen}
        onClose={() => {
          setEditOpen(false);
          setCreateOpen(false);
        }}
        patient={editOpen ? selectedPatient : null}
        onSave={handleSavePatient}
      />
    </Box>
  );
};

// Patient Form Dialog Component
interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  patient: PatientType | null;
  onSave: (data: any) => void;
}

const PatientFormDialog: React.FC<PatientFormDialogProps> = ({
  open,
  onClose,
  patient,
  onSave,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{patient ? 'Edit Patient' : 'New Patient'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              defaultValue={patient?.firstName}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              defaultValue={patient?.lastName}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              defaultValue={patient?.email}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              defaultValue={patient?.phone}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              defaultValue={patient?.dateOfBirth}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                defaultValue={patient?.gender || ''}
                label="Gender"
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              defaultValue={patient?.address?.street}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="City"
              defaultValue={patient?.address?.city}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>State</InputLabel>
              <Select
                defaultValue={patient?.address?.state || ''}
                label="State"
              >
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
              defaultValue={patient?.address?.postcode}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Insurance Provider"
              defaultValue={patient?.insuranceProvider}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Medicare Number"
              defaultValue=""
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={onSave}>
          {patient ? 'Save Changes' : 'Create Patient'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default Patients;
