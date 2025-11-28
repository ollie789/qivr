import { Paper, PaperProps } from '@mui/material';
import { auraTokens } from '../../theme/auraTokens';

export interface AuraCardProps extends Omit<PaperProps, 'variant'> {
  /** Enable hover lift effect */
  hover?: boolean;
  /** Use gradient background */
  gradient?: boolean;
  /** Make card clickable with cursor pointer */
  clickable?: boolean;
  /** Card variant: 'flat' (no shadow), 'subtle' (light shadow), 'raised' (prominent shadow) */
  variant?: 'flat' | 'subtle' | 'raised';
}

export const AuraCard = ({
  hover = true,
  gradient = false,
  clickable = false,
  variant = 'flat',
  children,
  sx,
  ...props
}: AuraCardProps) => {
  const variantStyles = {
    flat: {
      boxShadow: 'none',
      border: '1px solid',
      borderColor: 'divider',
    },
    subtle: {
      boxShadow: auraTokens.shadows.sm,
      border: '1px solid',
      borderColor: 'divider',
    },
    raised: {
      boxShadow: auraTokens.shadows.md,
      border: 'none',
    },
  };

  return (
    <Paper
      elevation={0}
      {...props}
      sx={{
        p: auraTokens.spacing.lg,
        borderRadius: auraTokens.borderRadius.lg,
        background: gradient ? auraTokens.gradients.primary : undefined,
        color: gradient ? 'white' : undefined,
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: clickable ? 'pointer' : undefined,
        ...(!gradient && variantStyles[variant]),
        ...(hover && !gradient && {
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: 'primary.light',
            boxShadow: auraTokens.shadows.lg,
          },
        }),
        ...(gradient && hover && {
          '&:hover': {
            transform: 'translateY(-2px)',
            filter: 'brightness(1.05)',
            boxShadow: auraTokens.shadows.lg,
          },
        }),
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};
