import { IconButton as MuiIconButton, IconButtonProps as MuiIconButtonProps, Tooltip } from '@mui/material';
import { forwardRef } from 'react';

export interface AuraIconButtonProps extends MuiIconButtonProps {
  tooltip?: string;
}

export const AuraIconButton = forwardRef<HTMLButtonElement, AuraIconButtonProps>(
  ({ tooltip, children, ...props }, ref) => {
    const button = (
      <MuiIconButton
        ref={ref}
        {...props}
        sx={{
          '&:hover': {
            bgcolor: 'action.hover',
          },
          ...props.sx,
        }}
      >
        {children}
      </MuiIconButton>
    );

    if (tooltip) {
      return <Tooltip title={tooltip}>{button}</Tooltip>;
    }

    return button;
  }
);

AuraIconButton.displayName = 'AuraIconButton';
