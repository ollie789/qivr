import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { forwardRef } from 'react';
import { auraTokens } from '../../../theme/auraTokens';

export interface AuraButtonProps extends MuiButtonProps {
  loading?: boolean;
}

export const AuraButton = forwardRef<HTMLButtonElement, AuraButtonProps>(
  ({ loading, disabled, children, ...props }, ref) => (
    <MuiButton
      ref={ref}
      disabled={disabled || loading}
      {...props}
      sx={{
        textTransform: 'none',
        fontWeight: auraTokens.fontWeights.semibold,
        borderRadius: auraTokens.borderRadius.md,
        px: auraTokens.spacing.lg,
        py: auraTokens.spacing.sm,
        transition: auraTokens.transitions.default,
        ...props.sx,
      }}
    >
      {loading ? 'Loading...' : children}
    </MuiButton>
  )
);

AuraButton.displayName = 'AuraButton';
