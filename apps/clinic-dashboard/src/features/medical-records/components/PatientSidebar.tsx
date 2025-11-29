import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Avatar,
  InputAdornment,
  TextField,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  alpha,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { parseISO, differenceInYears } from 'date-fns';
import { auraColors, auraTokens } from '@qivr/design-system';
import type { Patient } from '../types';

interface PatientSidebarProps {
  patients: Patient[];
  selectedPatientId: string | null;
  onSelectPatient: (id: string) => void;
  isLoading?: boolean;
}

export const PatientSidebar: React.FC<PatientSidebarProps> = ({
  patients,
  selectedPatientId,
  onSelectPatient,
  isLoading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPatients = useMemo(() => {
    if (!searchQuery) return patients;
    const search = searchQuery.toLowerCase();
    return patients.filter(
      (p) =>
        p.firstName?.toLowerCase().includes(search) ||
        p.lastName?.toLowerCase().includes(search) ||
        p.email?.toLowerCase().includes(search)
    );
  }, [patients, searchQuery]);

  const getInitials = (patient: Patient) => {
    return `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`;
  };

  const getAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    try {
      return differenceInYears(new Date(), parseISO(dateOfBirth));
    } catch {
      return null;
    }
  };

  return (
    <Box
      sx={{
        width: auraTokens.responsive.detailSidebar,
        height: '100%',
        bgcolor: 'background.paper',
        borderRight: { md: '1px solid' },
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
          Patients
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              bgcolor: 'action.hover',
              '& fieldset': { border: 'none' },
            },
          }}
        />
      </Box>

      {/* Patient Count */}
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary">
          {isLoading ? 'Loading...' : `${filteredPatients.length} patients`}
        </Typography>
      </Box>

      {/* Patient List */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <List disablePadding>
            {Array.from({ length: 8 }).map((_, i) => (
              <Box key={i} sx={{ px: 2, py: 1.5, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Skeleton variant="circular" width={44} height={44} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="70%" height={20} />
                  <Skeleton variant="text" width="50%" height={16} />
                </Box>
              </Box>
            ))}
          </List>
        ) : filteredPatients.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              {searchQuery ? 'No patients found' : 'No patients yet'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {filteredPatients.map((patient) => {
              const isSelected = patient.id === selectedPatientId;
              const age = getAge(patient.dateOfBirth);

              return (
                <ListItemButton
                  key={patient.id}
                  selected={isSelected}
                  onClick={() => onSelectPatient(patient.id)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderLeft: '3px solid',
                    borderColor: isSelected ? 'primary.main' : 'transparent',
                    bgcolor: isSelected ? alpha(auraColors.blue.main, 0.08) : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected
                        ? alpha(auraColors.blue.main, 0.12)
                        : 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar
                      sx={{
                        width: 44,
                        height: 44,
                        bgcolor: isSelected ? 'primary.main' : alpha(auraColors.blue.main, 0.1),
                        color: isSelected ? 'primary.contrastText' : 'primary.main',
                        fontSize: '0.95rem',
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(patient)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="body2" fontWeight={isSelected ? 600 : 500}>
                        {patient.firstName} {patient.lastName}
                      </Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                        {age && (
                          <Typography variant="caption" color="text.secondary">
                            {age} yrs
                          </Typography>
                        )}
                        {patient.gender && (
                          <>
                            <Typography variant="caption" color="text.secondary">
                              •
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {patient.gender}
                            </Typography>
                          </>
                        )}
                      </Box>
                    }
                  />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default PatientSidebar;
