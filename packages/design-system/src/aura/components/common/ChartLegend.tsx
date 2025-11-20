import { JSX } from 'react';
import { Box, ButtonBase, SxProps, Typography } from '@mui/material';

interface ChartLegendProps {
  label: string;
  color?: string;
  isActive: boolean;
  handleClick: () => void;
  symbol?: JSX.Element;
  sx?: SxProps;
}

const ChartLegend = ({ label, color, handleClick, isActive, symbol, sx }: ChartLegendProps) => {
  return (
    <ButtonBase
      disableRipple
      sx={{
        opacity: isActive ? 0.5 : 1,
        gap: 1,
        ...sx,
      }}
      onClick={handleClick}
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

export default ChartLegend;
