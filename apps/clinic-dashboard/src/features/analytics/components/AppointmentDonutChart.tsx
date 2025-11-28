import React from 'react';
import { Box, Typography, Stack, Paper, alpha, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { auraColors, glassTokens } from '@qivr/design-system';

interface AppointmentData {
  completed: number;
  cancelled: number;
  noShow: number;
  pending: number;
}

interface AppointmentDonutChartProps {
  title?: string;
  data: AppointmentData;
  showLegend?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const COLORS = {
  completed: auraColors.green.main,
  cancelled: auraColors.red.main,
  noShow: auraColors.orange.main,
  pending: auraColors.blue.main,
};

const LABELS = {
  completed: 'Completed',
  cancelled: 'Cancelled',
  noShow: 'No Show',
  pending: 'Pending',
};

const AppointmentDonutChart: React.FC<AppointmentDonutChartProps> = ({
  title = 'Appointment Status',
  data,
  showLegend = true,
  size = 'medium',
}) => {
  const theme = useTheme();

  const chartData = [
    { name: 'Completed', value: data.completed, color: COLORS.completed },
    { name: 'Cancelled', value: data.cancelled, color: COLORS.cancelled },
    { name: 'No Show', value: data.noShow, color: COLORS.noShow },
    { name: 'Pending', value: data.pending, color: COLORS.pending },
  ].filter((item) => item.value > 0);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  const completionRate = total > 0 ? Math.round((data.completed / total) * 100) : 0;

  const sizeConfig = {
    small: { outer: 60, inner: 40, height: 150 },
    medium: { outer: 80, inner: 55, height: 200 },
    large: { outer: 100, inner: 70, height: 250 },
  };

  const { outer, inner, height } = sizeConfig[size];

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: 3,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
      }}
    >
      <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
        {title}
      </Typography>

      <Box sx={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={inner}
              outerRadius={outer}
              paddingAngle={2}
              dataKey="value"
              animationDuration={500}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 12,
                boxShadow: glassTokens.shadow.standard,
              }}
              formatter={(value: number) => [
                `${value} (${Math.round((value / total) * 100)}%)`,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label */}
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" fontWeight={700} color="text.primary">
            {completionRate}%
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Complete
          </Typography>
        </Box>
      </Box>

      {/* Legend */}
      {showLegend && (
        <Stack
          direction="row"
          flexWrap="wrap"
          justifyContent="center"
          gap={2}
          sx={{ mt: 2 }}
        >
          {chartData.map((item) => (
            <Stack
              key={item.name}
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: item.color,
                }}
              />
              <Typography variant="caption" color="text.secondary">
                {item.name}: {item.value}
              </Typography>
            </Stack>
          ))}
        </Stack>
      )}
    </Paper>
  );
};

export default AppointmentDonutChart;
