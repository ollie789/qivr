import { Box, useTheme } from '@mui/material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { ChartDataPoint } from './types';

export interface SimpleLineChartProps {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  showGrid?: boolean;
}

export const SimpleLineChart = ({
  data,
  height = 200,
  color,
  showGrid = true,
}: SimpleLineChartProps) => {
  const theme = useTheme();
  const lineColor = color || theme.palette.primary.main;

  return (
    <Box sx={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data}>
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
          <Line type="monotone" dataKey="value" stroke={lineColor} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};
