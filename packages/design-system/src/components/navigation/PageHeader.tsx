import React from 'react';
import Box, { type BoxProps } from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

export interface PageHeaderProps extends BoxProps {
  /**
   * Page title
   */
  title: string;
  /**
   * Page description/subtitle
   */
  description?: string;
  /**
   * Breadcrumb items
   */
  breadcrumbs?: BreadcrumbItem[];
  /**
   * Action buttons or elements to display on the right
   */
  actions?: React.ReactNode;
}

/**
 * A consistent page header with title, description, breadcrumbs, and actions
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
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
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} sx={{ mb: 2 }} />
      )}
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          {description && (
            <Typography variant="body1" color="text.secondary">
              {description}
            </Typography>
          )}
        </Box>
        
        {actions && (
          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
            {actions}
          </Box>
        )}
      </Box>
    </Box>
  );
};
