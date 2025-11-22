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
  transitions: {
    duration: {
      shortest: parseInt(tokens.TransitionDurationFast),
      shorter: parseInt(tokens.TransitionDurationNormal),
      short: 250,
      standard: parseInt(tokens.TransitionDurationSlow),
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195,
    },
    easing: {
      easeInOut: tokens.TransitionEasingStandard,
      easeOut: tokens.TransitionEasingEaseOut,
      easeIn: tokens.TransitionEasingEaseIn,
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        // Smooth autofill transitions
        'input:-webkit-autofill': {
          transition: 'background-color 5000s ease-in-out 0s',
        },
        'input:-webkit-autofill:hover': {
          transition: 'background-color 5000s ease-in-out 0s',
        },
        'input:-webkit-autofill:focus': {
          transition: 'background-color 5000s ease-in-out 0s',
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
          transition: `all ${tokens.TransitionDurationNormal}ms ${tokens.TransitionEasingStandard}`,
          '&:hover': {
            transform: `translateY(${tokens.AnimationHoverLift})`,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: tokens.AnimationShadowHover,
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
          transition: `all ${tokens.TransitionDurationNormal}ms ${tokens.TransitionEasingStandard}`,
          '&:hover': {
            backgroundColor: tokens.ColorGrey100,
            transform: `scale(${tokens.AnimationHoverScale})`,
          },
        },
      },
    },
    MuiPaper: {
      variants: [
        {
          props: { variant: 'elevation' as any },
          style: {
            boxShadow: 'none',
            border: '1px solid',
            borderColor: tokens.ColorDivider,
          },
        },
      ],
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          transition: `all ${tokens.TransitionDurationNormal}ms ${tokens.TransitionEasingStandard}`,
        },
        elevation: {
          boxShadow: 'none',
          border: '1px solid',
          borderColor: tokens.ColorDivider,
          '&:hover': {
            borderColor: tokens.ColorGrey300,
          },
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
          transition: `all ${tokens.TransitionDurationNormal}ms ${tokens.TransitionEasingStandard}`,
          '&:hover': {
            borderColor: tokens.ColorGrey300,
            transform: `translateY(${tokens.AnimationHoverLiftCard})`,
            boxShadow: tokens.AnimationShadowCard,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: parseInt(tokens.BorderRadiusLg),
          boxShadow: tokens.AnimationShadowDialog,
          backgroundColor: tokens.GlassBackgroundLight,
          backdropFilter: `blur(${tokens.GlassBlurMd})`,
          border: `1px solid ${tokens.GlassBorder}`,
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.BackdropBackground,
          backdropFilter: `blur(${tokens.BackdropBlur})`,
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
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: tokens.ColorGrey400,
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
              },
            },
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        clickable: {
          '&:hover': {
            backgroundColor: tokens.ColorGrey200,
          },
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
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backgroundColor: tokens.ColorGrey100,
            transform: 'translateX(4px)',
          },
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
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            color: tokens.ColorPrimaryMain,
          },
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
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
          fontSize: tokens.TypographyFontSizeSm + 'px',
          backgroundColor: tokens.ColorGrey800,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: parseInt(tokens.BorderRadiusMd),
          boxShadow: tokens.AnimationShadowMenu,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: parseInt(tokens.BorderRadiusSm),
          margin: `0 ${tokens.SpacingXs}px`,
          transition: `all ${tokens.TransitionDurationNormal}ms ${tokens.TransitionEasingStandard}`,
          '&:hover': {
            backgroundColor: tokens.ColorGrey100,
            transform: `translateX(${tokens.AnimationHoverSlide})`,
          },
        },
      },
    },
  },
});
