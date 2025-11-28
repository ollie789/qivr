import { Box, Button, Stack, Typography, SxProps, alpha, useTheme } from '@mui/material';
import { ReactNode } from 'react';

export interface AuraEmptyStateProps {
  /** Icon to display - can be MUI icon or custom element */
  icon?: ReactNode;
  /** Main title text */
  title: string;
  /** Supporting description */
  description?: string;
  /** Primary action button text */
  actionText?: string;
  /** Primary action callback */
  onAction?: () => void;
  /** Secondary action button text */
  secondaryActionText?: string;
  /** Secondary action callback */
  onSecondaryAction?: () => void;
  /** Visual variant */
  variant?: 'default' | 'compact' | 'card';
  /** Custom sx props */
  sx?: SxProps;
}

export const AuraEmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  variant = 'default',
  sx,
}: AuraEmptyStateProps) => {
  const theme = useTheme();

  const isCompact = variant === 'compact';
  const isCard = variant === 'card';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: isCompact ? 4 : 8,
        px: 3,
        textAlign: 'center',
        // Card variant styling
        ...(isCard && {
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`,
          borderRadius: 3,
        }),
        // Fade in animation
        animation: 'emptyStateFadeIn 0.4s ease-out',
        '@keyframes emptyStateFadeIn': {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            mb: isCompact ? 2 : 3,
            p: isCompact ? 1.5 : 2.5,
            borderRadius: '50%',
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: 'primary.main',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': {
              fontSize: isCompact ? 32 : 48,
            },
            // Subtle pulse animation
            animation: 'iconPulse 2s ease-in-out infinite',
            '@keyframes iconPulse': {
              '0%, 100%': { transform: 'scale(1)' },
              '50%': { transform: 'scale(1.05)' },
            },
          }}
        >
          {icon}
        </Box>
      )}
      <Stack spacing={1.5} alignItems="center" sx={{ maxWidth: 400 }}>
        <Typography
          variant={isCompact ? 'subtitle1' : 'h6'}
          fontWeight={600}
          color="text.primary"
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ lineHeight: 1.6 }}
          >
            {description}
          </Typography>
        )}
        {(actionText || secondaryActionText) && (
          <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
            {secondaryActionText && onSecondaryAction && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={onSecondaryAction}
                size={isCompact ? 'small' : 'medium'}
              >
                {secondaryActionText}
              </Button>
            )}
            {actionText && onAction && (
              <Button
                variant="contained"
                onClick={onAction}
                size={isCompact ? 'small' : 'medium'}
              >
                {actionText}
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
};
