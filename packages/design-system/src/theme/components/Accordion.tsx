import {
  Theme,
  accordionClasses,
  accordionDetailsClasses,
  accordionSummaryClasses,
  typographyClasses,
} from '@mui/material';
import { Components } from '@mui/material/styles';
import IconifyIcon from '../../components/base/IconifyIcon';

const Accordion: Components<Omit<Theme, 'components'>>['MuiAccordion'] = {
  defaultProps: {
    elevation: 0,
    disableGutters: true,
  },
  styleOverrides: {
    root: ({ theme }) => ({
      padding: 0,
      outline: 'none',
      borderRadius: '1.5rem !important',
      // Smooth transitions for expand/collapse
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

      '&:hover': {
        backgroundColor: theme.vars.palette.background.elevation1,
      },
      '&:before': {
        display: 'none',
      },

      // Expanded state styling
      [`&.${accordionClasses.expanded}`]: {
        backgroundColor: theme.vars.palette.background.elevation1,
        boxShadow: `0 4px 12px rgba(${theme.vars.palette.primary.mainChannel} / 0.08)`,
      },

      [`&.${accordionClasses.disabled}`]: {
        backgroundColor: 'transparent',

        [`& .${accordionDetailsClasses.root}`]: {
          [`& .${typographyClasses.root}`]: {
            color: theme.vars.palette.text.disabled,
          },
        },
      },
    }),
  },
};

export const AccordionSummary: Components<Omit<Theme, 'components'>>['MuiAccordionSummary'] = {
  defaultProps: {
    expandIcon: (
      <IconifyIcon icon="material-symbols:keyboard-arrow-down-rounded" sx={{ fontSize: 24 }} />
    ),
  },
  styleOverrides: {
    root: ({ theme }) => ({
      gap: theme.spacing(1),
      flexDirection: 'row-reverse',
      padding: theme.spacing(3),
      // Smooth hover transition
      transition: 'background-color 0.2s ease',

      [`& .${accordionSummaryClasses.content}`]: {
        margin: 0,
        fontSize: theme.typography.h5.fontSize,
        fontWeight: 700,
        [`& .${typographyClasses.root}`]: {
          color: theme.vars.palette.text.primary,
          fontSize: theme.typography.subtitle1.fontSize,
          fontWeight: 700,
          lineHeight: 1.5,
        },
      },

      // Expand icon rotation animation
      [`& .${accordionSummaryClasses.expandIconWrapper}`]: {
        color: theme.vars.palette.text.primary,
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      },
      [`&.${accordionSummaryClasses.expanded}`]: {
        [`& .${accordionSummaryClasses.expandIconWrapper}`]: {
          transform: 'rotate(180deg)',
        },
      },

      [`&.${accordionSummaryClasses.disabled}`]: {
        color: theme.vars.palette.text.disabled,

        [`& .${accordionSummaryClasses.expandIconWrapper}`]: {
          color: theme.vars.palette.text.disabled,
        },
      },
    }),
  },
};

export const AccordionDetails: Components<Omit<Theme, 'components'>>['MuiAccordionDetails'] = {
  defaultProps: {},
  styleOverrides: {
    root: ({ theme }) => ({
      padding: theme.spacing(0, 3, 3, 7),
      color: theme.vars.palette.text.secondary,

      [`& .${typographyClasses.root}`]: {
        fontWeight: 500,
        color: theme.vars.palette.text.secondary,
      },
    }),
  },
};

export default Accordion;
