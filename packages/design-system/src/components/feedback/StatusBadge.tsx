import { Chip, type ChipProps } from '@mui/material';

export type StatusType = 'active' | 'inactive' | 'pending' | 'success' | 'error' | 'warning';

export interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: StatusType;
}

const statusConfig: Record<StatusType, { color: ChipProps['color']; label: string }> = {
  active: { color: 'success', label: 'Active' },
  inactive: { color: 'default', label: 'Inactive' },
  pending: { color: 'warning', label: 'Pending' },
  success: { color: 'success', label: 'Success' },
  error: { color: 'error', label: 'Error' },
  warning: { color: 'warning', label: 'Warning' },
};

export const StatusBadge = ({ status, label, ...props }: StatusBadgeProps) => {
  const config = statusConfig[status];
  
  return (
    <Chip
      label={label || config.label}
      color={config.color}
      size="small"
      {...props}
    />
  );
};
