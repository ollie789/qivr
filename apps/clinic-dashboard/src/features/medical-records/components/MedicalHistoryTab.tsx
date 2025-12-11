import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  Tabs,
  Tab,
  Stack,
  Divider,
  alpha,
  Collapse,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Medication as MedicationIcon,
  FitnessCenter as FitnessIcon,
  Flag as GoalIcon,
  Healing as HealingIcon,
  MonitorHeart as SymptomIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as TrendingFlatIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  LocalHospital as HospitalIcon,
  Psychology as PsychologyIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import {
  AuraButton,
  AuraEmptyState,
  AuraCard,
  auraColors,
  PainMap3D,
  type PainRegion,
} from '@qivr/design-system';
import type { MedicalHistory, MedicalHistoryCategory } from '../types';
import type { IntakeDetails } from '../../../services/intakeApi';
import type { PromResponse } from '../../../services/promApi';
import type { Appointment } from '../../../types';
import type { VitalSign } from '../../../services/medicalRecordsApi';

interface MedicalHistoryTabProps {
  medicalHistory: MedicalHistory[];
  onAddEntry: () => void;
  onEditEntry?: (item: MedicalHistory) => void;
  onDeleteEntry?: (item: MedicalHistory) => void;
  // New props for clinical summary
  intakeData?: IntakeDetails | null;
  promResponses?: PromResponse[];
  appointments?: Appointment[];
  vitalSigns?: VitalSign[];
  painProgression?: any;
  onAddAssessment?: () => void;
}

interface CategoryConfig {
  key: MedicalHistoryCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}

// Simplified categories - removed occupation, immunization, activity
const CATEGORIES: CategoryConfig[] = [
  { key: 'injury', label: 'Injuries', icon: <HealingIcon />, color: auraColors.red.main },
  { key: 'symptom', label: 'Symptoms', icon: <SymptomIcon />, color: auraColors.orange.main },
  { key: 'condition', label: 'Conditions', icon: <HospitalIcon />, color: auraColors.blue.main },
  { key: 'goal', label: 'Goals', icon: <GoalIcon />, color: auraColors.cyan.main },
  { key: 'allergy', label: 'Allergies', icon: <WarningIcon />, color: auraColors.red[600] },
  {
    key: 'medication',
    label: 'Medications',
    icon: <MedicationIcon />,
    color: auraColors.purple.main,
  },
  { key: 'surgery', label: 'Surgeries', icon: <HospitalIcon />, color: auraColors.red.main },
  { key: 'treatment', label: 'Treatments', icon: <FitnessIcon />, color: auraColors.green.main },
];

const getSeverityColor = (severity?: MedicalHistory['severity']) => {
  switch (severity) {
    case 'critical':
      return auraColors.red[600];
    case 'severe':
      return auraColors.red.main;
    case 'moderate':
      return auraColors.orange.main;
    case 'mild':
      return auraColors.green.main;
    default:
      return auraColors.grey[500];
  }
};

const getStatusColor = (status: MedicalHistory['status']) => {
  switch (status) {
    case 'active':
      return auraColors.green.main;
    case 'ongoing':
      return auraColors.blue.main;
    case 'resolved':
      return auraColors.grey[500];
    default:
      return auraColors.grey[500];
  }
};

// Clinical Summary Card Component
const SummaryCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
  trend?: 'up' | 'down' | 'flat';
  trendLabel?: string;
  onClick?: () => void;
}> = ({ icon, title, value, subtitle, color, trend, trendLabel, onClick }) => (
  <AuraCard
    variant="flat"
    hover={!!onClick}
    onClick={onClick}
    sx={{
      p: 2,
      cursor: onClick ? 'pointer' : 'default',
      height: '100%',
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          bgcolor: alpha(color, 0.1),
          color: color,
          display: 'flex',
          '& svg': { fontSize: 20 },
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          {title}
        </Typography>
        <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.2 }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        )}
        {trend && trendLabel && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {trend === 'up' && (
              <TrendingUpIcon sx={{ fontSize: 14, color: auraColors.green.main }} />
            )}
            {trend === 'down' && (
              <TrendingDownIcon sx={{ fontSize: 14, color: auraColors.red.main }} />
            )}
            {trend === 'flat' && (
              <TrendingFlatIcon sx={{ fontSize: 14, color: auraColors.grey[500] }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color:
                  trend === 'up'
                    ? auraColors.green.main
                    : trend === 'down'
                      ? auraColors.red.main
                      : 'text.secondary',
              }}
            >
              {trendLabel}
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  </AuraCard>
);

// Chief Complaint Section
const ChiefComplaintSection: React.FC<{ intake: IntakeDetails }> = ({ intake }) => {
  const [expanded, setExpanded] = useState(false);
  const evaluation = intake.evaluation;

  return (
    <AuraCard variant="flat" sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(auraColors.blue.main, 0.04),
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: alpha(auraColors.blue.main, 0.1),
                color: auraColors.blue.main,
                display: 'flex',
              }}
            >
              <AssignmentIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                Chief Complaint
              </Typography>
              <Typography variant="caption" color="text.secondary">
                From intake • {format(parseISO(evaluation.submittedAt), 'MMM d, yyyy')}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
      </Box>

      <Box sx={{ p: 2 }}>
        <Typography variant="body1" fontWeight={500} gutterBottom>
          {evaluation.conditionType || evaluation.description}
        </Typography>

        <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
          {evaluation.duration && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Duration
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {evaluation.duration}
              </Typography>
            </Box>
          )}
          {evaluation.painLevel > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Pain Level
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {evaluation.painLevel}/10
              </Typography>
            </Box>
          )}
          {evaluation.onset && (
            <Box>
              <Typography variant="caption" color="text.secondary">
                Onset
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {evaluation.onset}
              </Typography>
            </Box>
          )}
        </Stack>

        {evaluation.symptoms && evaluation.symptoms.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Symptoms
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {evaluation.symptoms.map((symptom, idx) => (
                <Chip
                  key={idx}
                  label={symptom}
                  size="small"
                  sx={{
                    bgcolor: alpha(auraColors.orange.main, 0.1),
                    color: auraColors.orange.main,
                    fontSize: '0.75rem',
                  }}
                />
              ))}
            </Box>
          </Box>
        )}

        <Collapse in={expanded}>
          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            {evaluation.triggers && evaluation.triggers.length > 0 && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Aggravating Factors
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {evaluation.triggers.map((trigger, idx) => (
                    <Chip
                      key={idx}
                      label={trigger}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.75rem' }}
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {evaluation.relievingFactors && evaluation.relievingFactors.length > 0 && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Relieving Factors
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {evaluation.relievingFactors.map((factor, idx) => (
                    <Chip
                      key={idx}
                      label={factor}
                      size="small"
                      variant="outlined"
                      sx={{
                        fontSize: '0.75rem',
                        borderColor: auraColors.green.main,
                        color: auraColors.green.main,
                      }}
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {evaluation.previousTreatments && (
              <Grid size={12}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Previous Treatments
                </Typography>
                <Typography variant="body2">{evaluation.previousTreatments}</Typography>
              </Grid>
            )}

            {evaluation.treatmentGoals && (
              <Grid size={12}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: 'block' }}
                >
                  Treatment Goals
                </Typography>
                <Typography variant="body2">{evaluation.treatmentGoals}</Typography>
              </Grid>
            )}
          </Grid>

          {intake.aiSummary && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: alpha(auraColors.purple.main, 0.04),
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(auraColors.purple.main, 0.2),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <PsychologyIcon sx={{ fontSize: 16, color: auraColors.purple.main }} />
                <Typography variant="caption" fontWeight={600} color={auraColors.purple.main}>
                  AI Clinical Summary
                </Typography>
              </Box>
              <Typography variant="body2">{intake.aiSummary.content}</Typography>
              {intake.aiSummary.riskFactors.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="error.main" fontWeight={500}>
                    Risk Factors:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                    {intake.aiSummary.riskFactors.map((risk, idx) => (
                      <Chip
                        key={idx}
                        label={risk}
                        size="small"
                        sx={{
                          bgcolor: alpha(auraColors.red.main, 0.1),
                          color: auraColors.red.main,
                          fontSize: '0.7rem',
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Collapse>
      </Box>
    </AuraCard>
  );
};

// Pain Assessment Section with Mini Map
const PainAssessmentSection: React.FC<{
  vitalSigns: VitalSign[];
  onAddAssessment?: () => void;
}> = ({ vitalSigns, onAddAssessment }) => {
  const latestAssessment = vitalSigns[0];
  const previousAssessment = vitalSigns[1];

  // Calculate trend
  const trend = useMemo(() => {
    if (!latestAssessment || !previousAssessment) return undefined;
    const diff = latestAssessment.overallPainLevel - previousAssessment.overallPainLevel;
    if (diff > 0) return 'up' as const;
    if (diff < 0) return 'down' as const;
    return 'flat' as const;
  }, [latestAssessment, previousAssessment]);

  // Convert pain points to PainRegion format for the 3D map
  const painRegions: PainRegion[] = useMemo(() => {
    if (!latestAssessment?.painPoints) return [];
    return latestAssessment.painPoints.map((point) => ({
      meshName: point.bodyPart,
      intensity: point.intensity,
      quality: point.quality || 'aching',
    }));
  }, [latestAssessment]);

  if (vitalSigns.length === 0) {
    return (
      <AuraCard variant="flat" sx={{ p: 3, textAlign: 'center' }}>
        <SymptomIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
        <Typography variant="body2" color="text.secondary" gutterBottom>
          No pain assessments recorded
        </Typography>
        {onAddAssessment && (
          <AuraButton
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddAssessment}
            sx={{ mt: 1 }}
          >
            Record Assessment
          </AuraButton>
        )}
      </AuraCard>
    );
  }

  return (
    <AuraCard variant="flat" sx={{ p: 0, overflow: 'hidden' }}>
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(auraColors.orange.main, 0.04),
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(auraColors.orange.main, 0.1),
              color: auraColors.orange.main,
              display: 'flex',
            }}
          >
            <SymptomIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={600}>
              Pain Assessment
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {latestAssessment && format(parseISO(latestAssessment.recordedAt), 'MMM d, yyyy')}
            </Typography>
          </Box>
        </Box>
        {onAddAssessment && (
          <AuraButton
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={onAddAssessment}
          >
            New Assessment
          </AuraButton>
        )}
      </Box>

      {latestAssessment && (
        <Grid container>
          <Grid size={{ xs: 12, md: 5 }}>
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 2 }}>
                <Typography
                  variant="h3"
                  fontWeight={700}
                  color={getSeverityColor(
                    latestAssessment.overallPainLevel >= 7
                      ? 'severe'
                      : latestAssessment.overallPainLevel >= 4
                        ? 'moderate'
                        : 'mild'
                  )}
                >
                  {latestAssessment.overallPainLevel}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  /10
                </Typography>
                {trend && (
                  <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
                    {trend === 'down' && (
                      <TrendingDownIcon sx={{ fontSize: 18, color: auraColors.green.main }} />
                    )}
                    {trend === 'up' && (
                      <TrendingUpIcon sx={{ fontSize: 18, color: auraColors.red.main }} />
                    )}
                    {trend === 'flat' && (
                      <TrendingFlatIcon sx={{ fontSize: 18, color: auraColors.grey[500] }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          trend === 'down'
                            ? auraColors.green.main
                            : trend === 'up'
                              ? auraColors.red.main
                              : 'text.secondary',
                        ml: 0.5,
                      }}
                    >
                      {trend === 'down' ? 'Improving' : trend === 'up' ? 'Worsening' : 'Stable'}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Functional Impact
                </Typography>
                <Chip
                  label={latestAssessment.functionalImpact}
                  size="small"
                  sx={{
                    ml: 1,
                    bgcolor: alpha(
                      latestAssessment.functionalImpact === 'severe'
                        ? auraColors.red.main
                        : latestAssessment.functionalImpact === 'moderate'
                          ? auraColors.orange.main
                          : auraColors.green.main,
                      0.1
                    ),
                    color:
                      latestAssessment.functionalImpact === 'severe'
                        ? auraColors.red.main
                        : latestAssessment.functionalImpact === 'moderate'
                          ? auraColors.orange.main
                          : auraColors.green.main,
                    textTransform: 'capitalize',
                  }}
                />
              </Box>

              {latestAssessment.painPoints && latestAssessment.painPoints.length > 0 && (
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Affected Areas
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {latestAssessment.painPoints.map((point, idx) => (
                      <Chip
                        key={idx}
                        label={`${point.bodyPart} (${point.intensity}/10)`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              )}

              {latestAssessment.notes && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Notes
                  </Typography>
                  <Typography variant="body2">{latestAssessment.notes}</Typography>
                </Box>
              )}

              {/* Assessment History */}
              {vitalSigns.length > 1 && (
                <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 1, display: 'block' }}
                  >
                    Recent Assessments
                  </Typography>
                  <Stack spacing={1}>
                    {vitalSigns.slice(1, 4).map((vs) => (
                      <Box key={vs.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 70 }}>
                          {format(parseISO(vs.recordedAt), 'MMM d')}
                        </Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={vs.overallPainLevel * 10}
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: 3,
                              bgcolor: alpha(auraColors.grey[500], 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: getSeverityColor(
                                  vs.overallPainLevel >= 7
                                    ? 'severe'
                                    : vs.overallPainLevel >= 4
                                      ? 'moderate'
                                      : 'mild'
                                ),
                              },
                            }}
                          />
                          <Typography variant="caption" fontWeight={500} sx={{ minWidth: 30 }}>
                            {vs.overallPainLevel}/10
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Grid>

          <Grid size={{ xs: 12, md: 7 }}>
            <Box sx={{ p: 2, height: 300 }}>
              <PainMap3D value={painRegions} onChange={() => {}} />
            </Box>
          </Grid>
        </Grid>
      )}
    </AuraCard>
  );
};

// PROM Progress Section
const PromProgressSection: React.FC<{ promResponses: PromResponse[] }> = ({ promResponses }) => {
  const completedProms = promResponses.filter((p) => p.status === 'completed');
  const latestProm = completedProms[0];
  const previousProm = completedProms[1];

  const trend = useMemo(() => {
    if (!latestProm?.score || !previousProm?.score) return undefined;
    const diff = (latestProm.score ?? 0) - (previousProm.score ?? 0);
    if (diff > 5) return 'up' as const;
    if (diff < -5) return 'down' as const;
    return 'flat' as const;
  }, [latestProm, previousProm]);

  if (completedProms.length === 0) {
    return null;
  }

  return (
    <AuraCard variant="flat" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: alpha(auraColors.green.main, 0.1),
            color: auraColors.green.main,
            display: 'flex',
          }}
        >
          <AssignmentIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            Outcome Measures (PROMs)
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {completedProms.length} completed assessments
          </Typography>
        </Box>
      </Box>

      {latestProm && (
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
            <Typography variant="h4" fontWeight={700} color="primary.main">
              {Math.round(latestProm.score ?? 0)}%
            </Typography>
            {trend && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {trend === 'up' && (
                  <TrendingUpIcon sx={{ fontSize: 18, color: auraColors.green.main }} />
                )}
                {trend === 'down' && (
                  <TrendingDownIcon sx={{ fontSize: 18, color: auraColors.red.main }} />
                )}
                {trend === 'flat' && (
                  <TrendingFlatIcon sx={{ fontSize: 18, color: auraColors.grey[500] }} />
                )}
              </Box>
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {latestProm.templateName} •{' '}
            {latestProm.completedAt && format(parseISO(latestProm.completedAt), 'MMM d, yyyy')}
          </Typography>
        </Box>
      )}

      {/* Mini chart of recent scores */}
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', height: 60 }}>
        {completedProms
          .slice(0, 6)
          .reverse()
          .map((prom) => (
            <Box
              key={prom.id}
              sx={{
                flex: 1,
                height: `${prom.score ?? 0}%`,
                minHeight: 4,
                bgcolor: alpha(auraColors.green.main, 0.3),
                borderRadius: 1,
                transition: 'height 0.3s ease',
              }}
            />
          ))}
      </Box>
    </AuraCard>
  );
};

// Appointments Section
const AppointmentsSection: React.FC<{ appointments: Appointment[] }> = ({ appointments }) => {
  const recentCompleted = appointments.filter((a) => a.status === 'completed').slice(0, 5);
  const upcoming = appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed');

  if (appointments.length === 0) {
    return null;
  }

  return (
    <AuraCard variant="flat" sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box
          sx={{
            p: 1,
            borderRadius: 2,
            bgcolor: alpha(auraColors.cyan.main, 0.1),
            color: auraColors.cyan.main,
            display: 'flex',
          }}
        >
          <CalendarIcon sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={600}>
            Appointment History
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {recentCompleted.length} completed • {upcoming.length} upcoming
          </Typography>
        </Box>
      </Box>

      {upcoming.length > 0 && upcoming[0] && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Next Appointment
          </Typography>
          <Box
            sx={{
              p: 1.5,
              bgcolor: alpha(auraColors.cyan.main, 0.04),
              borderRadius: 2,
              border: '1px solid',
              borderColor: alpha(auraColors.cyan.main, 0.2),
            }}
          >
            <Typography variant="body2" fontWeight={500}>
              {upcoming[0].appointmentType || 'Appointment'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {format(parseISO(upcoming[0].scheduledStart), 'EEEE, MMM d • h:mm a')}
            </Typography>
          </Box>
        </Box>
      )}

      <Stack spacing={1}>
        {recentCompleted.slice(0, 3).map((apt) => (
          <Box
            key={apt.id}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              py: 1,
              borderBottom: '1px solid',
              borderColor: 'divider',
              '&:last-child': { border: 'none' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 80 }}>
              <TimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
              <Typography variant="caption" color="text.secondary">
                {format(parseISO(apt.scheduledStart), 'MMM d')}
              </Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" noWrap>
                {apt.appointmentType || 'Session'}
              </Typography>
            </Box>
            <Chip
              label="Completed"
              size="small"
              sx={{
                height: 20,
                fontSize: '0.7rem',
                bgcolor: alpha(auraColors.green.main, 0.1),
                color: auraColors.green.main,
              }}
            />
          </Box>
        ))}
      </Stack>
    </AuraCard>
  );
};

// Detail Preview Panel Component
const EntryDetailPreview: React.FC<{
  item: MedicalHistory;
  onEdit?: (item: MedicalHistory) => void;
  onDelete?: (item: MedicalHistory) => void;
  onClose: () => void;
}> = ({ item, onEdit, onDelete, onClose }) => {
  const categoryConfig = CATEGORIES.find((c) => c.key === item.category);

  return (
    <AuraCard
      variant="flat"
      sx={{
        p: 0,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: alpha(categoryConfig?.color || auraColors.grey[500], 0.06),
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: alpha(categoryConfig?.color || auraColors.grey[500], 0.1),
                color: categoryConfig?.color || auraColors.grey[500],
                display: 'flex',
                '& svg': { fontSize: 24 },
              }}
            >
              {categoryConfig?.icon}
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}
              >
                {categoryConfig?.label || item.category}
              </Typography>
              <Typography variant="h6" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                {item.title}
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={onClose} sx={{ mt: -0.5, mr: -0.5 }}>
            <ExpandLessIcon />
          </IconButton>
        </Box>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2, flex: 1, overflow: 'auto' }}>
        {/* Status & Severity Row */}
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip
            label={item.status}
            size="small"
            sx={{
              bgcolor: alpha(getStatusColor(item.status), 0.1),
              color: getStatusColor(item.status),
              fontWeight: 500,
            }}
          />
          {item.severity && (
            <Chip
              label={item.severity}
              size="small"
              sx={{
                bgcolor: alpha(getSeverityColor(item.severity), 0.1),
                color: getSeverityColor(item.severity),
                fontWeight: 500,
              }}
            />
          )}
        </Box>

        {/* Date */}
        {item.date && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Date Recorded
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" fontWeight={500}>
                {format(parseISO(item.date), 'EEEE, MMMM d, yyyy')}
              </Typography>
            </Box>
          </Box>
        )}

        {/* Description */}
        {item.description && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Description
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
              {item.description}
            </Typography>
          </Box>
        )}

        {/* Notes */}
        {item.notes && (
          <Box
            sx={{
              p: 2,
              bgcolor: alpha(auraColors.grey[500], 0.04),
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Clinical Notes
            </Typography>
            <Typography variant="body2" sx={{ lineHeight: 1.6, fontStyle: 'italic' }}>
              {item.notes}
            </Typography>
          </Box>
        )}

        {/* Empty state if no description or notes */}
        {!item.description && !item.notes && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              No additional details recorded
            </Typography>
          </Box>
        )}
      </Box>

      {/* Actions Footer */}
      {(onEdit || onDelete) && (
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            gap: 1,
          }}
        >
          {onEdit && (
            <AuraButton
              variant="outlined"
              size="small"
              startIcon={<EditIcon />}
              onClick={() => onEdit(item)}
              sx={{ flex: 1 }}
            >
              Edit
            </AuraButton>
          )}
          {onDelete && (
            <AuraButton
              variant="outlined"
              size="small"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => onDelete(item)}
              sx={{ flex: 1 }}
            >
              Delete
            </AuraButton>
          )}
        </Box>
      )}
    </AuraCard>
  );
};

// Conditions/History Entry List with Detail Preview
const ConditionsEntryList: React.FC<{
  entries: MedicalHistory[];
  onEdit?: (item: MedicalHistory) => void;
  onDelete?: (item: MedicalHistory) => void;
}> = ({ entries, onEdit, onDelete }) => {
  const [selectedItem, setSelectedItem] = useState<MedicalHistory | null>(null);

  if (entries.length === 0) {
    return (
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No entries in this category
        </Typography>
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Entry List */}
      <Grid size={{ xs: 12, lg: selectedItem ? 7 : 12 }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {entries.map((item, index) => {
            const categoryConfig = CATEGORIES.find((c) => c.key === item.category);
            const isSelected = selectedItem?.id === item.id;

            return (
              <Box
                key={item.id}
                onClick={() => setSelectedItem(isSelected ? null : item)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderBottom: index < entries.length - 1 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: isSelected ? alpha(auraColors.blue.main, 0.04) : 'transparent',
                  borderLeft: isSelected
                    ? `3px solid ${auraColors.blue.main}`
                    : '3px solid transparent',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: isSelected ? alpha(auraColors.blue.main, 0.06) : 'action.hover',
                  },
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Box
                    sx={{
                      p: 1,
                      borderRadius: 2,
                      bgcolor: alpha(categoryConfig?.color || auraColors.grey[500], 0.1),
                      color: categoryConfig?.color || auraColors.grey[500],
                      display: 'flex',
                      '& svg': { fontSize: 18 },
                    }}
                  >
                    {categoryConfig?.icon}
                  </Box>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {item.title}
                      </Typography>
                      <Chip
                        label={item.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: alpha(getStatusColor(item.status), 0.1),
                          color: getStatusColor(item.status),
                        }}
                      />
                      {item.severity && (
                        <Chip
                          label={item.severity}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            bgcolor: alpha(getSeverityColor(item.severity), 0.1),
                            color: getSeverityColor(item.severity),
                          }}
                        />
                      )}
                    </Box>

                    {item.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    {item.date && (
                      <Typography variant="caption" color="text.secondary">
                        {format(parseISO(item.date), 'MMM d, yyyy')}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Grid>

      {/* Detail Preview Panel */}
      {selectedItem && (
        <Grid size={{ xs: 12, lg: 5 }}>
          <Box sx={{ position: 'sticky', top: 16 }}>
            <EntryDetailPreview
              item={selectedItem}
              onEdit={onEdit}
              onDelete={onDelete}
              onClose={() => setSelectedItem(null)}
            />
          </Box>
        </Grid>
      )}
    </Grid>
  );
};

// Main Component
export const MedicalHistoryTab: React.FC<MedicalHistoryTabProps> = ({
  medicalHistory,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  intakeData,
  promResponses = [],
  appointments = [],
  vitalSigns = [],
  onAddAssessment,
}) => {
  const [selectedTab, setSelectedTab] = useState(0);

  // Filter entries by relevant categories
  const conditions = useMemo(
    () => medicalHistory.filter((h) => ['injury', 'symptom', 'condition'].includes(h.category)),
    [medicalHistory]
  );

  const allergiesAndMeds = useMemo(
    () => medicalHistory.filter((h) => ['allergy', 'medication'].includes(h.category)),
    [medicalHistory]
  );

  const treatmentsAndSurgeries = useMemo(
    () => medicalHistory.filter((h) => ['treatment', 'surgery'].includes(h.category)),
    [medicalHistory]
  );

  const goals = useMemo(
    () => medicalHistory.filter((h) => h.category === 'goal'),
    [medicalHistory]
  );

  // Summary stats
  const activeConditions = conditions.filter((c) => c.status === 'active').length;
  const activeAllergies = allergiesAndMeds.filter(
    (a) => a.category === 'allergy' && a.status === 'active'
  ).length;
  const activeMeds = allergiesAndMeds.filter(
    (m) => m.category === 'medication' && m.status === 'active'
  ).length;
  const completedSessions = appointments.filter((a) => a.status === 'completed').length;
  const latestPainLevel = vitalSigns[0]?.overallPainLevel;
  const latestPromScore = promResponses.find((p) => p.status === 'completed')?.score;

  // Calculate trends
  const painTrend = useMemo(() => {
    if (vitalSigns.length < 2) return undefined;
    const diff = (vitalSigns[0]?.overallPainLevel ?? 0) - (vitalSigns[1]?.overallPainLevel ?? 0);
    if (diff < 0) return { direction: 'down' as const, label: 'Improving' };
    if (diff > 0) return { direction: 'up' as const, label: 'Worsening' };
    return { direction: 'flat' as const, label: 'Stable' };
  }, [vitalSigns]);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Clinical Summary
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Comprehensive health overview from all clinical touchpoints
          </Typography>
        </Box>
        <AuraButton variant="contained" startIcon={<AddIcon />} onClick={onAddEntry}>
          Add Entry
        </AuraButton>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <SummaryCard
            icon={<HospitalIcon />}
            title="Active Conditions"
            value={activeConditions}
            subtitle={`${conditions.length} total`}
            color={auraColors.blue.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <SummaryCard
            icon={<SymptomIcon />}
            title="Pain Level"
            value={latestPainLevel !== undefined ? `${latestPainLevel}/10` : 'N/A'}
            color={auraColors.orange.main}
            trend={painTrend?.direction}
            trendLabel={painTrend?.label}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <SummaryCard
            icon={<WarningIcon />}
            title="Allergies"
            value={activeAllergies}
            color={auraColors.red.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <SummaryCard
            icon={<MedicationIcon />}
            title="Medications"
            value={activeMeds}
            subtitle="Active"
            color={auraColors.purple.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <SummaryCard
            icon={<AssignmentIcon />}
            title="PROM Score"
            value={latestPromScore !== undefined ? `${Math.round(latestPromScore)}%` : 'N/A'}
            color={auraColors.green.main}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 4, md: 2 }}>
          <SummaryCard
            icon={<CalendarIcon />}
            title="Sessions"
            value={completedSessions}
            subtitle="Completed"
            color={auraColors.cyan.main}
          />
        </Grid>
      </Grid>

      {/* Tab Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={(_, v) => setSelectedTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Overview" />
          <Tab label="Conditions" />
          <Tab label="Medications & Allergies" />
          <Tab label="Treatment History" />
          <Tab label="Goals" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {selectedTab === 0 && (
        <Grid container spacing={3}>
          {/* Left Column - Chief Complaint & Pain */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              {intakeData && <ChiefComplaintSection intake={intakeData} />}
              <PainAssessmentSection vitalSigns={vitalSigns} onAddAssessment={onAddAssessment} />
            </Stack>
          </Grid>

          {/* Right Column - PROMs & Appointments */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              {promResponses.length > 0 && <PromProgressSection promResponses={promResponses} />}
              {appointments.length > 0 && <AppointmentsSection appointments={appointments} />}

              {/* Quick Allergies Alert */}
              {activeAllergies > 0 && (
                <AuraCard
                  variant="flat"
                  sx={{
                    p: 2,
                    bgcolor: alpha(auraColors.red.main, 0.04),
                    border: '1px solid',
                    borderColor: alpha(auraColors.red.main, 0.2),
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <WarningIcon sx={{ fontSize: 18, color: auraColors.red.main }} />
                    <Typography variant="subtitle2" fontWeight={600} color="error.main">
                      Allergies ({activeAllergies})
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {allergiesAndMeds
                      .filter((a) => a.category === 'allergy')
                      .map((allergy) => (
                        <Chip
                          key={allergy.id}
                          label={allergy.title}
                          size="small"
                          sx={{
                            bgcolor: alpha(auraColors.red.main, 0.1),
                            color: auraColors.red.main,
                            fontSize: '0.75rem',
                          }}
                        />
                      ))}
                  </Box>
                </AuraCard>
              )}
            </Stack>
          </Grid>
        </Grid>
      )}

      {selectedTab === 1 && (
        <ConditionsEntryList entries={conditions} onEdit={onEditEntry} onDelete={onDeleteEntry} />
      )}

      {selectedTab === 2 && (
        <ConditionsEntryList
          entries={allergiesAndMeds}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
        />
      )}

      {selectedTab === 3 && (
        <ConditionsEntryList
          entries={treatmentsAndSurgeries}
          onEdit={onEditEntry}
          onDelete={onDeleteEntry}
        />
      )}

      {selectedTab === 4 && (
        <ConditionsEntryList entries={goals} onEdit={onEditEntry} onDelete={onDeleteEntry} />
      )}

      {/* Empty state for overview if no data */}
      {selectedTab === 0 &&
        !intakeData &&
        vitalSigns.length === 0 &&
        promResponses.length === 0 &&
        appointments.length === 0 && (
          <AuraEmptyState
            title="No clinical data yet"
            description="Clinical data will appear here as intake forms are submitted, assessments are recorded, and appointments are completed."
          />
        )}
    </Box>
  );
};

export default MedicalHistoryTab;
