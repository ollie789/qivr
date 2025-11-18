import { createTheme } from '@mui/material/styles';
import * as tokens from '../tokens';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: tokens.ColorPrimaryLight,
      light: tokens.ColorPrimary100,
      dark: tokens.ColorPrimaryMain,
    },
    secondary: {
      main: tokens.ColorSecondaryLight,
      light: tokens.ColorSecondaryLight,
      dark: tokens.ColorSecondaryMain,
    },
    success: {
      main: tokens.ColorSuccessMain,
      light: tokens.ColorSuccessLight,
      dark: tokens.ColorSuccessDark,
    },
    error: {
      main: tokens.ColorErrorMain,
      light: tokens.ColorErrorLight,
      dark: tokens.ColorErrorDark,
    },
    warning: {
      main: tokens.ColorWarningMain,
      light: tokens.ColorWarningLight,
      dark: tokens.ColorWarningDark,
    },
    info: {
      main: tokens.ColorInfoMain,
      light: tokens.ColorInfoLight,
      dark: tokens.ColorInfoDark,
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
    borderRadius: parseInt(tokens.BorderRadiusMd),
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: parseInt(tokens.BorderRadiusMd),
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
          borderRadius: parseInt(tokens.BorderRadiusLg),
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
