import React from 'react';
import { Box, Typography, Stack, Paper, LinearProgress, alpha, useTheme } from '@mui/material';
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { auraTokens, auraColors, glassTokens } from '@qivr/design-system';

interface BodyRegionData {
  region: string;
  count: number;
  avgIntensity: number;
}

interface BodyRegionChartProps {
  title?: string;
  subtitle?: string;
  data: BodyRegionData[];
  variant?: 'bar' | 'progress';
  height?: number;
}

const getIntensityColor = (intensity: number): string => {
  if (intensity >= 7) return auraColors.red.main;
  if (intensity >= 5) return auraColors.orange.main;
  if (intensity >= 3) return auraColors.amber.main;
  return auraColors.green.main;
};

const BodyRegionChart: React.FC<BodyRegionChartProps> = ({
  title = 'Pain by Body Region',
  subtitle,
  data,
  variant = 'bar',
  height = 300,
}) => {
  const theme = useTheme();

  const sortedData = [...data].sort((a, b) => b.count - a.count).slice(0, 8);
  const maxCount = Math.max(...sortedData.map((d) => d.count), 1);
  const totalCount = sortedData.reduce((sum, d) => sum + d.count, 0);

  if (variant === 'progress') {
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
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>

        <Stack spacing={2}>
          {sortedData.map((item, index) => {
            const percentage = Math.round((item.count / totalCount) * 100);
            const intensityColor = getIntensityColor(item.avgIntensity);

            return (
              <Box key={item.region}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {item.region}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {item.count} cases
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: alpha(intensityColor, 0.1),
                        borderRadius: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        sx={{ color: intensityColor }}
                      >
                        {item.avgIntensity.toFixed(1)}/10
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(intensityColor, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: intensityColor,
                      borderRadius: 4,
                    },
                  }}
                />
              </Box>
            );
          })}
        </Stack>
      </Paper>
    );
  }

  // Bar chart variant
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

      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={sortedData}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 80, bottom: 0 }}
        >
          <XAxis type="number" axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="region"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            width={75}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 12,
              boxShadow: glassTokens.shadow.standard,
            }}
            formatter={(value: number, name: string, props: any) => [
              <>
                <span>{value} cases</span>
                <br />
                <span style={{ color: getIntensityColor(props.payload.avgIntensity) }}>
                  Avg intensity: {props.payload.avgIntensity.toFixed(1)}/10
                </span>
              </>,
              '',
            ]}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} animationDuration={500}>
            {sortedData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getIntensityColor(entry.avgIntensity)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default BodyRegionChart;
