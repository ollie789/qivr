/**
 * Palette Factory & Type Augmentation
 * Exports palette creation function and extends MUI types
 */

import { PaletteOptions } from '@mui/material/styles';
import { lightPalette } from './lightPalette';
import { darkPalette } from './darkPalette';

export type PaletteColorKey =
  | 'primary'
  | 'secondary'
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'neutral';

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Extend MUI theme types with custom palette properties
declare module '@mui/material/styles' {
  interface Color {
    950: string;
    '50Channel': string;
    '100Channel': string;
    '200Channel': string;
    '300Channel': string;
    '400Channel': string;
    '500Channel': string;
    '600Channel': string;
    '700Channel': string;
    '800Channel': string;
    '900Channel': string;
    '950Channel': string;
  }

  interface PaletteColor {
    lighter: string;
    darker: string;
  }

  interface SimplePaletteColorOptions extends Partial<PaletteColor> {}

  interface PaletteColorChannel {
    lighterChannel: string;
    darkerChannel: string;
  }

  interface Palette {
    neutral: PaletteColor;
    grey: Color;
    chGrey: Color;
    chRed: Color;
    chBlue: Color;
    chGreen: Color;
    chOrange: Color;
    chCyan: Color;
    chLightBlue: Color;
    dividerLight: string;
    menuDivider: string;
    vibrant: {
      listItemHover: string;
      buttonHover: string;
      textFieldHover: string;
      text: {
        secondary: string;
        disabled: string;
      };
      overlay: string;
    };
  }

  interface PaletteOptions extends DeepPartial<Palette> {}

  interface CssVarsPalette {
    neutral: PaletteColorChannel;
  }

  interface PaletteCommonChannel {
    blackChannel: string;
    whiteChannel: string;
  }

  interface PaletteTextChannel {
    disabledChannel: string;
  }

  interface PaletteActionChannel {
    disabledChannel: string;
    hoverChannel: string;
    focusChannel: string;
    disabledBackgroundChannel: string;
  }

  interface TypeBackground {
    elevation1: string;
    elevation2: string;
    elevation3: string;
    elevation4: string;
    menu: string;
    menuElevation1: string;
    menuElevation2: string;
    elevation1Channel: string;
    elevation2Channel: string;
    elevation3Channel: string;
    elevation4Channel: string;
    menuChannel: string;
    menuElevation1Channel: string;
    menuElevation2Channel: string;
  }
}

/**
 * Create palette based on color scheme
 */
export const createPalette = (mode: 'light' | 'dark'): PaletteOptions => {
  return mode === 'light' ? lightPalette : darkPalette;
};

// Export individual palettes
export { lightPalette, darkPalette };
export * from './colors';
