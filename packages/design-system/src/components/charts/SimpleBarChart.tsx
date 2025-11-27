import { Box, useTheme } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from './types';

export interface SimpleBarChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export const SimpleBarChart = ({
  data,
  height = 200,
  color,
  showGrid = true,
}: SimpleBarChartProps) => {
  const theme = useTheme();
  const barColor = color || theme.palette.primary.main;

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />}
          <XAxis dataKey="name" stroke={theme.palette.text.secondary} />
          <YAxis stroke={theme.palette.text.secondary} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
            }}
          />
          <Bar dataKey="value" fill={barColor} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};
