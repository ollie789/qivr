import React from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Edit as EditIcon,
  Message as MessageIcon,
  CalendarMonth as CalendarIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  Bloodtype as BloodtypeIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { format, parseISO, differenceInYears } from 'date-fns';
import { AuraButton, auraTokens } from '@qivr/design-system';
import type { Patient, PatientQuickStats } from '../types';

interface PatientHeaderProps {
  patient: Patient | null;
  stats: PatientQuickStats | null;
  isLoading?: boolean;
  onEdit?: () => void;
  onMessage?: () => void;
  onSchedule?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  stats,
  isLoading = false,
  onEdit,
  onMessage,
  onSchedule,
}) => {
  const getInitials = () => {
    if (!patient) return '??';
    return `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`;
  };

  const getAge = () => {
    if (!patient?.dateOfBirth) return null;
    try {
      return differenceInYears(new Date(), parseISO(patient.dateOfBirth));
    } catch {
      return null;
    }
  };

  const age = getAge();

  if (isLoading) {
    return (
      <Box
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          gap: 3,
          alignItems: 'center',
        }}
      >
        <Skeleton variant="circular" width={72} height={72} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width={200} height={32} />
          <Skeleton variant="text" width={300} height={20} />
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={100} height={36} />
          <Skeleton variant="rounded" width={100} height={36} />
        </Box>
      </Box>
    );
  }

  if (!patient) {
    return (
      <Box
        sx={{
          p: 4,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <Typography variant="h6" color="text.secondary">
          Select a patient to view their medical records
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* Avatar */}
        <Avatar
          sx={{
            width: auraTokens.avatar.xl,
            height: auraTokens.avatar.xl,
            bgcolor: 'primary.main',
            fontSize: '1.5rem',
            fontWeight: 600,
          }}
        >
          {getInitials()}
        </Avatar>

        {/* Patient Info */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" fontWeight={600} noWrap>
              {patient.firstName} {patient.lastName}
            </Typography>
            {stats && stats.allergiesCount > 0 && (
              <Chip
                icon={<WarningIcon sx={{ fontSize: 14 }} />}
                label={`${stats.allergiesCount} Allergies`}
                size="small"
                color="warning"
                sx={{ height: 24, '& .MuiChip-label': { px: 1 } }}
              />
            )}
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {age && `${age} years old`}
            {age && patient.gender && ' • '}
            {patient.gender}
            {(age || patient.gender) && patient.dateOfBirth && ' • '}
            {patient.dateOfBirth && `DOB: ${format(parseISO(patient.dateOfBirth), 'MMM d, yyyy')}`}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
            <Typography variant="body2">{patient.email}</Typography>
            {patient.phone && (
              <>
                <Typography variant="body2">•</Typography>
                <Typography variant="body2">{patient.phone}</Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Quick Stats */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[
            { icon: <BloodtypeIcon />, label: 'Blood Type', value: stats?.bloodType || 'N/A' },
            { icon: <MedicationIcon />, label: 'Medications', value: stats?.activeMedicationsCount ?? 0 },
            { icon: <ScheduleIcon />, label: 'Last Visit', value: stats?.lastVisit || 'N/A' },
          ].map((stat, i) => (
            <Box
              key={i}
              sx={{
                px: 2,
                py: 1.5,
                bgcolor: 'action.hover',
                borderRadius: 2,
                minWidth: auraTokens.formControl.sm,
                textAlign: 'center',
              }}
            >
              <Box sx={{ color: 'text.secondary', mb: 0.5, '& svg': { fontSize: 20 } }}>
                {stat.icon}
              </Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <AuraButton
            variant="outlined"
            size="small"
            startIcon={<MessageIcon />}
            onClick={onMessage}
          >
            Message
          </AuraButton>
          <AuraButton
            variant="outlined"
            size="small"
            startIcon={<CalendarIcon />}
            onClick={onSchedule}
          >
            Schedule
          </AuraButton>
          <Tooltip title="Edit patient">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default PatientHeader;
