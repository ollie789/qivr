import React from 'react';
import { Box } from '@mui/material';

export interface TabPanelProps {
  /** Content to display in the tab panel */
  children?: React.ReactNode;
  /** Current tab index */
  value: number;
  /** This panel's tab index */
  index: number;
  /** Optional padding override */
  padding?: number;
}

/**
 * TabPanel wraps tab content and handles visibility
 * Used with MUI Tabs component
 */
export const TabPanel: React.FC<TabPanelProps> = ({
  children,
  value,
  index,
  padding = 3,
  ...other
}) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: padding }}>{children}</Box>}
    </div>
  );
};
