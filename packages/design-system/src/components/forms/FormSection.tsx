import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';

export interface FormSectionProps extends BoxProps {
  /**
   * Section title
   */
  title?: string;
  /**
   * Section description
   */
  description?: string;
  /**
   * Whether to show a divider after the section
   */
  divider?: boolean;
  /**
   * Form fields to render
   */
  children: React.ReactNode;
}

/**
 * A consistent form section with optional title and description
 */
export const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  divider = false,
  children,
  sx,
  ...props
}) => {
  return (
    <Box
      sx={[
        { mb: 3 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {(title || description) && (
        <Box sx={{ mb: 2 }}>
          {title && (
            <Typography variant="h6" gutterBottom>
              {title}
            </Typography>
          )}
          {description && (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
      )}
      
      {children}
      
      {divider && <Divider sx={{ mt: 3 }} />}
    </Box>
  );
};
