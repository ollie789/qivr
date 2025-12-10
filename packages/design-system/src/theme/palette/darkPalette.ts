/**
 * Dark Mode Palette
 * Complete palette definition for dark color scheme
 * Inverted shades and adjusted contrast for dark backgrounds
 */

import { PaletteOptions, alpha } from '@mui/material/styles';
import { generatePaletteChannel, cssVarRgba } from '../utils';
import { basic, blue, purple, green, orange, red, cyan, grey, lightBlue } from './colors';

// Generate base colors with channels
const common = generatePaletteChannel({ white: basic.white, black: basic.black });

// Inverted grey scale for dark mode
const greyPalette = generatePaletteChannel({
  50: grey[950],
  100: grey[900],
  200: grey[800],
  300: grey[700],
  400: grey[600],
  500: grey[500],
  600: grey[400],
  700: grey[300],
  800: grey[200],
  900: grey[100],
  950: grey[50],
});

// Primary color (Blue) - lighter shades for dark mode
const primary = generatePaletteChannel({
  lighter: blue[900],
  light: blue[300],
  main: blue[400],
  dark: blue[200],
  darker: blue[50],
});

// Secondary color (Purple)
const secondary = generatePaletteChannel({
  lighter: purple[900],
  light: purple[400],
  main: purple[400],
  dark: purple[200],
  darker: purple[50],
});

// Success color (Green)
const success = generatePaletteChannel({
  lighter: green[900],
  light: green[300],
  main: green[400],
  dark: green[200],
  darker: green[50],
});

// Warning color (Orange)
const warning = generatePaletteChannel({
  lighter: orange[900],
  light: orange[300],
  main: orange[400],
  dark: orange[200],
  darker: orange[50],
  contrastText: grey[900],
});

// Error color (Red)
const error = generatePaletteChannel({
  lighter: red[900],
  light: red[400],
  main: red[400],
  dark: red[300],
  darker: red[50],
});

// Info color (Cyan)
const info = generatePaletteChannel({
  lighter: cyan[900],
  light: cyan[400],
  main: cyan[400],
  dark: cyan[200],
  darker: cyan[50],
  contrastText: grey[900],
});

// Neutral color (Grey)
const neutral = generatePaletteChannel({
  lighter: grey[900],
  light: grey[300],
  main: grey[200],
  dark: grey[100],
  darker: grey[50],
  contrastText: grey[900],
});

// Action colors for dark mode
const action = generatePaletteChannel({
  active: grey[400],
  hover: alpha(common.white, 0.08),
  selected: alpha(common.white, 0.16),
  disabled: grey[600],
  disabledBackground: grey[800],
  focus: grey[700],
});

// Dividers
const divider = alpha(common.white, 0.12);
const menuDivider = cssVarRgba(greyPalette['300Channel'], 0);
const dividerLight = cssVarRgba(greyPalette['700Channel'], 0.6);

// Text colors for dark mode
const text = generatePaletteChannel({
  primary: grey[100],
  secondary: grey[400],
  disabled: grey[600],
});

// Background colors for dark mode with elevation
const background = generatePaletteChannel({
  default: grey[900],
  paper: grey[900],
  elevation1: '#1B2124', // Slightly lighter than default
  elevation2: '#262D30',
  elevation3: '#2D3539',
  elevation4: '#353C40',
  menu: grey[900],
  menuElevation1: '#1B2124',
  menuElevation2: '#262D30',
});

// Vibrant colors for dark mode
const vibrant = {
  listItemHover: cssVarRgba(common.blackChannel, 0.5),
  buttonHover: cssVarRgba(common.blackChannel, 0.7),
  textFieldHover: cssVarRgba(common.blackChannel, 0.7),
  text: {
    secondary: alpha(common.white, 0.7),
    disabled: alpha(common.white, 0.3),
  },
  overlay: cssVarRgba(common.blackChannel, 0.7),
};

// Channel colors (inverted for dark mode)
const chGrey = generatePaletteChannel({
  50: grey[950],
  100: grey[900],
  200: grey[800],
  300: grey[700],
  400: grey[600],
  500: grey[500],
  600: grey[400],
  700: grey[300],
  800: grey[200],
  900: grey[100],
  950: grey[50],
});

const chRed = generatePaletteChannel({
  50: red[950],
  100: red[900],
  200: red[800],
  300: red[700],
  400: red[600],
  500: red[500],
  600: red[400],
  700: red[300],
  800: red[200],
  900: red[100],
  950: red[50],
});

const chBlue = generatePaletteChannel({
  50: blue[950],
  100: blue[900],
  200: blue[800],
  300: blue[700],
  400: blue[600],
  500: blue[500],
  600: blue[400],
  700: blue[300],
  800: blue[200],
  900: blue[100],
  950: blue[50],
});

const chGreen = generatePaletteChannel({
  50: green[950],
  100: green[900],
  200: green[800],
  300: green[700],
  400: green[600],
  500: green[500],
  600: green[400],
  700: green[300],
  800: green[200],
  900: green[100],
  950: green[50],
});

const chOrange = generatePaletteChannel({
  50: orange[950],
  100: orange[900],
  200: orange[800],
  300: orange[700],
  400: orange[600],
  500: orange[500],
  600: orange[400],
  700: orange[300],
  800: orange[200],
  900: orange[100],
  950: orange[50],
});

const chCyan = generatePaletteChannel({
  50: cyan[950],
  100: cyan[900],
  200: cyan[800],
  300: cyan[700],
  400: cyan[600],
  500: cyan[500],
  600: cyan[400],
  700: cyan[300],
  800: cyan[200],
  900: cyan[100],
  950: cyan[50],
});

const chLightBlue = generatePaletteChannel({
  50: lightBlue[950],
  100: lightBlue[900],
  200: lightBlue[800],
  300: lightBlue[700],
  400: lightBlue[600],
  500: lightBlue[500],
  600: lightBlue[400],
  700: lightBlue[300],
  800: lightBlue[200],
  900: lightBlue[100],
  950: lightBlue[50],
});

export const darkPalette: PaletteOptions = {
  mode: 'dark',
  common,
  grey: greyPalette,
  primary,
  secondary,
  error,
  warning,
  success,
  info,
  neutral,
  action,
  divider,
  dividerLight,
  menuDivider,
  text,
  background,
  vibrant,
  chGrey,
  chRed,
  chBlue,
  chGreen,
  chOrange,
  chCyan,
  chLightBlue,
};
