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
    background: {
      default: tokens.ColorBackgroundDefault,
      paper: tokens.ColorBackgroundPaper,
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
    divider: tokens.ColorDivider,
  },
  typography: {
    fontFamily: tokens.TypographyFontFamilyBase,
    fontSize: parseInt(tokens.TypographyFontSizeSm),
    fontWeightRegular: parseInt(tokens.TypographyFontWeightRegular),
    fontWeightMedium: parseInt(tokens.TypographyFontWeightMedium),
    fontWeightBold: parseInt(tokens.TypographyFontWeightBold),
    h1: {
      fontSize: '2.5rem',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
      lineHeight: parseFloat(tokens.TypographyLineHeightTight),
    },
    h2: {
      fontSize: '2rem',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
      lineHeight: parseFloat(tokens.TypographyLineHeightTight),
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
      lineHeight: parseFloat(tokens.TypographyLineHeightTight),
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: parseInt(tokens.TypographyFontWeightMedium),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: parseInt(tokens.TypographyFontWeightMedium),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
    h6: {
      fontSize: '1rem',
      fontWeight: parseInt(tokens.TypographyFontWeightBold),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: parseInt(tokens.TypographyFontWeightMedium),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
    subtitle2: {
      fontSize: tokens.TypographyFontSizeSm + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
    body1: {
      fontSize: '1rem',
      fontWeight: parseInt(tokens.TypographyFontWeightRegular),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
    body2: {
      fontSize: tokens.TypographyFontSizeSm + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightRegular),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
    button: {
      textTransform: 'none',
      fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
    },
    caption: {
      fontSize: tokens.TypographyFontSizeXs + 'px',
      fontWeight: parseInt(tokens.TypographyFontWeightRegular),
      lineHeight: parseFloat(tokens.TypographyLineHeightNormal),
    },
  },
  spacing: parseInt(tokens.SpacingSm),
  shape: {
    borderRadius: parseInt(tokens.BorderRadiusMd),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: parseInt(tokens.BorderRadiusMd),
          fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
          padding: `${tokens.SpacingSm}px ${tokens.SpacingLg}px`,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        sizeSmall: {
          padding: `${tokens.SpacingXs}px ${tokens.SpacingMd}px`,
          fontSize: tokens.TypographyFontSizeSm + 'px',
        },
        sizeLarge: {
          padding: `${tokens.SpacingSm}px ${tokens.SpacingXl}px`,
          fontSize: tokens.TypographyFontSizeMd + 'px',
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
        elevation: {
          boxShadow: 'none',
          border: '1px solid',
          borderColor: tokens.ColorDivider,
        },
        elevation1: {
          boxShadow: 'none',
        },
        elevation2: {
          boxShadow: 'none',
        },
        elevation3: {
          boxShadow: 'none',
        },
        rounded: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
          border: '1px solid',
          borderColor: tokens.ColorDivider,
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: parseInt(tokens.BorderRadiusLg),
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontWeight: parseInt(tokens.TypographyFontWeightBold),
          fontSize: '1.25rem',
          padding: `${tokens.SpacingLg}px ${tokens.SpacingLg}px ${tokens.SpacingMd}px`,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          padding: `${tokens.SpacingMd}px ${tokens.SpacingLg}px`,
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          padding: `${tokens.SpacingMd}px ${tokens.SpacingLg}px ${tokens.SpacingLg}px`,
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontWeight: parseInt(tokens.TypographyFontWeightMedium),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusSm) + 2,
          fontWeight: parseInt(tokens.TypographyFontWeightMedium),
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
    MuiList: {
      styleOverrides: {
        root: {
          padding: 0,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.ColorDivider}`,
        },
        head: {
          fontWeight: parseInt(tokens.TypographyFontWeightBold),
          backgroundColor: tokens.ColorGrey50,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: `1px solid ${tokens.ColorDivider}`,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: `1px solid ${tokens.ColorDivider}`,
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: tokens.ColorDivider,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: parseInt(tokens.TypographyFontWeightSemibold),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
          fontSize: tokens.TypographyFontSizeSm + 'px',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusSm),
          margin: `0 ${tokens.SpacingXs}px`,
        },
      },
    },
  },
});
