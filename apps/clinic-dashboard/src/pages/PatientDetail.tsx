import { useParams, useNavigate } from 'react-router-dom';
import { Box, Paper, Typography, Grid, Avatar, Chip, Divider } from '@mui/material';
import {
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Warning as AllergyIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { patientApi } from '../services/patientApi';
import {
  PageHeader,
  StatCardSkeleton,
  AuraEmptyState,
  InfoCard,
  AuraButton,
} from '@qivr/design-system';
import { format, parseISO } from 'date-fns';

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Typography variant="body2" color="text.secondary">
      {label}:
    </Typography>
    <Typography variant="body2">{value || 'N/A'}</Typography>
  </Box>
);

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientApi.getPatient(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box>
        <PageHeader title="Patient Details" description="Loading patient information..." />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <StatCardSkeleton />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!patient) {
    return (
      <Box>
        <PageHeader title="Patient Details" />
        <Paper sx={{ p: 4, borderRadius: 3 }}>
          <AuraEmptyState
            title="Patient not found"
            description="The patient you're looking for doesn't exist or has been removed"
          />
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <AuraButton
              variant="contained"
              startIcon={<BackIcon />}
              onClick={() => navigate('/medical-records')}
            >
              Back to Medical Records
            </AuraButton>
          </Box>
        </Paper>
      </Box>
    );
  }

  const fullAddress = [
    patient.address?.street,
    patient.address?.city,
    patient.address?.state,
    patient.address?.postcode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Box>
      <PageHeader
        title="Patient Details"
        actions={
          <>
            <AuraButton startIcon={<BackIcon />} onClick={() => navigate('/medical-records')}>
              Back
            </AuraButton>
            <AuraButton variant="contained" startIcon={<EditIcon />}>
              Edit
            </AuraButton>
          </>
        }
      />

      <Grid container spacing={3}>
        {/* Basic Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoCard title="Patient Information">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar sx={{ width: 80, height: 80, mb: 2, bgcolor: 'primary.main', fontSize: 32 }}>
                {patient.firstName?.[0]}
                {patient.lastName?.[0]}
              </Avatar>
              <Typography variant="h6">
                {patient.firstName} {patient.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <InfoRow label="Phone" value={patient.phone} />
              <InfoRow
                label="Date of Birth"
                value={
                  patient.dateOfBirth
                    ? format(parseISO(patient.dateOfBirth), 'MMM d, yyyy')
                    : undefined
                }
              />
              <InfoRow label="Gender" value={patient.gender} />
              <InfoRow label="Address" value={fullAddress || undefined} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip label="Active" color="success" size="small" />
              </Box>
            </Box>
          </InfoCard>
        </Grid>

        {/* Emergency Contact & Insurance */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <InfoCard title="Emergency Contact">
              {patient.emergencyContact ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <InfoRow label="Name" value={patient.emergencyContact} />
                  <InfoRow label="Phone" value={patient.emergencyPhone} />
                  <InfoRow label="Relationship" value={patient.emergencyContactRelationship} />
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No emergency contact on file
                </Typography>
              )}
            </InfoCard>

            <InfoCard title="Insurance & Medicare">
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {patient.medicareNumber && (
                  <>
                    <InfoRow label="Medicare Number" value={patient.medicareNumber} />
                    <InfoRow label="Medicare Ref" value={patient.medicareRef} />
                    <InfoRow label="Medicare Expiry" value={patient.medicareExpiry} />
                    <Divider sx={{ my: 1 }} />
                  </>
                )}
                <InfoRow label="Insurance Provider" value={patient.insuranceProvider} />
                <InfoRow label="Member ID" value={patient.insuranceNumber} />
              </Box>
            </InfoCard>
          </Box>
        </Grid>

        {/* Medical Info */}
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoCard title="Medical Information">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Allergies */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <AllergyIcon color="error" fontSize="small" />
                  <Typography variant="subtitle2">Allergies</Typography>
                </Box>
                {patient.allergies?.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {patient.allergies.map((a) => (
                      <Chip key={a} label={a} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No known allergies
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Medications */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Current Medications
                </Typography>
                {patient.medications?.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {patient.medications.map((m) => (
                      <Chip key={m} label={m} size="small" color="info" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No medications listed
                  </Typography>
                )}
              </Box>

              <Divider />

              {/* Conditions */}
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Medical Conditions
                </Typography>
                {patient.conditions?.length ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {patient.conditions.map((c) => (
                      <Chip key={c} label={c} size="small" variant="outlined" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No conditions listed
                  </Typography>
                )}
              </Box>
            </Box>
          </InfoCard>
        </Grid>
      </Grid>
    </Box>
  );
}
