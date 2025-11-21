import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';

export interface AuraChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  elevated?: boolean;
}

export const AuraChartCard: React.FC<AuraChartCardProps> = ({
  title,
  subtitle,
  action,
  children,
  elevated = true,
}) => {
  return (
    <Card elevation={elevated ? 2 : 0}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" gutterBottom={!!subtitle}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action && <Box>{action}</Box>}
        </Box>
        {children}
      </CardContent>
    </Card>
  );
};
