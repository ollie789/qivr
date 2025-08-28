import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Card,
  CardContent,
  Avatar,
  Skeleton,
  Alert,
  InputAdornment,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Cancel as CancelIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, isFuture, isToday } from 'date-fns';
import { api } from '../services/api';

interface Appointment {
  id: string;
  providerId: string;
  providerName: string;
  providerSpecialty: string;
  appointmentType: string;
  scheduledStart: string;
  scheduledEnd: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  location?: string;
  isVirtual: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

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
      id={`appointments-tabpanel-${index}`}
      aria-labelledby={`appointments-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const Appointments: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch appointments
  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ['appointments', tabValue, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tabValue === 0) params.append('upcoming', 'true');
      if (tabValue === 1) params.append('past', 'true');
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await api.get(`/appointments?${params}`);
      return response.data;
    },
  });

  // Cancel appointment mutation
  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      return api.put(`/appointments/${id}/cancel`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setCancelDialogOpen(false);
      setSelectedAppointment(null);
      setCancelReason('');
    },
  });

  // Reschedule appointment mutation
  const rescheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.post(`/appointments/${id}/reschedule`);
    },
    onSuccess: (data) => {
      navigate(`/appointments/reschedule/${data.data.id}`);
    },
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => {
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCancelClick = () => {
    handleMenuClose();
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = () => {
    if (selectedAppointment && cancelReason) {
      cancelMutation.mutate({ id: selectedAppointment.id, reason: cancelReason });
    }
  };

  const handleReschedule = () => {
    if (selectedAppointment) {
      rescheduleMutation.mutate(selectedAppointment.id);
    }
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'scheduled': return 'info';
      case 'completed': return 'default';
      case 'cancelled': return 'error';
      case 'no-show': return 'warning';
      default: return 'default';
    }
  };

  const getAppointmentIcon = (isVirtual: boolean) => {
    return isVirtual ? <VideoCallIcon /> : <LocationIcon />;
  };

  const filteredAppointments = appointments?.filter(apt => 
    apt.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apt.appointmentType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
    const date = parseISO(appointment.scheduledStart);
    const isUpcoming = isFuture(date);
    
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                  <PersonIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">
                    {appointment.providerName}
                  </Typography>
                  <Typography color="text.secondary" gutterBottom>
                    {appointment.providerSpecialty} • {appointment.appointmentType}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Chip
                      icon={<ScheduleIcon />}
                      label={format(date, 'MMM dd, yyyy • h:mm a')}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      icon={getAppointmentIcon(appointment.isVirtual)}
                      label={appointment.isVirtual ? 'Virtual' : appointment.location || 'In-Person'}
                      size="small"
                      variant="outlined"
                    />
                    <Chip
                      label={appointment.status}
                      color={getStatusColor(appointment.status)}
                      size="small"
                    />
                  </Box>
                  {appointment.notes && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Notes: {appointment.notes}
                    </Typography>
                  )}
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                {isUpcoming && appointment.status === 'scheduled' && (
                  <>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleReschedule()}
                    >
                      Reschedule
                    </Button>
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, appointment)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </>
                )}
                {appointment.isVirtual && isToday(date) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<VideoCallIcon />}
                  >
                    Join Call
                  </Button>
                )}
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Appointments
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your upcoming and past appointments
        </Typography>
      </Box>

      {/* Actions Bar */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search appointments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                startIcon={<FilterIcon />}
                onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
              >
                Filter
              </Button>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/appointments/book')}
              >
                Book Appointment
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Upcoming" />
          <Tab label="Past" />
          <Tab label="All" />
        </Tabs>
      </Box>

      {/* Appointments List */}
      <TabPanel value={tabValue} index={0}>
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={150} sx={{ mb: 2 }} />
          ))
        ) : filteredAppointments?.length === 0 ? (
          <Alert severity="info">
            No upcoming appointments. Would you like to book one?
            <Button
              size="small"
              sx={{ ml: 2 }}
              onClick={() => navigate('/appointments/book')}
            >
              Book Now
            </Button>
          </Alert>
        ) : (
          filteredAppointments?.map(appointment => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={150} sx={{ mb: 2 }} />
          ))
        ) : filteredAppointments?.length === 0 ? (
          <Alert severity="info">No past appointments found.</Alert>
        ) : (
          filteredAppointments?.map(appointment => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={150} sx={{ mb: 2 }} />
          ))
        ) : filteredAppointments?.length === 0 ? (
          <Alert severity="info">No appointments found.</Alert>
        ) : (
          filteredAppointments?.map(appointment => (
            <AppointmentCard key={appointment.id} appointment={appointment} />
          ))
        )}
      </TabPanel>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleReschedule}>
          <EditIcon sx={{ mr: 1 }} /> Reschedule
        </MenuItem>
        <MenuItem onClick={handleCancelClick}>
          <CancelIcon sx={{ mr: 1 }} /> Cancel
        </MenuItem>
      </Menu>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setFilterStatus('all'); setFilterMenuAnchor(null); }}>
          All Statuses
        </MenuItem>
        <MenuItem onClick={() => { setFilterStatus('scheduled'); setFilterMenuAnchor(null); }}>
          Scheduled
        </MenuItem>
        <MenuItem onClick={() => { setFilterStatus('confirmed'); setFilterMenuAnchor(null); }}>
          Confirmed
        </MenuItem>
        <MenuItem onClick={() => { setFilterStatus('completed'); setFilterMenuAnchor(null); }}>
          Completed
        </MenuItem>
        <MenuItem onClick={() => { setFilterStatus('cancelled'); setFilterMenuAnchor(null); }}>
          Cancelled
        </MenuItem>
      </Menu>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Are you sure you want to cancel this appointment with {selectedAppointment?.providerName}?
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Reason for cancellation"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Keep Appointment</Button>
          <Button
            onClick={handleCancelConfirm}
            color="error"
            variant="contained"
            disabled={!cancelReason}
          >
            Cancel Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};
