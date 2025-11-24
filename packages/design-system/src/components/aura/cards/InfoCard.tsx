import { Paper, SxProps } from '@mui/material';
import { ReactNode } from 'react';
import { CardHeader } from './CardHeader';

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
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: 4,
          transform: 'translateY(-2px)',
        },
        ...sx 
      }}
    >
      <CardHeader title={title} subtitle={subtitle} action={action} />
      {children}
    </Paper>
  );
};
