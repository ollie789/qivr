import React from 'react';
import MuiBreadcrumbs, { type BreadcrumbsProps as MuiBreadcrumbsProps } from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

export interface BreadcrumbItem {
  /**
   * Label to display
   */
  label: string;
  /**
   * Path to navigate to (optional for current page)
   */
  href?: string;
  /**
   * Click handler (alternative to href)
   */
  onClick?: () => void;
}

export interface BreadcrumbsProps extends Omit<MuiBreadcrumbsProps, 'children'> {
  /**
   * Array of breadcrumb items
   */
  items: BreadcrumbItem[];
}

/**
 * A consistent breadcrumb navigation component
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items = [],
  separator = <NavigateNextIcon fontSize="small" />,
  ...props
}) => {
  return (
    <MuiBreadcrumbs separator={separator} {...props}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        if (isLast) {
          return (
            <Typography key={item.label} color="text.primary">
              {item.label}
            </Typography>
          );
        }
        
        return (
          <Link
            key={item.label}
            color="inherit"
            href={item.href}
            onClick={(e) => {
              if (item.onClick) {
                e.preventDefault();
                item.onClick();
              }
            }}
            underline="hover"
            sx={{ cursor: 'pointer' }}
          >
            {item.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
};
