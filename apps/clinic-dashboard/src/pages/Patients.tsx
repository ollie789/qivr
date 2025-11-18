import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  CardContent,
  Divider,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
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
  Tab,
  Tabs,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Schedule as ScheduleIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarMonth as CalendarIcon,
  Assignment as AssignmentIcon,
  MedicalServices as MedicalIcon,
  Download as DownloadIcon,
  FilterList as FilterIcon,
  Message as MessageIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useAuthGuard } from '../hooks/useAuthGuard';
import {
  patientApi,
  type Patient as PatientType,
  type PatientListResponse,
  type CreatePatientDto,
  type UpdatePatientDto,
  type PatientAddress,
} from '../services/patientApi';
import MessageComposer from '../components/MessageComposer';
import FileUpload from '../components/documents';
import { SelectField, type SelectOption } from '../components/forms';
import { QivrButton, QivrCard, TableSection, EmptyState, SkeletonLoader, PageHeader, FlexBetween, SectionLoader, FormDialog, SearchBar, StatusBadge } from '@qivr/design-system';

// Using Patient type from patientApi

const GENDER_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select gender', disabled: true },
  { value: 'Male', label: 'Male' },
  { value: 'Female', label: 'Female' },
  { value: 'Other', label: 'Other' },
];

const STATE_OPTIONS: SelectOption[] = [
  { value: '', label: 'Select state', disabled: true },
  { value: 'NSW', label: 'NSW - New South Wales' },
  { value: 'VIC', label: 'VIC - Victoria' },
  { value: 'QLD', label: 'QLD - Queensland' },
  { value: 'WA', label: 'WA - Western Australia' },
  { value: 'SA', label: 'SA - South Australia' },
  { value: 'TAS', label: 'TAS - Tasmania' },
  { value: 'ACT', label: 'ACT - Australian Capital Territory' },
  { value: 'NT', label: 'NT - Northern Territory' },
];

const Patients: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canMakeApiCalls } = useAuthGuard();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedPatient, setSelectedPatient] = useState<PatientType | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState(0);
  const [messageOpen, setMessageOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const patientDetailQuery = useQuery<PatientType | undefined>({
    queryKey: ['patient-detail', selectedPatient?.id],
    queryFn: () => (selectedPatient?.id ? patientApi.getPatient(selectedPatient.id) : Promise.resolve(undefined)),
    enabled: canMakeApiCalls && detailsOpen && Boolean(selectedPatient?.id),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (patientDetailQuery.data && patientDetailQuery.data.id === selectedPatient?.id) {
      setSelectedPatient(patientDetailQuery.data);
    }
  }, [patientDetailQuery.data, selectedPatient?.id]);

  const detail = patientDetailQuery.data ?? selectedPatient;
  const detailLoading = patientDetailQuery.isLoading || patientDetailQuery.isFetching;

  const queryClient = useQueryClient();
  const patientsQueryKey = useMemo(
    () => ['patients', searchQuery, filterStatus] as const,
    [searchQuery, filterStatus],
  );

  const matchesFilters = useCallback(
    (patient: PatientType) => {
      const normalizedQuery = searchQuery.trim().toLowerCase();
      const matchesSearch =
        normalizedQuery.length === 0 ||
        [patient.firstName, patient.lastName, patient.email, patient.medicalRecordNumber]
          .some((field) => field?.toLowerCase().includes(normalizedQuery));
      const matchesStatus = filterStatus === 'all' || patient.status === filterStatus;
      return matchesSearch && matchesStatus;
    },
    [filterStatus, searchQuery],
  );

  // Fetch patients from API
  const { data: patientsData, isLoading } = useQuery<PatientListResponse>({
    queryKey: patientsQueryKey,
    queryFn: () => patientApi.getPatients({
      search: searchQuery || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined,
    }),
    enabled: canMakeApiCalls,
  });

  const patients = useMemo(
    () => patientsData?.data ?? [],
    [patientsData],
  );
  const filteredPatients = useMemo(
    () => patients.filter(matchesFilters),
    [matchesFilters, patients],
  );

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

  const handleSendMessage = (patient: PatientType) => {
    setSelectedPatient(patient);
    setMessageOpen(true);
  };

  const handleUploadFile = (patient: PatientType) => {
    setSelectedPatient(patient);
    setUploadOpen(true);
  };

  const handleCreatePatient = () => {
    setCreateOpen(true);
  };

  const handleSavePatient = async (patientData?: CreatePatientDto) => {
    try {
      if (editOpen && selectedPatient) {
        if (!patientData) {
          enqueueSnackbar('Please enter patient details before saving', { variant: 'warning' });
          return;
        }

        const { intakeId: _intakeId, ...rest } = patientData;
        const updates: UpdatePatientDto = {
          ...rest,
          status: selectedPatient.status,
        };
        const updatedResponse = await patientApi.updatePatient(selectedPatient.id, updates);
        const updatedPatient = updatedResponse ?? {
          ...selectedPatient,
          ...rest,
        };

        setSelectedPatient(updatedPatient);

        queryClient.setQueryData<PatientListResponse | undefined>(patientsQueryKey, (previous) => {
          if (!previous) return previous;
          const matches = matchesFilters(updatedPatient);
          const alreadyPresent = previous.data.some((p) => p.id === updatedPatient.id);
          let nextData = previous.data;

          if (alreadyPresent) {
            nextData = matches
              ? previous.data.map((p) => (p.id === updatedPatient.id ? updatedPatient : p))
              : previous.data.filter((p) => p.id !== updatedPatient.id);
          } else if (matches) {
            nextData = [updatedPatient, ...previous.data];
          }

          return {
            ...previous,
            data: nextData,
          };
        });

        enqueueSnackbar('Patient updated successfully', { variant: 'success' });
      } else {
        if (!patientData) {
          enqueueSnackbar('Please enter patient details before saving', { variant: 'warning' });
          return;
        }

        const createdPatient = await patientApi.createPatient(patientData);
        const matches = matchesFilters(createdPatient);

        if (matches) {
          queryClient.setQueryData<PatientListResponse | undefined>(patientsQueryKey, (previous) => {
            if (!previous) {
              return previous;
            }
            return {
              ...previous,
              data: [createdPatient, ...previous.data],
              total: (previous.total ?? 0) + 1,
            };
          });
        }

        enqueueSnackbar('Patient created successfully', { variant: 'success' });
      }

      setEditOpen(false);
      setCreateOpen(false);
    } catch (error) {
      enqueueSnackbar('Failed to save patient', { variant: 'error' });
    }
  };

  return (
    <Box>
      <PageHeader
        title="Patients"
        description="Manage patient records and medical history"
        actions={
          <FlexBetween sx={{ gap: 1 }}>
            <QivrButton
              variant="outlined"
              emphasize="subtle"
              startIcon={<DownloadIcon />}
            >
              Export
            </QivrButton>
            <QivrButton
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreatePatient}
            >
              New Patient
            </QivrButton>
          </FlexBetween>
        }
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <QivrCard elevated>
            <CardContent>
              <FlexBetween sx={{ alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Patients
                  </Typography>
                  <Typography variant="h4">{patientsData?.total || patients.length}</Typography>
                </Box>
              </FlexBetween>
            </CardContent>
          </QivrCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QivrCard elevated>
            <CardContent>
              <FlexBetween sx={{ alignItems: 'center', gap: 2 }}>
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
              </FlexBetween>
            </CardContent>
          </QivrCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QivrCard elevated>
            <CardContent>
              <FlexBetween sx={{ alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <CalendarIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Appointments Today
                  </Typography>
                  <Typography variant="h4">8</Typography>
                </Box>
              </FlexBetween>
            </CardContent>
          </QivrCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <QivrCard elevated>
            <CardContent>
              <FlexBetween sx={{ alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <AssignmentIcon />
                </Avatar>
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    New This Month
                  </Typography>
                  <Typography variant="h4">12</Typography>
                </Box>
              </FlexBetween>
            </CardContent>
          </QivrCard>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <TableSection
        header={<Typography variant="h6">Search & Filters</Typography>}
        sx={{ mb: 3, p: 3 }}
      >
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search patients by name, email, or MRN..."
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
              <QivrButton
                fullWidth
                variant="outlined"
                startIcon={<FilterIcon />}
                sx={{ height: '56px' }}
                emphasize="subtle"
              >
                More Filters
              </QivrButton>
            </Grid>
          </Grid>
      </TableSection>

      {/* Patients Table */}
      <TableSection
        header={
          <FlexBetween sx={{ alignItems: 'center' }}>
            <Typography variant="h6">Patients</Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredPatients.length} records
            </Typography>
          </FlexBetween>
        }
      >
        {isLoading ? (
          <SkeletonLoader type="table" count={5} />
        ) : filteredPatients.length === 0 ? (
          <EmptyState
            icon={<PersonIcon />}
            title="No patients found"
            description={searchQuery ? "Try adjusting your search or filter criteria." : "You haven't added any patients yet. Get started by adding your first patient."}
            actionText="Add Patient"
            onAction={handleCreatePatient}
          />
        ) : (
          <>
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
                    <FlexBetween sx={{ alignItems: 'center', gap: 2 }}>
                      <Avatar>
                        {patient.firstName[0]}{patient.lastName[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="body1">
                          {patient.firstName} {patient.lastName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {patient.dateOfBirth && !isNaN(new Date(patient.dateOfBirth).getTime()) ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : 'DOB not set'} • {patient.gender || 'N/A'}
                        </Typography>
                      </Box>
                    </FlexBetween>
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
                    <FlexBetween sx={{ gap: 0.5, flexWrap: 'wrap' }}>
                      {patient.conditions?.slice(0, 2).map((condition) => (
                        <Chip
                          key={condition}
                          label={condition}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                      {(patient.conditions?.length ?? 0) > 2 && (
                        <Chip
                          label={`+${(patient.conditions?.length ?? 0) - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </FlexBetween>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{patient.provider || '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={patient.status} />
                  </TableCell>
                  <TableCell align="right">
                    <FlexBetween sx={{ gap: 1, justifyContent: 'flex-end' }}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(patient)}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Send Message">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleSendMessage(patient)}
                        >
                          <MessageIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Upload Document">
                        <IconButton
                          size="small"
                          onClick={() => handleUploadFile(patient)}
                        >
                          <UploadFileIcon />
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
                    </FlexBetween>
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
          onPageChange={(_e, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
          </>
        )}
      </TableSection>

      {/* Patient Details Dialog */}
      <Dialog 
        open={detailsOpen} 
        onClose={() => setDetailsOpen(false)} 
        maxWidth="md" 
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          <FlexBetween sx={{ alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Patient Details</Typography>
              {detail && (
                <Typography variant="caption" color="text.secondary">
                  {detail.firstName} {detail.lastName}
                </Typography>
              )}
            </Box>
            <Box>
              <IconButton disabled={!detail} onClick={() => detail && handleEdit(detail)}>
                <EditIcon />
              </IconButton>
              <IconButton onClick={() => setDetailsOpen(false)}>
                ×
              </IconButton>
            </Box>
          </FlexBetween>
        </DialogTitle>
        <DialogContent>
          {detailLoading ? (
            <SectionLoader minHeight={200} />
          ) : !detail ? (
            <Typography color="text.secondary">Select a patient to view details.</Typography>
          ) : (
            <Box>
              <Tabs value={detailsTab} onChange={(_, v) => setDetailsTab(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Medical History" />
                <Tab label="Appointments" />
                <Tab label="Documents" />
                <Tab label="PROMs" />
              </Tabs>
              
              {detailsTab === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <List>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText
                          primary="Full Name"
                          secondary={`${detail.firstName} ${detail.lastName}`}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><CalendarIcon /></ListItemIcon>
                        <ListItemText
                          primary="Date of Birth"
                          secondary={detail.dateOfBirth ? format(new Date(detail.dateOfBirth), 'MMMM d, yyyy') : 'Not provided'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><EmailIcon /></ListItemIcon>
                        <ListItemText
                          primary="Email"
                          secondary={detail.email}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PhoneIcon /></ListItemIcon>
                        <ListItemText
                          primary="Phone"
                          secondary={detail.phone ?? 'Not provided'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText
                          primary="Emergency Contact"
                          secondary={detail.emergencyContact ? `${detail.emergencyContact} • ${detail.emergencyPhone ?? 'No phone on file'}` : 'Not provided'}
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
                          secondary={detail.address
                            ? ([detail.address.street, detail.address.city, detail.address.state, detail.address.postcode]
                                .filter(Boolean)
                                .join(', ') || 'Not provided')
                            : 'Not provided'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><MedicalIcon /></ListItemIcon>
                        <ListItemText
                          primary="MRN"
                          secondary={detail.medicalRecordNumber ?? 'Not assigned'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><PersonIcon /></ListItemIcon>
                        <ListItemText
                          primary="Primary Provider"
                          secondary={detail.provider || 'Not assigned'}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon><AssignmentIcon /></ListItemIcon>
                        <ListItemText
                          primary="Insurance"
                          secondary={detail.insuranceProvider || 'Not provided'}
                        />
                      </ListItem>
                      {detail.insuranceNumber && (
                        <ListItem>
                          <ListItemIcon><AssignmentIcon /></ListItemIcon>
                          <ListItemText
                            primary="Insurance Number"
                            secondary={detail.insuranceNumber}
                          />
                        </ListItem>
                      )}
                    </List>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Active Conditions
                    </Typography>
                    <FlexBetween sx={{ gap: 1, flexWrap: 'wrap' }}>
                      {(detail.conditions ?? []).map((condition) => (
                        <Chip key={condition} label={condition} />
                      ))}
                      {(detail.conditions ?? []).length === 0 && (
                        <Typography variant="body2" color="text.secondary">No conditions on record</Typography>
                      )}
                    </FlexBetween>
                    {detail.notes && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>Notes</Typography>
                        <Typography variant="body2" color="text.secondary">{detail.notes}</Typography>
                      </Box>
                    )}
                  </Grid>
                </Grid>
              )}

              {detailsTab === 1 && (
                <Typography color="text.secondary">Medical history coming soon.</Typography>
              )}

              {detailsTab === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Recent Appointments</Typography>
                  {detail.recentAppointments && detail.recentAppointments.length > 0 ? (
                    <List>
                      {detail.recentAppointments.map((appointment) => (
                        <React.Fragment key={appointment.id}>
                          <ListItem alignItems="flex-start">
                            <ListItemIcon><ScheduleIcon /></ListItemIcon>
                            <ListItemText
                              primary={`${appointment.type} with ${appointment.provider}`}
                              secondary={
                                <Box>
                                  <Typography variant="body2">
                                    {format(new Date(appointment.date), 'MMM d, yyyy • h:mm a')}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Status: {appointment.status}
                                  </Typography>
                                  {appointment.notes && (
                                    <Typography variant="caption" display="block" color="text.secondary">
                                      Notes: {appointment.notes}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">No recent appointments recorded.</Typography>
                  )}
                </Box>
              )}

              {detailsTab === 3 && (
                <Box>
                  <FlexBetween sx={{ mb: 2 }}>
                    <Typography variant="h6">Documents</Typography>
                    <QivrButton
                      variant="outlined"
                      startIcon={<UploadFileIcon />}
                      emphasize="subtle"
                      onClick={() => detail && handleUploadFile(detail)}
                    >
                      Upload Document
                    </QivrButton>
                  </FlexBetween>
                  <Typography color="text.secondary">
                    Patient documents and files will be displayed here
                  </Typography>
                </Box>
              )}

              {detailsTab === 4 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Recent PROMs</Typography>
                  {detail.recentProms && detail.recentProms.length > 0 ? (
                    <List>
                      {detail.recentProms.map((prom) => (
                        <React.Fragment key={prom.id}>
                          <ListItem>
                            <ListItemIcon><AssignmentIcon /></ListItemIcon>
                            <ListItemText
                              primary={prom.templateName}
                              secondary={
                                <Box>
                                  <Typography variant="body2">Status: {prom.status}</Typography>
                                  {prom.score !== undefined && (
                                    <Typography variant="caption" color="text.secondary">
                                      Score: {prom.score}
                                    </Typography>
                                  )}
                                  {prom.completedAt && (
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Completed: {format(new Date(prom.completedAt), 'MMM d, yyyy')}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                          <Divider component="li" />
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography color="text.secondary">No PROMs completed yet.</Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <QivrButton emphasize="subtle" onClick={() => setDetailsOpen(false)}>
            Close
          </QivrButton>
          <QivrButton
            variant="outlined"
            startIcon={<MessageIcon />}
            onClick={() => detail && handleSendMessage(detail)}
            disabled={!detail}
            emphasize="subtle"
          >
            Send Message
          </QivrButton>
          <QivrButton
            variant="contained"
            onClick={() => detail && handleScheduleAppointment(detail)}
            disabled={!detail}
          >
            Schedule Appointment
          </QivrButton>
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

      {/* Message Composer Dialog */}
      <MessageComposer
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        recipients={selectedPatient ? [{
          id: selectedPatient.id,
          name: `${selectedPatient.firstName} ${selectedPatient.lastName}`,
          email: selectedPatient.email,
          phone: selectedPatient.phone || undefined,
          type: 'patient' as const
        }] : []}
        onSent={() => {
          enqueueSnackbar('Message sent successfully', { variant: 'success' });
          setMessageOpen(false);
        }}
      />

      {/* File Upload Dialog */}
      <Dialog 
        open={uploadOpen} 
        onClose={() => setUploadOpen(false)} 
        maxWidth="sm" 
        fullWidth
        disableRestoreFocus
      >
        <DialogTitle>
          Upload Document for {selectedPatient?.firstName} {selectedPatient?.lastName}
        </DialogTitle>
        <DialogContent>
          <FileUpload
            onUpload={(files) => {
              console.log('Files uploaded:', files);
              enqueueSnackbar(`${files.length} file(s) uploaded successfully`, { variant: 'success' });
              setUploadOpen(false);
            }}
            category="patient-document"
            patientId={selectedPatient?.id}
          />
        </DialogContent>
        <DialogActions>
          <QivrButton emphasize="subtle" onClick={() => setUploadOpen(false)}>
            Cancel
          </QivrButton>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Patient Form Dialog Component
interface PatientFormDialogProps {
  open: boolean;
  onClose: () => void;
  patient: PatientType | null;
  onSave: (data?: CreatePatientDto) => void;
}

const PatientFormDialog: React.FC<PatientFormDialogProps> = ({
  open,
  onClose,
  patient,
  onSave,
}) => {
  const buildInitialFormState = useCallback(
    (source?: PatientType | null): CreatePatientDto => ({
        firstName: source?.firstName ?? '',
        lastName: source?.lastName ?? '',
        email: source?.email ?? '',
        phone: source?.phone ?? '',
        dateOfBirth: source?.dateOfBirth ?? '',
        gender: source?.gender ?? '',
        address: {
          street: source?.address?.street ?? '',
          city: source?.address?.city ?? '',
          state: source?.address?.state ?? '',
          postcode: source?.address?.postcode ?? '',
        },
        insuranceProvider: source?.insuranceProvider ?? '',
        medicareNumber: '',
        initialConditions: source?.conditions ?? [],
        intakeId: undefined,
      }),
    [],
  );

  const [formState, setFormState] = useState<CreatePatientDto>(() => buildInitialFormState(patient));

  useEffect(() => {
    setFormState(buildInitialFormState(patient));
  }, [patient, open, buildInitialFormState]);

  const handleInputChange = (field: keyof CreatePatientDto) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleAddressChange = (field: keyof PatientAddress) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setFormState((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [field]: value,
        },
      }));
    };

  const handleGenderChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      gender: value,
    }));
  };

  const handleStateChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        state: value,
      },
    }));
  };

  const isValid = Boolean(
    formState.firstName?.trim() &&
      formState.lastName?.trim() &&
      formState.email?.trim() &&
      formState.phone?.trim() &&
      formState.dateOfBirth?.trim() &&
      formState.gender?.trim() &&
      formState.address?.street?.trim() &&
      formState.address?.city?.trim() &&
      formState.address?.state?.trim() &&
      formState.address?.postcode?.trim(),
  );

  const handleSubmit = () => {
    if (!isValid) {
      return;
    }
    onSave(formState);
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={patient ? 'Edit Patient' : 'New Patient'}
      onSubmit={handleSubmit}
      submitLabel={patient ? 'Save Changes' : 'Create Patient'}
      submitDisabled={!isValid}
      maxWidth="md"
    >
      <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="First Name"
              value={formState.firstName}
              onChange={handleInputChange('firstName')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Last Name"
              value={formState.lastName}
              onChange={handleInputChange('lastName')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formState.email}
              onChange={handleInputChange('email')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Phone"
              value={formState.phone}
              onChange={handleInputChange('phone')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={formState.dateOfBirth}
              InputLabelProps={{ shrink: true }}
              onChange={handleInputChange('dateOfBirth')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <SelectField
              label="Gender"
              value={formState.gender || ''}
              onChange={handleGenderChange}
              options={GENDER_OPTIONS}
              required
              size="small"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Street Address"
              value={formState.address?.street || ''}
              onChange={handleAddressChange('street')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="City"
              value={formState.address?.city || ''}
              onChange={handleAddressChange('city')}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <SelectField
              label="State"
              value={formState.address?.state || ''}
              onChange={handleStateChange}
              options={STATE_OPTIONS}
              required
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Postcode"
              value={formState.address?.postcode || ''}
              onChange={handleAddressChange('postcode')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Insurance Provider"
              value={formState.insuranceProvider ?? ''}
              onChange={handleInputChange('insuranceProvider')}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Medicare Number"
              value={formState.medicareNumber ?? ''}
              onChange={handleInputChange('medicareNumber')}
            />
          </Grid>
        </Grid>
      </FormDialog>
  );
};

export default Patients;
