/**
 * Qivr Theme Factory
 * Aurora UI-inspired theme creation with CSS variables and dark mode
 */

import { createTheme as muiCreateTheme } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';
import type {} from '@mui/x-data-grid/themeAugmentation';
import { createPalette } from './palette';
import { lightShadows } from './shadows';
import mixins from './mixins';
import sxConfig from './sxConfig';

// Component overrides
import Accordion, { AccordionDetails, AccordionSummary } from './components/Accordion';
import Alert from './components/Alert';
import AppBar from './components/AppBar';
import Autocomplete from './components/Autocomplete';
import { Avatar, AvatarGroup } from './components/Avatar';
import Backdrop from './components/Backdrop';
import Breadcrumbs from './components/Breadcrumbs';
import Button, { ButtonBase } from './components/Button';
import ButtonGroup from './components/ButtonGroup';
import Checkbox from './components/Checkbox';
import Chip from './components/Chip';
import CssBaseline from './components/CssBaseline';
import DataGrid from './components/DataGrid';
import Dialog from './components/Dialog';
import Divider from './components/Divider';
import Drawer from './components/Drawer';
import Fab from './components/Fab';
import ImageList, { ImageListItem } from './components/ImageList';
import Link from './components/Link';
import List, { ListItemButton, ListItemIcon, ListItemText } from './components/List';
import { MenuItem } from './components/Menu';
import Pagination, { PaginationItem } from './components/Pagination';
import Paper from './components/Paper';
import Popover from './components/Popover';
import Popper from './components/Popper';
import { CircularProgress, LinearProgress } from './components/Progress';
import Radio from './components/Radio';
import Rating from './components/Rating';
import Select from './components/Select';
import Stack from './components/Stack';
import Stepper, {
  Step,
  StepConnector,
  StepContent,
  StepIcon,
  StepLabel,
} from './components/Stepper';
import Switch from './components/Switch';
import { Tab, Tabs } from './components/Tab';
import Table, {
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from './components/Table';
import TablePagination from './components/TablePagination';
import ToggleButton, { ToggleButtonGroup } from './components/ToggleButton';
import Toolbar from './components/Toolbar';
import Tooltip from './components/Tooltip';
import Typography from './components/Typography';

// Date/Time Pickers
import DateTimePicker from './components/pickers/date-time/DateTimePicker';
import DesktopDateTimePicker from './components/pickers/date-time/DesktopDateTimePicker';
import MobileDateTimePicker from './components/pickers/date-time/MobileDateTimePicker';
import StaticDateTimePicker from './components/pickers/date-time/StaticDateTimePicker';
import DateCalendar from './components/pickers/date/DateCalendar';
import DateField from './components/pickers/date/DateField';
import DatePicker from './components/pickers/date/DatePicker';
import DesktopDatePicker from './components/pickers/date/DesktopDatePicker';
import MobileDatePicker from './components/pickers/date/MobileDatePicker';
import StaticDatePicker from './components/pickers/date/StaticDatePicker';
import DesktopTimePicker from './components/pickers/time/DesktopTimePicker';
import MobileTimePicker from './components/pickers/time/MobileTimePicker';
import MultiSectionDigitalClock from './components/pickers/time/MultiSectionDigitalClock';
import StaticTimePicker from './components/pickers/time/StaticTimePicker';
import TimeClock from './components/pickers/time/TimeClock';
import TimePicker from './components/pickers/time/TimePicker';

// Text Fields
import FilledInput from './components/text-fields/FilledInput';
import FormControl from './components/text-fields/FormControl';
import FormControlLabel from './components/text-fields/FormControlLabel';
import FormHelperText from './components/text-fields/FormHelperText';
import Input, { InputBase } from './components/text-fields/Input';
import InputAdornment from './components/text-fields/InputAdornment';
import InputLabel from './components/text-fields/InputLabel';
import OutlinedInput from './components/text-fields/OutlinedInput';
import TextField from './components/text-fields/TextField';

/**
 * Typography configuration
 * Consistent across brands, based on Inter font stack
 */
const typography = {
  htmlFontSize: 16,
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  fontSize: 14,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightSemiBold: 600,
  fontWeightBold: 700,

  h1: {
    fontSize: '2.5rem', // 40px
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '2rem', // 32px
    fontWeight: 700,
    lineHeight: 1.25,
  },
  h3: {
    fontSize: '1.75rem', // 28px
    fontWeight: 700,
    lineHeight: 1.3,
  },
  h4: {
    fontSize: '1.5rem', // 24px
    fontWeight: 600,
    lineHeight: 1.35,
  },
  h5: {
    fontSize: '1.25rem', // 20px
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h6: {
    fontSize: '1rem', // 16px
    fontWeight: 700,
    lineHeight: 1.5,
  },

  subtitle1: {
    fontSize: '1rem',
    fontWeight: 500,
    lineHeight: 1.5,
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 600,
    lineHeight: 1.43,
  },

  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
  },

  button: {
    textTransform: 'none' as const,
    fontWeight: 600,
    fontSize: '0.875rem',
  },

  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
  },

  overline: {
    fontSize: '0.75rem',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    lineHeight: 2,
  },
};

/**
 * Shape configuration
 */
const shape = {
  borderRadius: 8, // Default border radius in px
};

/**
 * Spacing configuration
 * Base unit is 8px
 */
const spacing = 8;

/**
 * Unstable SX config for custom CSS utilities
 * Enables custom sx props like lineClamp, glassEffect, etc.
 */
const unstable_sxConfig = sxConfig;

/**
 * Brand types
 * Different apps can have slightly different color emphasis
 */
export type BrandType = 'clinic' | 'patient' | 'widget';

/**
 * Create Qivr theme with CSS variables and dark mode support
 *
 * @param brand - Brand variant (clinic, patient, widget)
 * @param direction - Text direction (ltr or rtl)
 * @returns MUI theme with CSS variables
 */
export const createQivrTheme = (
  brand: BrandType = 'clinic',
  direction: 'ltr' | 'rtl' = 'ltr',
) => {
  // Note: Brand-specific customization can be added later
  // For now, all brands use the same palette
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _brand = brand;

  return muiCreateTheme({
    // Enable CSS variables with custom selector and prefix
    cssVariables: {
      colorSchemeSelector: 'data-qivr-color-scheme',
      cssVarPrefix: 'qivr',
    },

    // Define color schemes for light and dark modes
    colorSchemes: {
      light: {
        palette: createPalette('light'),
      },
      dark: {
        palette: createPalette('dark'),
      },
    },

    // Shadows (applied globally)
    shadows: ['none', ...lightShadows] as any,

    // Typography
    typography,

    // Text direction
    direction,

    // Shape
    shape,

    // Spacing
    spacing,

    // Layout mixins for topbar/sidebar/footer heights
    mixins,

    // Custom SX utilities (lineClamp, glassEffect, etc.)
    unstable_sxConfig,

    // Component overrides - Aurora UI styled components
    components: {
      MuiAppBar: AppBar,
      MuiPaper: Paper,
      MuiDivider: Divider,
      MuiAccordion: Accordion,
      MuiAccordionSummary: AccordionSummary,
      MuiButton: Button,
      MuiFab: Fab,
      MuiToggleButton: ToggleButton,
      MuiToggleButtonGroup: ToggleButtonGroup,
      MuiButtonBase: ButtonBase,
      MuiButtonGroup: ButtonGroup,
      // Input fields
      MuiTextField: TextField,
      MuiFilledInput: FilledInput,
      MuiOutlinedInput: OutlinedInput,
      MuiInputLabel: InputLabel,
      MuiInputAdornment: InputAdornment,
      MuiFormHelperText: FormHelperText,
      MuiInput: Input,
      MuiInputBase: InputBase,
      MuiFormControl: FormControl,
      MuiFormControlLabel: FormControlLabel,
      MuiAutocomplete: Autocomplete,
      // Navigation & Layout
      MuiBreadcrumbs: Breadcrumbs,
      MuiSelect: Select,
      MuiDialog: Dialog,
      MuiAlert: Alert,
      MuiStack: Stack,
      MuiCheckbox: Checkbox,
      MuiRadio: Radio,
      MuiPagination: Pagination,
      MuiPaginationItem: PaginationItem,
      MuiTablePagination: TablePagination,
      MuiChip: Chip,
      MuiSwitch: Switch,
      MuiList: List,
      MuiListItemButton: ListItemButton,
      MuiListItemIcon: ListItemIcon,
      MuiListItemText: ListItemText,
      MuiMenuItem: MenuItem,
      MuiToolbar: Toolbar,
      MuiTooltip: Tooltip,
      MuiTabs: Tabs,
      MuiTab: Tab,
      MuiTypography: Typography,
      MuiCircularProgress: CircularProgress,
      MuiLinearProgress: LinearProgress,
      MuiAvatar: Avatar,
      MuiAvatarGroup: AvatarGroup,
      MuiAccordionDetails: AccordionDetails,
      MuiTableContainer: TableContainer,
      MuiTable: Table,
      MuiTableRow: TableRow,
      MuiTableCell: TableCell,
      MuiDataGrid: DataGrid,
      MuiTableSortLabel: TableSortLabel,
      MuiCssBaseline: CssBaseline,
      MuiLink: Link,
      MuiRating: Rating,
      MuiBackdrop: Backdrop,
      MuiPopover: Popover,
      MuiPopper: Popper,
      MuiDrawer: Drawer,
      MuiStepper: Stepper,
      MuiStep: Step,
      MuiStepIcon: StepIcon,
      MuiStepContent: StepContent,
      MuiStepLabel: StepLabel,
      MuiStepConnector: StepConnector,
      // Date/Time Pickers
      MuiDateCalendar: DateCalendar,
      MuiDatePicker: DatePicker,
      MuiMobileDatePicker: MobileDatePicker,
      MuiStaticDatePicker: StaticDatePicker,
      MuiDesktopDatePicker: DesktopDatePicker,
      MuiDateField: DateField,
      MuiTimeClock: TimeClock,
      MuiTimePicker: TimePicker,
      MuiDesktopTimePicker: DesktopTimePicker,
      MuiMobileTimePicker: MobileTimePicker,
      MuiStaticTimePicker: StaticTimePicker,
      MuiMultiSectionDigitalClock: MultiSectionDigitalClock,
      MuiDateTimePicker: DateTimePicker,
      MuiDesktopDateTimePicker: DesktopDateTimePicker,
      MuiMobileDateTimePicker: MobileDateTimePicker,
      MuiStaticDateTimePicker: StaticDateTimePicker,
      MuiTableHead: TableHead,
      MuiImageList: ImageList,
      MuiImageListItem: ImageListItem,
    },
  });
};

// Export default theme instance for convenience
export const qivrTheme = createQivrTheme();
