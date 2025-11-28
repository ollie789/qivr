import React, { useId, useState } from 'react';
import { Box, Typography, ButtonBase, Stack } from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppointmentTrendDatum } from '../types';
import { AuraChartCard, auraTokens } from '@qivr/design-system';

export interface AppointmentTrendCardProps {
  title?: string;
  data: AppointmentTrendDatum[];
  height?: number;
  headerAction?: React.ReactNode;
  showLegend?: boolean;
  emptyMessage?: string;
}

// Interactive legend button component
const LegendButton: React.FC<{
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, color, active, onClick }) => (
  <ButtonBase
    disableRipple
    onClick={onClick}
    sx={{
      display: 'flex',
      alignItems: 'center',
      gap: auraTokens.spacing.sm,
      px: 1.5,
      py: 0.5,
      borderRadius: auraTokens.borderRadius.sm,
      opacity: active ? 1 : 0.4,
      transition: auraTokens.transitions.default,
      '&:hover': {
        bgcolor: 'action.hover',
      },
    }}
  >
    <Box
      sx={{
        width: 16,
        height: 4,
        bgcolor: color,
        borderRadius: auraTokens.borderRadius.sm,
        flexShrink: 0,
      }}
    />
    <Typography variant="caption" fontWeight={auraTokens.fontWeights.semibold} color="text.secondary">
      {label}
    </Typography>
  </ButtonBase>
);

const AppointmentTrendCard: React.FC<AppointmentTrendCardProps> = ({
  title = 'Patient Appointments Trend',
  data,
  height = 300,
  headerAction,
  showLegend = true,
  emptyMessage = 'No appointment data available',
}) => {
  const gradientId = useId();
  const appointmentsGradientId = `appointments-${gradientId}`;
  const completedGradientId = `completed-${gradientId}`;

  // Legend toggle state
  const [showAppointments, setShowAppointments] = useState(true);
  const [showCompleted, setShowCompleted] = useState(true);

  const chartData = data.length > 0
    ? data
    : [{ name: 'No Data', appointments: 0, completed: 0 }];

  return (
    <AuraChartCard title={title} action={headerAction}>
      <Box sx={{ px: 3, pb: 3 }}>
        {/* Interactive Legend */}
        {showLegend && (
          <Stack direction="row" spacing={1} sx={{ mb: 2, justifyContent: 'flex-end' }}>
            <LegendButton
              label="Appointments"
              color="var(--qivr-palette-primary-main, #3391FF)"
              active={showAppointments}
              onClick={() => setShowAppointments(!showAppointments)}
            />
            <LegendButton
              label="Completed"
              color="var(--qivr-palette-success-main, #19CC9B)"
              active={showCompleted}
              onClick={() => setShowCompleted(!showCompleted)}
            />
          </Stack>
        )}

        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id={appointmentsGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--qivr-palette-primary-main)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--qivr-palette-primary-main)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={completedGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--qivr-palette-success-main)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--qivr-palette-success-main)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--qivr-palette-text-secondary)' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--qivr-palette-text-secondary)' }}
            />
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="var(--qivr-palette-divider, #E2E8F0)"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--qivr-palette-background-paper)',
                border: '1px solid var(--qivr-palette-divider)',
                borderRadius: 12, // auraTokens.borderRadius.md * 8
                boxShadow: auraTokens.shadows.md,
              }}
            />
            {showAppointments && (
              <Area
                type="monotone"
                dataKey="appointments"
                stroke="var(--qivr-palette-primary-main)"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${appointmentsGradientId})`}
                animationDuration={500}
              />
            )}
            {showCompleted && (
              <Area
                type="monotone"
                dataKey="completed"
                stroke="var(--qivr-palette-success-main)"
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${completedGradientId})`}
                animationDuration={500}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
        {data.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, textAlign: 'center' }}>
            {emptyMessage}
          </Typography>
        )}
      </Box>
    </AuraChartCard>
  );
};

export default AppointmentTrendCard;
