import React from 'react';
import { Box, Typography } from '@mui/material';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { PromCompletionDatum } from '../types';
import { AuraChartCard } from '@qivr/design-system';

export interface PromCompletionCardProps {
  title?: string;
  data: PromCompletionDatum[];
  height?: number;
  emptyMessage?: string;
  summaryFormatter?: (average: number, context: { isEmpty: boolean }) => React.ReactNode;
}

const getSegmentColor = (value: number) => {
  if (value >= 85) return 'var(--qivr-palette-success-main)';
  if (value >= 60) return 'var(--qivr-palette-warning-main)';
  return 'var(--qivr-palette-error-main)';
};

const PromCompletionCard: React.FC<PromCompletionCardProps> = ({
  title = 'PROM Response Rate',
  data,
  height = 300,
  emptyMessage = 'No PROM data available',
  summaryFormatter,
}) => {
  const isEmpty = data.length === 0;
  const chartData = isEmpty
    ? [{ name: 'No Data', value: 100, color: 'var(--qivr-palette-neutral-200, #e5e7eb)' }]
    : data.map((item) => ({
        name: item.name,
        value: item.completed,
        color: getSegmentColor(item.completed),
      }));

  const average = isEmpty
    ? 0
    : Math.round(
        data.reduce((sum, item) => sum + item.completed, 0) / data.length
      );

  const summaryContent =
    summaryFormatter?.(average, { isEmpty }) ??
    (isEmpty ? emptyMessage : `Average completion rate: ${average}%`);

  return (
    <AuraChartCard title={title}>
      <Box sx={{ px: 3, pb: 3 }}>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) =>
                entry.name !== 'No Data' ? `${entry.name}: ${entry.value}%` : ''
              }
              outerRadius={80}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`prom-cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {summaryContent}
          </Typography>
        </Box>
      </Box>
    </AuraChartCard>
  );
};

export default PromCompletionCard;
