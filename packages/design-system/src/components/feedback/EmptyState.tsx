import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { QivrButton } from '../QivrButton';

export interface EmptyStateProps extends Omit<BoxProps, 'children'> {
  /**
   * Icon to display
   */
  icon?: React.ReactNode;
  /**
   * Title of the empty state
   */
  title: string;
  /**
   * Description text
   */
  description?: string;
  /**
   * Primary action button text
   */
  actionText?: string;
  /**
   * Primary action button handler
   */
  onAction?: () => void;
  /**
   * Secondary action button text
   */
  secondaryActionText?: string;
  /**
   * Secondary action button handler
   */
  onSecondaryAction?: () => void;
}

/**
 * A consistent empty state component for no-data scenarios
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
  sx,
  ...props
}) => {
  return (
    <Box
      sx={[
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          py: 6,
          px: 3,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {icon && (
        <Box
          sx={{
            fontSize: 64,
            color: 'text.disabled',
            mb: 2,
          }}
        >
          {icon}
        </Box>
      )}
      
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      
      {description && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, maxWidth: 400 }}
        >
          {description}
        </Typography>
      )}
      
      {(actionText || secondaryActionText) && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {actionText && (
            <QivrButton
              variant="contained"
              onClick={onAction}
            >
              {actionText}
            </QivrButton>
          )}
          {secondaryActionText && (
            <QivrButton
              variant="outlined"
              emphasize="subtle"
              onClick={onSecondaryAction}
            >
              {secondaryActionText}
            </QivrButton>
          )}
        </Box>
      )}
    </Box>
  );
};
