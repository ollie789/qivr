/**
 * Color Definitions
 * Re-exports from auraColors for theme palette construction
 * Single source of truth: auraColors.ts
 */

import { auraColors } from '../auraColors';

// Basic colors
export const basic = {
  white: '#FFFFFF',
  black: '#000000',
};

// Re-export color scales from auraColors (adding 950 shade where needed)
export const blue = {
  ...auraColors.blue,
  950: '#051A4D',
};

export const purple = {
  ...auraColors.purple,
  950: '#1E034D',
};

export const green = {
  ...auraColors.green,
  950: '#02332A',
};

export const orange = {
  ...auraColors.orange,
  950: '#4D2A00',
};

export const red = {
  ...auraColors.red,
  950: '#4D111D',
};

// Cyan - using auraColors cyan with extended shades
export const cyan = {
  ...auraColors.cyan,
  950: '#003D41',
};

// Grey - direct from auraColors
export const grey = {
  ...auraColors.grey,
};

// Light Blue - For charts/accents (not in auraColors, keep local)
export const lightBlue = {
  50: '#E0F3FA',
  100: '#BCE6F4',
  200: '#90D6EC',
  300: '#64C6E5',
  400: '#39B6DD',
  500: '#0DA6D6',
  600: '#0B8DB6',
  700: '#097496',
  800: '#075B76',
  900: '#054256',
  950: '#03212B',
};
