import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Warning as WarningIcon,
  Person as PersonIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import {
  glassTokens,
  auraColors,
  AuraButton,
  AuraChartCard,
  PainMapProgression,
  AuraEmptyState,
} from '@qivr/design-system';
import type { VitalSign } from '../types';

interface PainAssessmentTabProps {
  vitalSigns: VitalSign[];
  painProgression: any[] | null;
  onAddAssessment: () => void;
}

const StatBox: React.FC<{
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; isPositive: boolean };
}> = ({ title, value, icon, color, trend }) => (
  <Box
    sx={{
      p: 2.5,
      bgcolor: 'background.paper',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 3,
      boxShadow: glassTokens.shadow.subtle,
      height: '100%',
    }}
  >
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
      <Box
        sx={{
          p: 1,
          borderRadius: 2,
          bgcolor: alpha(color, 0.1),
          color: color,
          display: 'flex',
          '& svg': { fontSize: 22 },
        }}
      >
        {icon}
      </Box>
      {trend && (
        <Chip
          icon={trend.isPositive ? <TrendingDownIcon /> : <TrendingUpIcon />}
          label={`${Math.abs(trend.value)}%`}
          size="small"
          sx={{
            bgcolor: alpha(trend.isPositive ? auraColors.green.main : auraColors.red.main, 0.1),
            color: trend.isPositive ? auraColors.green.main : auraColors.red.main,
            '& .MuiChip-icon': { color: 'inherit' },
          }}
        />
      )}
    </Box>
    <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
      {value}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {title}
    </Typography>
  </Box>
);

const AssessmentCard: React.FC<{ assessment: VitalSign }> = ({ assessment }) => {
  const painLevel = assessment.overallPainLevel || 0;
  const painColor =
    painLevel > 6 ? auraColors.red.main : painLevel > 3 ? auraColors.orange.main : auraColors.green.main;

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            {format(parseISO(assessment.recordedAt), 'MMM d, yyyy')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(parseISO(assessment.recordedAt), 'h:mm a')}
          </Typography>
        </Box>
        <Chip
          label={`${painLevel}/10`}
          sx={{
            bgcolor: alpha(painColor, 0.1),
            color: painColor,
            fontWeight: 600,
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Functional Impact
          </Typography>
          <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
            {assessment.functionalImpact || 'None'}
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Pain Points
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {assessment.painPoints?.length || 0} areas
          </Typography>
        </Box>
      </Box>

      {assessment.painPoints && assessment.painPoints.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {assessment.painPoints.slice(0, 4).map((p, i) => (
            <Chip
              key={i}
              label={`${p.bodyPart}${p.side ? ` (${p.side})` : ''}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          ))}
          {assessment.painPoints.length > 4 && (
            <Chip label={`+${assessment.painPoints.length - 4}`} size="small" variant="outlined" />
          )}
        </Box>
      )}

      {assessment.notes && (
        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          {assessment.notes}
        </Typography>
      )}
    </Box>
  );
};

export const PainAssessmentTab: React.FC<PainAssessmentTabProps> = ({
  vitalSigns,
  painProgression,
  onAddAssessment,
}) => {
  const latestAssessment = vitalSigns[0];
  const previousAssessment = vitalSigns[1];

  const getTrend = () => {
    if (!latestAssessment || !previousAssessment) return undefined;
    const current = latestAssessment.overallPainLevel || 0;
    const previous = previousAssessment.overallPainLevel || 0;
    if (previous === 0) return undefined;
    const change = Math.round(((current - previous) / previous) * 100);
    return { value: Math.abs(change), isPositive: change < 0 };
  };

  const chartData = vitalSigns
    .slice()
    .reverse()
    .map((v) => ({
      date: format(parseISO(v.recordedAt), 'MMM d'),
      value: v.overallPainLevel || 0,
    }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Pain Assessment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track and monitor pain levels over time
          </Typography>
        </Box>
        <AuraButton variant="contained" startIcon={<AddIcon />} onClick={onAddAssessment}>
          Record Assessment
        </AuraButton>
      </Box>

      {vitalSigns.length === 0 ? (
        <AuraEmptyState
          title="No pain assessments yet"
          description="Record the first pain assessment to start tracking progress"
        />
      ) : (
        <>
          {/* Quick Stats */}
          <Grid container spacing={2.5} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatBox
                title="Current Pain Level"
                value={`${latestAssessment?.overallPainLevel || 0}/10`}
                icon={<WarningIcon />}
                color={
                  (latestAssessment?.overallPainLevel || 0) > 6
                    ? auraColors.red.main
                    : (latestAssessment?.overallPainLevel || 0) > 3
                      ? auraColors.orange.main
                      : auraColors.green.main
                }
                trend={getTrend()}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatBox
                title="Functional Impact"
                value={latestAssessment?.functionalImpact || 'None'}
                icon={<PersonIcon />}
                color={auraColors.blue.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatBox
                title="Affected Areas"
                value={latestAssessment?.painPoints?.length || 0}
                icon={<PersonIcon />}
                color={auraColors.purple.main}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatBox
                title="Total Assessments"
                value={vitalSigns.length}
                icon={<PersonIcon />}
                color={auraColors.cyan.main}
              />
            </Grid>
          </Grid>

          {/* Pain Trend Chart */}
          {chartData.length > 1 && (
            <Box sx={{ mb: 3 }}>
              <AuraChartCard title="Pain Level Trend" subtitle="Track pain levels over time">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--qivr-palette-divider)" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis domain={[0, 10]} fontSize={12} />
                    <ChartTooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid var(--qivr-palette-divider)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke={auraColors.red.main}
                      strokeWidth={2}
                      dot={{ fill: auraColors.red.main, strokeWidth: 0, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </AuraChartCard>
            </Box>
          )}

          {/* Pain Progression */}
          {painProgression && painProgression.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Pain Drawing Progression
              </Typography>
              <PainMapProgression data={painProgression} />
            </Box>
          )}

          {/* Recent Assessments */}
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Recent Assessments
            </Typography>
            <Grid container spacing={2}>
              {vitalSigns.slice(0, 6).map((assessment) => (
                <Grid key={assessment.id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <AssessmentCard assessment={assessment} />
                </Grid>
              ))}
            </Grid>
          </Box>
        </>
      )}
    </Box>
  );
};

export default PainAssessmentTab;
