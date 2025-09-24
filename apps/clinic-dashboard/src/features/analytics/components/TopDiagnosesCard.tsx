import React from 'react';
import { Card, CardContent, Skeleton, Typography } from '@mui/material';
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
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>
          <Skeleton variant="rectangular" height={height} />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.length > 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
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
                  <Cell key={`diagnosis-${index}`} fill={item.color ?? '#7c3aed'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default TopDiagnosesCard;
