import { createTheme } from '@mui/material/styles';
import * as tokens from '../tokens';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: tokens.ColorPrimaryLight,
      light: tokens.ColorPrimaryLight,
      dark: tokens.ColorPrimaryMain,
    },
    secondary: {
      main: tokens.ColorSecondaryLight,
      light: tokens.ColorSecondaryLight,
      dark: tokens.ColorSecondaryMain,
    },
    success: {
      main: tokens.ColorSuccessMain,
    },
    error: {
      main: tokens.ColorErrorMain,
    },
    warning: {
      main: tokens.ColorWarningMain,
    },
    info: {
      main: tokens.ColorInfoMain,
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: tokens.TypographyFontFamilyBase,
    fontSize: parseInt(tokens.TypographyFontSizeMd),
    fontWeightRegular: parseInt(tokens.TypographyFontWeightRegular),
    fontWeightMedium: parseInt(tokens.TypographyFontWeightMedium),
    fontWeightBold: parseInt(tokens.TypographyFontWeightBold),
    button: {
      textTransform: 'none',
      fontWeight: parseInt(tokens.TypographyFontWeightMedium),
    },
  },
  spacing: parseInt(tokens.SpacingSm),
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: parseInt(tokens.TypographyFontWeightMedium),
        },
        contained: {
          boxShadow: 'none',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
  },
});
