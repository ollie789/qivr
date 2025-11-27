import { Paper, PaperProps } from '@mui/material';
import { auraTokens } from '../../theme/auraTokens';

export interface AuraCardProps extends PaperProps {
  hover?: boolean;
  gradient?: boolean;
}

export const AuraCard = ({ hover = true, gradient = false, children, sx, ...props }: AuraCardProps) => (
  <Paper
    elevation={0}
    {...props}
    sx={{
      p: auraTokens.spacing.lg,
      borderRadius: auraTokens.borderRadius.lg,
      border: gradient ? 'none' : '1px solid',
      borderColor: 'divider',
      background: gradient ? auraTokens.gradients.primary : undefined,
      color: gradient ? 'white' : undefined,
      transition: auraTokens.transitions.default,
      ...(hover && !gradient && {
        '&:hover': {
          borderColor: 'primary.main',
          boxShadow: auraTokens.shadows.md,
        },
      }),
      ...sx,
    }}
  >
    {children}
  </Paper>
);
