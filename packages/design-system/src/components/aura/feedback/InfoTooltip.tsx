import { auraTokens } from '../../../theme/auraTokens';
import { Tooltip, IconButton, TooltipProps } from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

export interface InfoTooltipProps {
  title: string | ReactNode;
  placement?: TooltipProps['placement'];
  icon?: ReactNode;
  size?: 'small' | 'medium';
}

export const InfoTooltip = ({
  title,
  placement = 'top',
  icon = <InfoIcon />,
  size = 'small',
}: InfoTooltipProps) => {
  return (
    <Tooltip title={title} placement={placement} arrow>
      <IconButton size={size} sx={{ ml: 0.5, p: 0.5 }}>
        {icon}
      </IconButton>
    </Tooltip>
  );
};
