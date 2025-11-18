import { Chip, type ChipProps } from '@mui/material';

export interface StatusBadgeProps extends Omit<ChipProps, 'color'> {
  status: string;
}

const statusConfig: Record<string, { color: ChipProps['color']; label?: string }> = {
  // Generic statuses
  active: { color: 'success', label: 'Active' },
  inactive: { color: 'default', label: 'Inactive' },
  pending: { color: 'warning', label: 'Pending' },
  success: { color: 'success', label: 'Success' },
  error: { color: 'error', label: 'Error' },
  warning: { color: 'warning', label: 'Warning' },
  
  // Appointment statuses
  scheduled: { color: 'info' },
  confirmed: { color: 'success' },
  'in-progress': { color: 'warning' },
  completed: { color: 'primary' },
  cancelled: { color: 'error' },
  'no-show': { color: 'error' },
  
  // PROM statuses
  expired: { color: 'error' },
  
  // Intake statuses
  reviewing: { color: 'warning' },
  approved: { color: 'success' },
  rejected: { color: 'error' },
};

export const StatusBadge = ({ status, label, ...props }: StatusBadgeProps) => {
  const config = statusConfig[status.toLowerCase()] || { color: 'default' as ChipProps['color'] };
  const displayLabel = label || config.label || status.charAt(0).toUpperCase() + status.slice(1);
  
  return (
    <Chip
      label={displayLabel}
      color={config.color}
      size="small"
      {...props}
    />
  );
};
