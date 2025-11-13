import React from 'react';
import Grid, { type GridProps } from '@mui/material/Grid';

export interface FormRowProps extends Omit<GridProps, 'container'> {
  /**
   * Form fields to render in a row
   */
  children: React.ReactNode;
  /**
   * Spacing between fields
   */
  spacing?: number;
}

/**
 * A consistent form row using Grid layout
 */
export const FormRow: React.FC<FormRowProps> = ({
  children,
  spacing = 2,
  sx,
  ...props
}) => {
  return (
    <Grid
      container
      spacing={spacing}
      sx={[
        { mb: 2 },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      {children}
    </Grid>
  );
};
