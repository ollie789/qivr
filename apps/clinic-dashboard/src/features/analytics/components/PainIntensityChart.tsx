import React from 'react';
import { Box, Typography, Paper, Stack, alpha, useTheme } from '@mui/material';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { auraColors, glassTokens, auraTokens } from '@qivr/design-system';

interface IntensityData {
  range: string;
  count: number;
  intensity?: number; // 0-10 scale, if available
}

interface PainIntensityChartProps {
  title?: string;
  subtitle?: string;
  data: IntensityData[];
  averageIntensity?: number;
  variant?: 'bar' | 'gradient';
}

const getIntensityColor = (intensity: number): string => {
  if (intensity >= 8) return auraColors.red[600];
  if (intensity >= 6) return auraColors.red.main;
  if (intensity >= 4) return auraColors.orange.main;
  if (intensity >= 2) return auraColors.amber.main;
  return auraColors.green.main;
};

// Generate colors for 0-10 scale bars
const INTENSITY_COLORS = [
  auraColors.green[400],   // 0-1: None/Minimal
  auraColors.green.main,   // 1-2: Mild
  auraColors.green[600],   // 2-3: Mild
  auraColors.amber[400],   // 3-4: Moderate
  auraColors.amber.main,   // 4-5: Moderate
  auraColors.orange[400],  // 5-6: Moderate-Severe
  auraColors.orange.main,  // 6-7: Severe
  auraColors.red[400],     // 7-8: Severe
  auraColors.red.main,     // 8-9: Very Severe
  auraColors.red[700],     // 9-10: Extreme
];

const PainIntensityChart: React.FC<PainIntensityChartProps> = ({
  title = 'Pain Intensity Distribution',
  subtitle,
  data,
  averageIntensity,
  variant = 'bar',
}) => {
  const theme = useTheme();

  // If data uses ranges like "0-1", "1-2", etc., parse for coloring
  const chartData = data.map((item, index) => {
    // Try to extract intensity from range string (e.g., "7-8" -> 7.5)
    const rangeMatch = item.range.match(/(\d+)-(\d+)/);
    const intensity = rangeMatch
      ? (parseInt(rangeMatch[1] || '0') + parseInt(rangeMatch[2] || '0')) / 2
      : item.intensity ?? index;

    return {
      ...item,
      color: INTENSITY_COLORS[Math.min(Math.floor(intensity), 9)],
    };
  });

  const maxCount = Math.max(...chartData.map((d) => d.count), 1);
  const total = chartData.reduce((sum, d) => sum + d.count, 0);

  if (variant === 'gradient') {
    // Gradient bar visualization
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
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {averageIntensity !== undefined && (
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: alpha(getIntensityColor(averageIntensity), 0.1),
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="h5" fontWeight={700} sx={{ color: getIntensityColor(averageIntensity) }}>
                {averageIntensity.toFixed(1)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Average
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Gradient bar distribution */}
        <Box sx={{ display: 'flex', alignItems: 'flex-end', height: auraTokens.responsiveChart.compact, gap: 0.5 }}>
          {chartData.map((item) => {
            const height = (item.count / maxCount) * 150;
            return (
              <Box
                key={item.range}
                sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                }}
              >
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                  {item.count}
                </Typography>
                <Box
                  sx={{
                    width: '100%',
                    height: Math.max(height, 4),
                    bgcolor: item.color,
                    borderRadius: `${auraTokens.borderRadius.sm}px ${auraTokens.borderRadius.sm}px 0 0`,
                    transition: 'height 0.3s ease',
                  }}
                />
              </Box>
            );
          })}
        </Box>

        {/* X-axis labels */}
        <Box sx={{ display: 'flex', mt: 1 }}>
          {chartData.map((item) => (
            <Box key={item.range} sx={{ flex: 1, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
                {item.range}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Scale indicator */}
        <Box
          sx={{
            mt: 3,
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(90deg, ${auraColors.green.main} 0%, ${auraColors.amber.main} 40%, ${auraColors.orange.main} 60%, ${auraColors.red.main} 100%)`,
          }}
        />
        <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            No Pain
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Severe
          </Typography>
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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {averageIntensity !== undefined && (
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: alpha(getIntensityColor(averageIntensity), 0.1),
              borderRadius: 2,
              textAlign: 'center',
            }}
          >
            <Typography variant="h5" fontWeight={700} sx={{ color: getIntensityColor(averageIntensity) }}>
              {averageIntensity.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Avg
            </Typography>
          </Box>
        )}
      </Stack>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis
            dataKey="range"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 12,
              boxShadow: glassTokens.shadow.standard,
            }}
            formatter={(value: number) => [
              `${value} patients (${Math.round((value / total) * 100)}%)`,
              'Count',
            ]}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} animationDuration={500}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};

export default PainIntensityChart;
