import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import { auraTokens } from '../../theme/auraTokens';

export interface StatCardProps {
  /** Label text displayed above value */
  label: string;
  /** The primary value to display */
  value: string | number;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Optional color for the icon */
  iconColor?: string;
  /** Compact mode for smaller cards */
  compact?: boolean;
}

/**
 * StatCard displays a single metric with optional icon
 * Used for dashboard stats, patient info quick stats, etc.
 */
export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  iconColor,
  compact = false,
}) => {
  if (compact) {
    return (
      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: auraTokens.borderRadius.sm }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon && (
            <Box sx={{ color: iconColor || 'inherit' }}>
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h6">{value}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};
