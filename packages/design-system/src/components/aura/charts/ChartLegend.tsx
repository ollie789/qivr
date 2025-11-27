import { auraTokens } from '../../../theme/auraTokens';
import { JSX } from 'react';
import { Box, ButtonBase, SxProps, Typography } from '@mui/material';

export interface ChartLegendProps {
  label: string;
  color?: string;
  isActive?: boolean;
  onClick?: () => void;
  symbol?: JSX.Element;
  sx?: SxProps;
}

export const ChartLegend = ({ label, color, onClick, isActive = true, symbol, sx }: ChartLegendProps) => {
  return (
    <ButtonBase
      disableRipple
      sx={{
        opacity: isActive ? 1 : 0.5,
        gap: 1,
        ...sx,
      }}
      onClick={onClick}
    >
      {symbol ?? (
        <Box
          sx={{
            width: 8,
            height: 6,
            bgcolor: color || 'primary.main',
            borderRadius: 0.25,
          }}
        />
      )}

      <Typography variant="caption" noWrap sx={{ color: 'text.secondary', fontWeight: 500 }}>
        {label}
      </Typography>
    </ButtonBase>
  );
};
