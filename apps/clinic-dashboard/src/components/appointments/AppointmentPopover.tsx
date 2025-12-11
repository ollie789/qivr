import {
  Box,
  Typography,
  Popover,
  Divider,
  Stack,
  Chip,
  alpha,
  useTheme,
  type Theme,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  EventNote as ReasonIcon,
  PlayArrow as StartIcon,
  Visibility as ViewIcon,
  EditCalendar as RescheduleIcon,
  MoreVert as MoreIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { auraColors, AuraButton } from '@qivr/design-system';
import type { Appointment } from '../../features/appointments/types';

interface AppointmentPopoverProps {
  appointment: Appointment | null;
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  onStartSession: (appointment: Appointment) => void;
  onViewPatient: (patientId: string) => void;
  onReschedule: (appointment: Appointment) => void;
  onMoreOptions: (event: React.MouseEvent<HTMLElement>, appointment: Appointment) => void;
}

function getStatusColor(status: string, theme: Theme) {
  switch (status) {
    case 'completed':
      return theme.palette.success.main;
    case 'confirmed':
    case 'scheduled':
      return theme.palette.primary.main;
    case 'in-progress':
      return theme.palette.warning.main;
    case 'cancelled':
    case 'no-show':
      return theme.palette.error.main;
    case 'checked-in':
      return auraColors.cyan.main;
    default:
      return theme.palette.grey[500];
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'in-progress':
      return 'In Progress';
    case 'no-show':
      return 'No Show';
    case 'checked-in':
      return 'Checked In';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function formatAppointmentType(type: string): string {
  return type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function AppointmentPopover({
  appointment,
  anchorEl,
  open,
  onClose,
  onStartSession,
  onViewPatient,
  onReschedule,
  onMoreOptions,
}: AppointmentPopoverProps) {
  const theme = useTheme();

  if (!appointment) return null;

  const statusColor = getStatusColor(appointment.status, theme);
  const isInProgress = appointment.status === 'in-progress';
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled' || appointment.status === 'no-show';
  const canStart = !isCompleted && !isCancelled && !isInProgress;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'center',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'center',
        horizontal: 'left',
      }}
      slotProps={{
        paper: {
          sx: {
            width: 320,
            borderRadius: 2,
            boxShadow: theme.shadows[8],
            border: `1px solid ${theme.palette.divider}`,
            overflow: 'hidden',
          },
        },
      }}
    >
      {/* Status Bar */}
      <Box
        sx={{
          height: 4,
          bgcolor: statusColor,
        }}
      />

      {/* Content */}
      <Box sx={{ p: 2 }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 1.5,
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} noWrap>
              {appointment.patientName}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Chip
                label={formatAppointmentType(appointment.appointmentType)}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              />
              <Chip
                label={getStatusLabel(appointment.status)}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.7rem',
                  bgcolor: alpha(statusColor, 0.15),
                  color: statusColor,
                  fontWeight: 600,
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Details */}
        <Stack spacing={1.5} sx={{ mb: 2 }}>
          {/* Time */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <TimeIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2">
              {format(parseISO(appointment.scheduledStart), 'h:mm a')}
              {' - '}
              {format(parseISO(appointment.scheduledEnd), 'h:mm a')}
            </Typography>
          </Box>

          {/* Location */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <LocationIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
              {appointment.locationType || 'In-person'}
            </Typography>
          </Box>

          {/* Reason for Visit */}
          {appointment.reasonForVisit && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <ReasonIcon sx={{ fontSize: 18, color: 'text.secondary', mt: 0.25 }} />
              <Typography variant="body2" color="text.secondary">
                {appointment.reasonForVisit}
              </Typography>
            </Box>
          )}
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {canStart && (
            <AuraButton
              variant="contained"
              size="small"
              startIcon={<StartIcon />}
              onClick={() => {
                onStartSession(appointment);
                onClose();
              }}
              sx={{ flex: 1 }}
            >
              Start Session
            </AuraButton>
          )}
          {isInProgress && (
            <AuraButton
              variant="contained"
              color="warning"
              size="small"
              startIcon={<StartIcon />}
              onClick={() => {
                onStartSession(appointment);
                onClose();
              }}
              sx={{ flex: 1 }}
            >
              Resume Session
            </AuraButton>
          )}
          <AuraButton
            variant="outlined"
            size="small"
            startIcon={<ViewIcon />}
            onClick={() => {
              onViewPatient(appointment.patientId);
              onClose();
            }}
            sx={{ flex: 1 }}
          >
            View Patient
          </AuraButton>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          {!isCompleted && !isCancelled && (
            <AuraButton
              variant="text"
              size="small"
              startIcon={<RescheduleIcon />}
              onClick={() => {
                onReschedule(appointment);
                onClose();
              }}
              sx={{ flex: 1, color: 'text.secondary' }}
            >
              Reschedule
            </AuraButton>
          )}
          <AuraButton
            variant="text"
            size="small"
            startIcon={<MoreIcon />}
            onClick={(e) => {
              onMoreOptions(e, appointment);
              onClose();
            }}
            sx={{ color: 'text.secondary' }}
          >
            More
          </AuraButton>
        </Box>
      </Box>
    </Popover>
  );
}
