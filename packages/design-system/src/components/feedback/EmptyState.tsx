import { Box, Button, Stack, Typography, SxProps } from '@mui/material';
import { ReactNode } from 'react';

export interface AuraEmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  sx?: SxProps;
}

export const AuraEmptyState = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  sx,
}: AuraEmptyStateProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 3,
        textAlign: 'center',
        ...sx,
      }}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            color: 'text.secondary',
            opacity: 0.5,
            mb: 3,
          }}
        >
          {icon}
        </Box>
      )}
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
        {actionText && onAction && (
          <Button variant="contained" onClick={onAction} sx={{ mt: 2 }}>
            {actionText}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

// Alias for backward compatibility
export const EmptyState = AuraEmptyState;
export type EmptyStateProps = AuraEmptyStateProps;
