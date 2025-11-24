import { Paper, SxProps } from '@mui/material';
import { ReactNode } from 'react';
import { CardHeader } from './CardHeader';
import { glassCard } from '../../../styles/glassmorphism';

export interface InfoCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  sx?: SxProps;
}

export const InfoCard = ({ title, subtitle, action, children, sx }: InfoCardProps) => {
  return (
    <Paper 
      sx={{ 
        p: { xs: 3, md: 5 }, 
        height: 1,
        ...glassCard('light'),
        ...(sx as any),
      }}
    >
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Paper>
  );
};
