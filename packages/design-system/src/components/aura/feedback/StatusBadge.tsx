import { auraTokens } from '../../../theme/auraTokens';
import { Chip, ChipProps } from '@mui/material';

export interface AuraStatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: 'success' | 'error' | 'warning' | 'info' | 'default';
  label: string;
}

export const AuraStatusBadge = ({ status, label, ...props }: AuraStatusBadgeProps) => {
  return (
    <Chip
      label={label}
      size="small"
      color={status}
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderRadius: 1.5,
        ...props.sx,
      }}
      {...props}
    />
  );
};
