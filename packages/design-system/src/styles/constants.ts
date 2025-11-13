import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Standard spacing values for consistent layout
 */
export const spacing = {
  xs: 0.5,
  sm: 1,
  md: 2,
  lg: 3,
  xl: 4,
} as const;

/**
 * Common border styles
 */
export const borders = {
  standard: {
    border: '1px solid',
    borderColor: 'divider',
  },
  thick: {
    border: 2,
    borderColor: 'divider',
  },
  primary: {
    border: 2,
    borderColor: 'primary.main',
  },
  leftAccent: (color: string) => ({
    borderLeft: 4,
    borderColor: color,
  }),
} as const;

/**
 * Common hover effects
 */
export const hover = {
  background: {
    '&:hover': {
      bgcolor: 'action.hover',
    },
  },
  elevation: {
    transition: 'box-shadow 150ms ease, transform 150ms ease',
    '&:hover': {
      boxShadow: 2,
    },
  },
  elevationWithLift: {
    transition: 'box-shadow 150ms ease, transform 150ms ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: 8,
    },
  },
} as const;

/**
 * Calendar/grid specific styles
 */
export const calendar = {
  gridCell: {
    height: 60,
    border: '1px solid',
    borderColor: 'divider',
    p: 0.5,
    cursor: 'pointer',
    ...hover.background,
  } as SxProps<Theme>,
  
  dayHeader: {
    height: 40,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    borderRadius: 1,
    p: 0.5,
  } as SxProps<Theme>,
  
  timeLabel: {
    width: 80,
    flexShrink: 0,
    color: 'text.secondary',
  } as SxProps<Theme>,
  
  appointmentChip: {
    borderRadius: 0.5,
    p: 0.25,
    mb: 0.25,
    fontSize: '10px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: 'white',
  } as SxProps<Theme>,
} as const;

/**
 * Dialog specific styles
 */
export const dialog = {
  section: {
    mb: 3,
  } as SxProps<Theme>,
  
  contentPadding: {
    p: 3,
  } as SxProps<Theme>,
  
  iconWithLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    mb: 2,
  } as SxProps<Theme>,
  
  summaryPaper: {
    p: 3,
    bgcolor: 'grey.50',
  } as SxProps<Theme>,
} as const;

/**
 * Form specific styles
 */
export const form = {
  row: {
    mb: 2,
  } as SxProps<Theme>,
  
  fieldGroup: {
    display: 'flex',
    gap: 2,
  } as SxProps<Theme>,
} as const;
