import {
  experimental_extendTheme as extendTheme,
  type PaletteOptions,
  type ThemeOptions,
} from '@mui/material/styles';
import type { Components } from '@mui/material/styles/components';
import type { TypographyOptions } from '@mui/material/styles/createTypography';
import merge from '../utils/merge';
import { brandPalettes, type BrandName, shape, spacingUnit, typography } from '../tokens';

export interface CreateQivrThemeOptions {
  mode?: 'light' | 'dark';
  brand?: BrandName;
  paletteOverrides?: {
    light?: PaletteOptions;
    dark?: PaletteOptions;
  };
  typographyOverrides?: TypographyOptions;
  components?: Components<Omit<ThemeOptions, 'components'>>;
}

const baseComponents: NonNullable<ThemeOptions['components']> = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      variant: 'contained',
    },
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 600,
        textTransform: 'none',
        paddingInline: spacingUnit * 3,
      },
      sizeSmall: {
        paddingInline: spacingUnit * 2,
        height: 36,
      },
      sizeLarge: {
        paddingInline: spacingUnit * 4,
        height: 48,
      },
    },
  },
  MuiCard: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
        border: '1px solid rgba(15,23,42,0.08)',
      },
    },
  },
  MuiPaper: {
    defaultProps: {
      elevation: 0,
    },
    styleOverrides: {
      root: {
        borderRadius: shape.borderRadius,
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 999,
        fontWeight: 500,
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        backgroundColor: 'var(--mui-palette-background-paper)',
        color: 'var(--mui-palette-text-primary)',
      },
    },
  },
};

export const createQivrTheme = (options: CreateQivrThemeOptions = {}) => {
  const {
    mode = 'light',
    brand = 'clinic',
    paletteOverrides,
    typographyOverrides,
    components,
  } = options;

  const brandPalette = brandPalettes[brand];

  return extendTheme({
    cssVarPrefix: 'qivr',
    colorSchemes: {
      light: {
        palette: {
          ...brandPalette.light,
          ...(paletteOverrides?.light ?? {}),
          mode: 'light',
        },
      },
      dark: {
        palette: {
          ...brandPalette.dark,
          ...(paletteOverrides?.dark ?? {}),
          mode: 'dark',
        },
      },
    },
    typography: merge(typography, typographyOverrides),
    shape,
    spacing: spacingUnit,
    components: merge(baseComponents, components),
  });
};

export type QivrTheme = ReturnType<typeof createQivrTheme>;
