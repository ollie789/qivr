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
    h1: {
      fontSize: tokens.TypographyFontSizeXxl + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
    },
    h2: {
      fontSize: tokens.TypographyFontSizeXl + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
    },
    h3: {
      fontSize: tokens.TypographyFontSizeLg + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
    },
    h4: {
      fontSize: tokens.TypographyFontSizeMd + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
    },
    h5: {
      fontSize: tokens.TypographyFontSizeSm + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
    },
    h6: {
      fontSize: tokens.TypographyFontSizeXs + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
    },
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
          padding: `${tokens.SpacingXs}px ${tokens.SpacingMd}px`,
        },
        contained: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
          '&:hover': {
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          },
        },
        sizeSmall: {
          padding: `${tokens.SpacingXs}px ${tokens.SpacingSm}px`,
          fontSize: tokens.TypographyFontSizeSm + 'px',
        },
        sizeLarge: {
          padding: `${tokens.SpacingSm}px ${tokens.SpacingLg}px`,
          fontSize: tokens.TypographyFontSizeLg + 'px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          boxShadow: '0 24px 48px rgba(0,0,0,0.15)',
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
          borderRadius: 4,
          fontWeight: parseInt(tokens.TypographyFontWeightMedium),
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
        elevation2: {
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        },
        elevation3: {
          boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
        },
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e0e0e0',
        },
        head: {
          fontWeight: parseInt(tokens.TypographyFontWeightBold),
          backgroundColor: '#fafafa',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: parseInt(tokens.TypographyFontWeightMedium),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
  },
});
