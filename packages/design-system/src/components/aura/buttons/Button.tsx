import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { forwardRef } from 'react';

export interface AuraButtonProps extends MuiButtonProps {
  loading?: boolean;
}

export const AuraButton = forwardRef<HTMLButtonElement, AuraButtonProps>(
  ({ loading, disabled, children, ...props }, ref) => {
    return (
      <MuiButton
        ref={ref}
        disabled={disabled || loading}
        {...props}
        sx={{
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 2,
          px: 3,
          py: 1,
          ...props.sx,
        }}
      >
        {loading ? 'Loading...' : children}
      </MuiButton>
    );
  }
);

AuraButton.displayName = 'AuraButton';
