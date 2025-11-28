import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  Stack,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Emergency as EmergencyIcon,
  HealthAndSafety as InsuranceIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { parseISO } from 'date-fns';
import { glassTokens, SelectField } from '@qivr/design-system';
import type { Patient } from '../types';

interface DemographicsTabProps {
  patient: Patient | null;
  editedPatient: Partial<Patient>;
  editMode: boolean;
  onPatientChange: (updates: Partial<Patient>) => void;
}

const SectionCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, icon, children }) => (
  <Box
    sx={{
      p: 3,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      boxShadow: glassTokens.shadow.subtle,
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          display: 'flex',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
    </Box>
    {children}
  </Box>
);

export const DemographicsTab: React.FC<DemographicsTabProps> = ({
  patient,
  editedPatient,
  editMode,
  onPatientChange,
}) => {
  if (!patient) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">No patient selected</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Personal Information */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Personal Information" icon={<PersonIcon />}>
            <Stack spacing={2.5}>
              <Grid container spacing={2}>
                <Grid size={6}>
                  <TextField
                    label="First Name"
                    value={editedPatient?.firstName || ''}
                    onChange={(e) => onPatientChange({ firstName: e.target.value })}
                    disabled={!editMode}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={6}>
                  <TextField
                    label="Last Name"
                    value={editedPatient?.lastName || ''}
                    onChange={(e) => onPatientChange({ lastName: e.target.value })}
                    disabled={!editMode}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
              <DatePicker
                label="Date of Birth"
                value={editedPatient?.dateOfBirth ? parseISO(editedPatient.dateOfBirth) : null}
                onChange={(date) =>
                  onPatientChange({ dateOfBirth: date?.toISOString() })
                }
                disabled={!editMode}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
              <SelectField
                label="Gender"
                value={editedPatient?.gender || ''}
                onChange={(value) => onPatientChange({ gender: value })}
                disabled={!editMode}
                options={[
                  { value: 'Male', label: 'Male' },
                  { value: 'Female', label: 'Female' },
                  { value: 'Other', label: 'Other' },
                ]}
                fullWidth
                size="small"
              />
            </Stack>
          </SectionCard>
        </Grid>

        {/* Contact Information */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Contact Information" icon={<PhoneIcon />}>
            <Stack spacing={2.5}>
              <TextField
                label="Email"
                type="email"
                value={editedPatient?.email || ''}
                onChange={(e) => onPatientChange({ email: e.target.value })}
                disabled={!editMode}
                fullWidth
                size="small"
              />
              <TextField
                label="Phone"
                value={editedPatient?.phone || ''}
                onChange={(e) => onPatientChange({ phone: e.target.value })}
                disabled={!editMode}
                fullWidth
                size="small"
              />
              <TextField
                label="Street Address"
                value={editedPatient?.address?.street || ''}
                onChange={(e) =>
                  onPatientChange({
                    address: { ...editedPatient.address, street: e.target.value },
                  })
                }
                disabled={!editMode}
                fullWidth
                size="small"
              />
              <Grid container spacing={2}>
                <Grid size={5}>
                  <TextField
                    label="City"
                    value={editedPatient?.address?.city || ''}
                    onChange={(e) =>
                      onPatientChange({
                        address: { ...editedPatient.address, city: e.target.value },
                      })
                    }
                    disabled={!editMode}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={3}>
                  <TextField
                    label="State"
                    value={editedPatient?.address?.state || ''}
                    onChange={(e) =>
                      onPatientChange({
                        address: { ...editedPatient.address, state: e.target.value },
                      })
                    }
                    disabled={!editMode}
                    fullWidth
                    size="small"
                  />
                </Grid>
                <Grid size={4}>
                  <TextField
                    label="Zip Code"
                    value={(editedPatient?.address as any)?.zipCode || ''}
                    onChange={(e) =>
                      onPatientChange({
                        address: { ...editedPatient.address, zipCode: e.target.value } as any,
                      })
                    }
                    disabled={!editMode}
                    fullWidth
                    size="small"
                  />
                </Grid>
              </Grid>
            </Stack>
          </SectionCard>
        </Grid>

        {/* Emergency Contact */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Emergency Contact" icon={<EmergencyIcon />}>
            <Stack spacing={2.5}>
              <TextField
                label="Contact Name"
                value={(patient?.emergencyContact as any)?.name || ''}
                disabled={!editMode}
                fullWidth
                size="small"
              />
              <TextField
                label="Relationship"
                value={(patient?.emergencyContact as any)?.relationship || ''}
                disabled={!editMode}
                fullWidth
                size="small"
              />
              <TextField
                label="Phone Number"
                value={(patient?.emergencyContact as any)?.phone || ''}
                disabled={!editMode}
                fullWidth
                size="small"
              />
            </Stack>
          </SectionCard>
        </Grid>

        {/* Insurance Information */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <SectionCard title="Insurance Information" icon={<InsuranceIcon />}>
            <Stack spacing={2.5}>
              <TextField
                label="Insurance Provider"
                value={(patient as any)?.insurance?.provider || ''}
                disabled={!editMode}
                fullWidth
                size="small"
              />
              <TextField
                label="Policy Number"
                value={(patient as any)?.insurance?.policyNumber || ''}
                disabled={!editMode}
                fullWidth
                size="small"
              />
              <TextField
                label="Group Number"
                value={(patient as any)?.insurance?.groupNumber || ''}
                disabled={!editMode}
                fullWidth
                size="small"
              />
            </Stack>
          </SectionCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DemographicsTab;
