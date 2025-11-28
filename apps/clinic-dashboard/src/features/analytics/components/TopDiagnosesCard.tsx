import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TopDiagnosisDatum } from '../types';
import { AuraChartCard, AuraEmptyState } from '@qivr/design-system';
import { BarChart as BarChartIcon } from '@mui/icons-material';

export interface TopDiagnosesCardProps {
  title?: string;
  data: TopDiagnosisDatum[];
  height?: number;
  emptyMessage?: string;
}

const TopDiagnosesCard: React.FC<TopDiagnosesCardProps> = ({
  title = 'Top Diagnoses',
  data,
  height = 300,
  emptyMessage = 'No diagnosis data available',
}) => {
  const isEmpty = data.length === 0;

  return (
    <AuraChartCard title={title}>
      {isEmpty ? (
        <AuraEmptyState
          icon={<BarChartIcon />}
          title="No Data"
          description={emptyMessage}
        />
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Bar dataKey="count" fill="var(--qivr-palette-primary-main, #3385F0)" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </AuraChartCard>
  );
};

export default TopDiagnosesCard;
