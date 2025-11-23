import { Box, Button, Stack, Typography, SxProps } from '@mui/material';
import { ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { ReactNode } from 'react';

export interface AuraErrorStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  sx?: SxProps;
}

export const AuraErrorState = ({
  icon = <ErrorIcon />,
  title,
  description,
  actionText = 'Try Again',
  onAction,
  sx,
}: AuraErrorStateProps) => {
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
      <Box
        sx={{
          fontSize: 64,
          color: 'error.main',
          opacity: 0.8,
          mb: 3,
        }}
      >
        {icon}
      </Box>
      <Stack spacing={2} alignItems="center">
        <Typography variant="h6" color="error.main" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
        {onAction && (
          <Button variant="outlined" color="error" onClick={onAction} sx={{ mt: 2 }}>
            {actionText}
          </Button>
        )}
      </Stack>
    </Box>
  );
};
