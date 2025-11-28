import React from 'react';
import { Box, Typography, Stack, Paper, Chip, alpha, useTheme } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { auraColors, glassTokens } from '@qivr/design-system';

interface PainTypeData {
  type: string;
  count: number;
}

interface PainTypeChartProps {
  title?: string;
  subtitle?: string;
  data: PainTypeData[];
  variant?: 'pie' | 'donut' | 'chips';
}

const PAIN_TYPE_COLORS: Record<string, string> = {
  Aching: auraColors.blue.main,
  Sharp: auraColors.red.main,
  Burning: auraColors.orange.main,
  Throbbing: auraColors.purple.main,
  Stabbing: auraColors.red[600],
  Dull: auraColors.grey[500],
  Tingling: auraColors.cyan.main,
  Numbness: auraColors.grey[400],
  Cramping: auraColors.amber.main,
  Shooting: auraColors.red[400],
  Other: auraColors.grey[600],
};

const getColorForType = (type: string): string => {
  return PAIN_TYPE_COLORS[type] || auraColors.blue.main;
};

const PainTypeChart: React.FC<PainTypeChartProps> = ({
  title = 'Pain Type Distribution',
  subtitle,
  data,
  variant = 'donut',
}) => {
  const theme = useTheme();

  const sortedData = [...data].sort((a, b) => b.count - a.count);
  const total = sortedData.reduce((sum, item) => sum + item.count, 0);
  const chartData = sortedData.map((item) => ({
    ...item,
    color: getColorForType(item.type),
    percentage: total > 0 ? Math.round((item.count / total) * 100) : 0,
  }));

  if (variant === 'chips') {
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
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <Stack direction="row" flexWrap="wrap" gap={1}>
          {chartData.map((item) => (
            <Chip
              key={item.type}
              label={
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <span>{item.type}</span>
                  <Typography
                    component="span"
                    variant="caption"
                    sx={{ opacity: 0.7 }}
                  >
                    ({item.count})
                  </Typography>
                </Stack>
              }
              sx={{
                bgcolor: alpha(item.color, 0.1),
                color: item.color,
                fontWeight: 500,
                '&:hover': {
                  bgcolor: alpha(item.color, 0.2),
                },
              }}
            />
          ))}
        </Stack>
      </Paper>
    );
  }

  const isDonut = variant === 'donut';

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
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" fontWeight={600}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>

      <Box sx={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={isDonut ? 50 : 0}
              outerRadius={80}
              paddingAngle={isDonut ? 2 : 0}
              dataKey="count"
              nameKey="type"
              animationDuration={500}
              label={({ type, percentage }) => `${type} ${percentage}%`}
              labelLine={false}
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
              formatter={(value: number, name: string) => [
                `${value} cases (${Math.round((value / total) * 100)}%)`,
                name,
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center label for donut */}
        {isDonut && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" fontWeight={700}>
              {total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total
            </Typography>
          </Box>
        )}
      </Box>

      {/* Legend */}
      <Stack direction="row" flexWrap="wrap" justifyContent="center" gap={2} sx={{ mt: 2 }}>
        {chartData.slice(0, 6).map((item) => (
          <Stack key={item.type} direction="row" alignItems="center" spacing={0.5}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: item.color,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {item.type}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};

export default PainTypeChart;
