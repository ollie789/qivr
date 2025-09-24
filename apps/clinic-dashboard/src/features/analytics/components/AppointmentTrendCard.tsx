import React, { useId } from 'react';
import { Box, Card, CardContent, Typography } from '@mui/material';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { AppointmentTrendDatum } from '../types';

export interface AppointmentTrendCardProps {
  title?: string;
  data: AppointmentTrendDatum[];
  height?: number;
  headerAction?: React.ReactNode;
  showLegend?: boolean;
  emptyMessage?: string;
}

const AppointmentTrendCard: React.FC<AppointmentTrendCardProps> = ({
  title = 'Patient Appointments Trend',
  data,
  height = 300,
  headerAction,
  showLegend = false,
  emptyMessage = 'No appointment data available',
}) => {
  const gradientId = useId();
  const appointmentsGradientId = `appointments-${gradientId}`;
  const completedGradientId = `completed-${gradientId}`;

  const chartData = data.length > 0
    ? data
    : [{ name: 'No Data', appointments: 0, completed: 0 }];

  return (
    <Card>
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6">{title}</Typography>
          {headerAction}
        </Box>
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={appointmentsGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={completedGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" />
            <YAxis />
            <CartesianGrid strokeDasharray="3 3" />
            <Tooltip />
            {showLegend ? <Legend /> : null}
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="#2563eb"
              fillOpacity={1}
              fill={`url(#${appointmentsGradientId})`}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="#10b981"
              fillOpacity={1}
              fill={`url(#${completedGradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
        {data.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {emptyMessage}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default AppointmentTrendCard;
