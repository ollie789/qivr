import { Chip, ChipProps } from '@mui/material';

type ChipColor = 'success' | 'error' | 'warning' | 'info' | 'default' | 'primary' | 'secondary';

const statusColorMap: Record<string, ChipColor> = {
  success: 'success',
  completed: 'success',
  approved: 'success',
  error: 'error',
  rejected: 'error',
  cancelled: 'error',
  expired: 'error',
  warning: 'warning',
  pending: 'warning',
  reviewing: 'warning',
  'in-progress': 'info',
  scheduled: 'info',
  info: 'info',
  default: 'default',
};

export interface AuraStatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: string;
  label?: string;
}

export const AuraStatusBadge = ({ status, label, ...props }: AuraStatusBadgeProps) => {
  const color = statusColorMap[status] || 'default';
  const displayLabel = label || status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <Chip
      label={displayLabel}
      size="small"
      color={color}
      variant="outlined"
      sx={{ fontWeight: 600, borderRadius: 1.5, ...props.sx }}
      {...props}
    />
  );
};

// Alias for backward compatibility
export const StatusBadge = AuraStatusBadge;
export type StatusBadgeProps = AuraStatusBadgeProps;
