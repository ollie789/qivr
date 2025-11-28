import React from "react";
import { Paper, Typography, Box, SxProps, Theme } from "@mui/material";
import { glassTokens } from '../../theme/auraTokens';

export interface AuraChartCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  elevated?: boolean;
  sx?: SxProps<Theme>;
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
      elevation={0}
      className="chart-enter"
      sx={{
        p: { xs: 2, sm: 3 },
        height: 1,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: glassTokens.shadow.standard,
        },
        ...sx,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
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
    </Paper>
  );
};
