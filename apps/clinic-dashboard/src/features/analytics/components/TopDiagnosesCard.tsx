import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import type { DiagnosisDatum } from '../types';
import { DashboardSectionCard } from '@qivr/design-system';

export interface TopDiagnosesCardProps {
  title: string;
  data: DiagnosisDatum[];
  height?: number;
  loading?: boolean;
  emptyMessage?: string;
  xAxisAngle?: number;
}

const TopDiagnosesCard: React.FC<TopDiagnosesCardProps> = ({
  title,
  data,
  height = 250,
  loading = false,
  emptyMessage = 'No diagnosis data available',
  xAxisAngle = -25,
}) => {
  if (loading) {
    return (
      <DashboardSectionCard
        header={<Typography variant="h6">{title}</Typography>}
        headerProps={{ sx: { borderBottom: 'none', px: 3, py: 2 } }}
        sx={{ p: 0 }}
      >
        <Box sx={{ px: 3, pb: 3 }}>
          <Skeleton variant="rectangular" height={height} />
        </Box>
      </DashboardSectionCard>
    );
  }

  const hasData = data.length > 0;

  return (
    <DashboardSectionCard
      header={<Typography variant="h6">{title}</Typography>}
      headerProps={{ sx: { borderBottom: 'none', px: 3, py: 2 } }}
      sx={{ p: 0 }}
    >
      <Box sx={{ px: 3, pb: 3 }}>
        {hasData ? (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={xAxisAngle}
                textAnchor="end"
                height={Math.abs(xAxisAngle) > 0 ? 70 : undefined}
                interval={0}
              />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value}%`} />
              <Bar dataKey="percentage">
                {data.map((item, index) => (
                  <Cell key={`diagnosis-${index}`} fill={item.color ?? 'var(--qivr-palette-secondary-main)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        )}
      </Box>
    </DashboardSectionCard>
  );
};

export default TopDiagnosesCard;
