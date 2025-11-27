import { IconButton, IconButtonProps, Tooltip } from '@mui/material';
import { ReactNode } from 'react';

export interface ActionButtonProps extends IconButtonProps {
  icon: ReactNode;
  tooltip?: string;
}

export const ActionButton = ({ icon, tooltip, ...props }: ActionButtonProps) => {
  const button = (
    <IconButton size="small" {...props}>
      {icon}
    </IconButton>
  );
  return tooltip ? <Tooltip title={tooltip}>{button}</Tooltip> : button;
};
