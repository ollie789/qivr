import { auraTokens } from '../../theme/auraTokens';
import { Tooltip, IconButton, TooltipProps } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';

export interface HelpTooltipProps extends Omit<TooltipProps, 'children'> {
  size?: 'small' | 'medium';
}

export const HelpTooltip = ({ title, size = 'small', ...props }: HelpTooltipProps) => (
  <Tooltip title={title} arrow {...props}>
    <IconButton size={size} sx={{ p: 0.5, color: 'text.secondary' }}>
      <HelpOutline fontSize={size} />
    </IconButton>
  </Tooltip>
);
