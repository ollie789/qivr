import { useState } from 'react';
import { Box, Typography, Collapse, Chip, Stack, alpha, Skeleton } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  LocalHospital as MedicalIcon,
  Medication as MedicationIcon,
  Warning as AllergyIcon,
} from '@mui/icons-material';
import { auraColors } from '@qivr/design-system';
import type { MedicalSummary, Medication, Allergy } from '../../services/medicalRecordsApi';

interface MedicalHistoryPanelProps {
  medicalSummary: MedicalSummary | null | undefined;
  medications: Medication[];
  allergies: Allergy[];
  isLoading?: boolean;
}

export function MedicalHistoryPanel({
  medicalSummary,
  medications,
  allergies,
  isLoading,
}: MedicalHistoryPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="text" width={150} />
        <Skeleton variant="rectangular" height={60} sx={{ mt: 1, borderRadius: 1 }} />
      </Box>
    );
  }

  const hasConditions = medicalSummary?.conditions && medicalSummary.conditions.length > 0;
  const hasMedications = medications.length > 0;
  const hasAllergies = allergies.length > 0;

  if (!hasConditions && !hasMedications && !hasAllergies) {
    return null;
  }

  const activeConditions =
    medicalSummary?.conditions?.filter((c) => c.status.toLowerCase() === 'active') || [];

  const activeMedications = medications.filter((m) => m.status.toLowerCase() === 'active');

  const severityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'severe':
      case 'high':
        return auraColors.red.main;
      case 'moderate':
      case 'medium':
        return auraColors.orange.main;
      default:
        return auraColors.orange.light;
    }
  };

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MedicalIcon fontSize="small" color="error" />
          <Typography variant="subtitle2" fontWeight={600}>
            Medical History
          </Typography>
          {hasAllergies && (
            <Chip
              label={`${allergies.length} allergies`}
              size="small"
              color="error"
              sx={{ height: 18, fontSize: '0.65rem' }}
            />
          )}
        </Box>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>

      <Collapse in={expanded}>
        <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
          {/* Allergies - Always show first as critical info */}
          {hasAllergies && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <AllergyIcon sx={{ fontSize: 14, color: auraColors.red.main }} />
                <Typography variant="caption" fontWeight={600} color={auraColors.red.main}>
                  Allergies
                </Typography>
              </Box>
              <Stack spacing={0.5}>
                {allergies.slice(0, 4).map((allergy) => (
                  <Box
                    key={allergy.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.75,
                      bgcolor: alpha(auraColors.red.main, 0.08),
                      borderRadius: 1,
                      border: `1px solid ${alpha(auraColors.red.main, 0.2)}`,
                    }}
                  >
                    <Box>
                      <Typography variant="caption" fontWeight={500}>
                        {allergy.allergen}
                      </Typography>
                      {allergy.reaction && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          {allergy.reaction}
                        </Typography>
                      )}
                    </Box>
                    <Chip
                      label={allergy.severity}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: '0.6rem',
                        bgcolor: alpha(severityColor(allergy.severity), 0.2),
                        color: severityColor(allergy.severity),
                        textTransform: 'capitalize',
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Active Conditions */}
          {activeConditions.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Active Conditions
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {activeConditions.slice(0, 4).map((condition) => (
                  <Box
                    key={condition.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.75,
                      bgcolor: 'action.hover',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption">{condition.condition}</Typography>
                    {condition.icd10Code && (
                      <Chip
                        label={condition.icd10Code}
                        size="small"
                        variant="outlined"
                        sx={{ height: 18, fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                ))}
                {activeConditions.length > 4 && (
                  <Typography variant="caption" color="text.secondary">
                    +{activeConditions.length - 4} more conditions
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          {/* Active Medications */}
          {activeMedications.length > 0 && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                <MedicationIcon sx={{ fontSize: 14, color: auraColors.blue.main }} />
                <Typography variant="caption" color="text.secondary">
                  Current Medications
                </Typography>
              </Box>
              <Stack spacing={0.5}>
                {activeMedications.slice(0, 4).map((med) => (
                  <Box
                    key={med.id}
                    sx={{
                      p: 0.75,
                      bgcolor: alpha(auraColors.blue.main, 0.05),
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="caption" fontWeight={500}>
                      {med.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ fontSize: '0.65rem' }}
                    >
                      {med.dosage} • {med.frequency}
                    </Typography>
                  </Box>
                ))}
                {activeMedications.length > 4 && (
                  <Typography variant="caption" color="text.secondary">
                    +{activeMedications.length - 4} more medications
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
        </Stack>
      </Collapse>
    </Box>
  );
}
