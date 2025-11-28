/**
 * Light Mode Palette
 * Complete palette definition for light color scheme
 * Includes channel variants for opacity support
 */

import { PaletteOptions, alpha } from '@mui/material/styles';
import { generatePaletteChannel, cssVarRgba } from '../utils';
import { basic, blue, purple, green, orange, red, cyan, grey, lightBlue } from './colors';

// Generate base colors with channels
const common = generatePaletteChannel({ white: basic.white, black: basic.black });
const greyPalette = generatePaletteChannel(grey);

// Primary color (Blue)
const primary = generatePaletteChannel({
  lighter: blue[50],
  light: blue[400],
  main: blue[500],
  dark: blue[600],
  darker: blue[900],
});

// Secondary color (Purple)
const secondary = generatePaletteChannel({
  lighter: purple[50],
  light: purple[300],
  main: purple[500],
  dark: purple[700],
  darker: purple[900],
});

// Success color (Green)
const success = generatePaletteChannel({
  lighter: green[50],
  light: green[400],
  main: green[500],
  dark: green[700],
  darker: green[900],
});

// Warning color (Orange)
const warning = generatePaletteChannel({
  lighter: orange[50],
  light: orange[400],
  main: orange[500],
  dark: orange[700],
  darker: orange[900],
  contrastText: common.white,
});

// Error color (Red)
const error = generatePaletteChannel({
  lighter: red[50],
  light: red[300],
  main: red[500],
  dark: red[600],
  darker: red[900],
});

// Info color (Cyan)
const info = generatePaletteChannel({
  lighter: cyan[50],
  light: cyan[300],
  main: cyan[500],
  dark: cyan[700],
  darker: cyan[900],
  contrastText: common.white,
});

// Neutral color (Grey)
const neutral = generatePaletteChannel({
  lighter: grey[100],
  light: grey[600],
  main: grey[800],
  dark: grey[900],
  darker: grey[950],
  contrastText: common.white,
});

// Action colors
const action = generatePaletteChannel({
  active: grey[500],
  hover: grey[100],
  selected: grey[100],
  disabled: grey[400],
  disabledBackground: grey[200],
  focus: grey[300],
});

// Dividers
const divider = grey[300];
const menuDivider = cssVarRgba(grey['700Channel'], 0);
const dividerLight = cssVarRgba(grey['300Channel'], 0.6);

// Text colors
const text = generatePaletteChannel({
  primary: grey[800],
  secondary: grey[600],
  disabled: grey[400],
});

// Background colors with elevation
const background = generatePaletteChannel({
  default: basic.white,
  paper: basic.white,
  elevation1: grey[50],
  elevation2: grey[100],
  elevation3: grey[200],
  elevation4: grey[300],
  menu: basic.white,
  menuElevation1: grey[50],
  menuElevation2: grey[100],
});

// Vibrant colors for special UI elements (nav items, etc.)
const vibrant = {
  listItemHover: cssVarRgba(common.whiteChannel, 0.5),
  buttonHover: cssVarRgba(common.whiteChannel, 0.7),
  textFieldHover: cssVarRgba(common.whiteChannel, 0.7),
  text: {
    secondary: alpha('#1B150F', 0.76),
    disabled: alpha('#1B150F', 0.4),
  },
  overlay: cssVarRgba(common.whiteChannel, 0.7),
};

// Channel colors for dynamic opacity (used in charts, overlays, etc.)
const chGrey = greyPalette;
const chRed = generatePaletteChannel(red);
const chBlue = generatePaletteChannel(blue);
const chGreen = generatePaletteChannel(green);
const chOrange = generatePaletteChannel(orange);
const chCyan = generatePaletteChannel(cyan);
const chLightBlue = generatePaletteChannel(lightBlue);

export const lightPalette: PaletteOptions = {
  mode: 'light',
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
