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
    grey: {
      50: tokens.ColorGrey50,
      100: tokens.ColorGrey100,
      200: tokens.ColorGrey200,
      300: tokens.ColorGrey300,
      400: tokens.ColorGrey400,
      500: tokens.ColorGrey500,
      600: tokens.ColorGrey600,
      700: tokens.ColorGrey700,
      800: tokens.ColorGrey800,
      900: tokens.ColorGrey900,
    },
    background: {
      default: tokens.ColorBackgroundDefault,
      paper: tokens.ColorBackgroundPaper,
    },
  },
  typography: {
    fontFamily: tokens.TypographyFontFamilyBase,
    fontSize: parseInt(tokens.TypographyFontSizeMd),
    fontWeightLight: parseInt(tokens.TypographyFontWeightLight),
    fontWeightRegular: parseInt(tokens.TypographyFontWeightRegular),
    fontWeightMedium: parseInt(tokens.TypographyFontWeightMedium),
    fontWeightBold: parseInt(tokens.TypographyFontWeightBold),
    h1: {
      fontSize: tokens.TypographyFontSizeXxxl + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
      lineHeight: 1.2,
    },
    h2: {
      fontSize: tokens.TypographyFontSizeXxl + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
      lineHeight: 1.3,
    },
    h3: {
      fontSize: tokens.TypographyFontSizeXl + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
      lineHeight: 1.3,
    },
    h4: {
      fontSize: tokens.TypographyFontSizeLg + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
      lineHeight: 1.4,
    },
    h5: {
      fontSize: tokens.TypographyFontSizeMd + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
      lineHeight: 1.4,
    },
    h6: {
      fontSize: tokens.TypographyFontSizeSm + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
      lineHeight: 1.5,
    },
    body1: {
      fontSize: tokens.TypographyFontSizeMd + 'px',
      lineHeight: 1.5,
    },
    body2: {
      fontSize: tokens.TypographyFontSizeSm + 'px',
      lineHeight: 1.5,
    },
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
          padding: `${tokens.SpacingSm}px ${tokens.SpacingMd}px`,
        },
        contained: {
          boxShadow: tokens.ShadowSm,
          '&:hover': {
            boxShadow: tokens.ShadowMd,
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
          borderRadius: parseInt(tokens.BorderRadiusLg),
          boxShadow: tokens.ShadowMd,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: parseInt(tokens.BorderRadiusLg),
          boxShadow: tokens.ShadowXl,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: parseInt(tokens.BorderRadiusMd),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusSm),
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
          boxShadow: tokens.ShadowSm,
        },
        elevation2: {
          boxShadow: tokens.ShadowMd,
        },
        elevation3: {
          boxShadow: tokens.ShadowLg,
        },
        rounded: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.ColorGrey200}`,
        },
        head: {
          fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
          backgroundColor: tokens.ColorGrey50,
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
          boxShadow: tokens.ShadowSm,
        },
      },
    },
  },
});
