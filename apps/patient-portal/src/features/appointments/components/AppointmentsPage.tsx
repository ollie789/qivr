import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  TextField,
  Menu,
  MenuItem,
  Card,
  CardContent,
  Grid,
  Avatar,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Person as PersonIcon,
  MoreVert as MoreVertIcon,
  VideoCall as VideoCallIcon,
  LocationOn as LocationIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { parseISO, format, isFuture } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAppointmentsData } from '../hooks/useAppointmentsData';
import type { AppointmentDto } from '../types';
import { FormDialog } from '@qivr/design-system';

const statusChipColor = (status: string): 'success' | 'info' | 'default' | 'warning' | 'error' => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'scheduled':
      return 'info';
    case 'no-show':
      return 'warning';
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const AppointmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDto | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filters = useMemo(() => ({
    upcoming: tabValue === 0,
    past: tabValue === 1,
  }), [tabValue]);

  const { appointments, isLoading, cancel, reschedule } = useAppointmentsData(filters);

  console.log('[AppointmentsPage] appointments:', appointments);
  console.log('[AppointmentsPage] isLoading:', isLoading);
  console.log('[AppointmentsPage] filters:', filters);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return appointments.filter((apt) =>
      apt.providerName.toLowerCase().includes(term) ||
      apt.appointmentType.toLowerCase().includes(term)
    );
  }, [appointments, searchTerm]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, appointment: AppointmentDto) => {
    setAnchorEl(event.currentTarget);
    setSelectedAppointment(appointment);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleCancelConfirm = async () => {
    if (selectedAppointment && cancelReason) {
      await cancel({ id: selectedAppointment.id, reason: cancelReason });
      setCancelDialogOpen(false);
      setCancelReason('');
    }
  };

  const handleReschedule = async () => {
    if (selectedAppointment) {
      const response = await reschedule(selectedAppointment.id);
      navigate(`/appointments/reschedule/${response.id}`);
    }
    handleMenuClose();
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Appointments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage upcoming and past appointments, reschedule or cancel as needed.
        </Typography>
      </Box>

      <Tabs value={tabValue} onChange={(_, value) => setTabValue(value)} sx={{ mb: 3 }}>
        <Tab label="Upcoming" />
        <Tab label="Past" />
      </Tabs>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <TextField
          label="Search"
          size="small"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search by provider or type"
        />
      </Box>

      {isLoading ? (
        <Typography variant="body2" color="text.secondary">Loading appointments…</Typography>
      ) : filtered.length === 0 ? (
        <Typography variant="body2" color="text.secondary">No appointments found.</Typography>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((appointment) => {
            const start = parseISO(appointment.scheduledStart);
            const upcoming = isFuture(start);
            return (
              <Grid item xs={12} key={appointment.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <PersonIcon />
                        </Avatar>
                      </Grid>
                      <Grid item xs>
                        <Typography variant="h6">{appointment.providerName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {appointment.providerSpecialty} • {appointment.appointmentType}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {format(start, 'MMM dd, yyyy • h:mm a')} ({upcoming ? 'Upcoming' : 'Past'})
                        </Typography>
                      </Grid>
                      <Grid item>
                        <Chip
                          label={appointment.status}
                          color={statusChipColor(appointment.status)}
                          size="small"
                        />
                      </Grid>
                      <Grid item>
                        <Chip
                          icon={appointment.isVirtual ? <VideoCallIcon /> : <LocationIcon />}
                          label={appointment.isVirtual ? 'Virtual' : 'In person'}
                          size="small"
                        />
                      </Grid>
                      <Grid item>
                        <IconButton onClick={(event) => handleMenuOpen(event, appointment)}>
                          <MoreVertIcon />
                        </IconButton>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem onClick={handleReschedule}>Reschedule</MenuItem>
        <MenuItem
          onClick={() => {
            handleMenuClose();
            setCancelDialogOpen(true);
          }}
        >
          <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancel
        </MenuItem>
      </Menu>

      <FormDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        title="Cancel appointment"
        onSubmit={handleCancelConfirm}
        submitLabel="Cancel Appointment"
        submitDisabled={!cancelReason}
        maxWidth="sm"
      >
        <TextField
          label="Reason"
          value={cancelReason}
          onChange={(event) => setCancelReason(event.target.value)}
          fullWidth
          multiline
          rows={3}
        />
      </FormDialog>
    </Container>
  );
};

export default AppointmentsPage;
