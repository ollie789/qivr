import { PropsWithChildren, ReactNode } from 'react';
import { Box, Stack, Typography, SxProps } from '@mui/material';

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  sx?: SxProps;
}

export const CardHeader = ({ title, subtitle, action, sx }: CardHeaderProps) => {
  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
      sx={{ mb: 3, ...sx }}
    >
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: subtitle ? 0.5 : 0 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      {action && <Box sx={{ mx: '-10px' }}>{action}</Box>}
    </Stack>
  );
};

interface CardHeaderActionProps {
  sx?: SxProps;
}

export const CardHeaderAction = ({ children, sx }: PropsWithChildren<CardHeaderActionProps>) => {
  return <Box sx={{ mx: '-10px', ...sx }}>{children}</Box>;
};
