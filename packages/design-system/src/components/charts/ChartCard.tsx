import React from "react";
import { Paper, Typography, Box, SxProps } from "@mui/material";
import { glassCard } from '../../styles/glassmorphism';

export interface AuraChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  elevated?: boolean;
  sx?: SxProps;
}

export const AuraChartCard: React.FC<AuraChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  sx,
}) => {
  return (
    <Paper 
      className="chart-enter"
      sx={{ 
        p: { xs: 3, md: 5 }, 
        height: 1,
        ...glassCard('light'),
        ...(sx as any),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: subtitle ? 2 : 3 }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: subtitle ? 0.5 : 0 }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
      {children}
    </Paper>
  );
};
