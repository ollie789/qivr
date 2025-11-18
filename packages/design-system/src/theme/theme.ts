import { createTheme } from '@mui/material/styles';
import * as tokens from '../tokens';

export const theme = createTheme({
  palette: {
    primary: {
      main: tokens.ColorPrimaryMain,
      light: tokens.ColorPrimaryLight,
      dark: tokens.ColorPrimaryDark,
    },
    secondary: {
      main: tokens.ColorSecondaryMain,
      light: tokens.ColorSecondaryLight,
      dark: tokens.ColorSecondaryDark,
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
  spacing: 8,
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 500,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
  },
});
