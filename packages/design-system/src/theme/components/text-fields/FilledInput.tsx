import {
  ComponentsVariants,
  FilledInputProps,
  Theme,
  autocompleteClasses,
  filledInputClasses,
  inputBaseClasses,
} from "@mui/material";
import { Components } from "@mui/material/styles";
import { PaletteColorKey } from "../../palette";

// Consistent input sizing tokens (shared with OutlinedInput)
// Compact values for denser layouts
const inputTokens = {
  padding: {
    sm: { y: 6, x: 10 }, // Reduced from 8/12
    md: { y: 8, x: 12 }, // Reduced from 10/14
    lg: { y: 10, x: 14 }, // Reduced from 12/16
  },
  fontSize: {
    sm: 12, // Reduced from 13
    md: 13, // Reduced from 14
    lg: 14, // Reduced from 15
  },
  borderRadius: {
    sm: 4, // Reduced from 6
    md: 6, // Reduced from 8
    lg: 8, // Reduced from 10
  },
};

const filledInputColors: PaletteColorKey[] = [
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
];

const filledInputCustomVariants: ComponentsVariants["MuiFilledInput"] =
  filledInputColors.map((color) => ({
    props: { color: color as FilledInputProps["color"] },
    style: (style) => {
      const theme = style.theme as Theme;
      const paletteColor = theme.vars.palette[color];

      return {
        [`&.${filledInputClasses.focused}`]: {
          backgroundColor: paletteColor.lighter,
          boxShadow: `0 0 0 1px ${paletteColor.main}`,
        },
      };
    },
  }));

export const FilledInput: Components<
  Omit<Theme, "components">
>["MuiFilledInput"] = {
  variants: [
    ...filledInputCustomVariants,
    {
      props: { size: "large" },
      style: {
        borderRadius: inputTokens.borderRadius.lg,
        [`& .${filledInputClasses.input}`]: {
          paddingTop: inputTokens.padding.lg.y,
          paddingBottom: inputTokens.padding.lg.y,
          fontSize: inputTokens.fontSize.lg,
          paddingRight: `${inputTokens.padding.lg.x}px !important`,
        },
        [`&:not(.${inputBaseClasses.adornedStart}) > .${inputBaseClasses.input}`]:
          {
            paddingLeft: `${inputTokens.padding.lg.x}px !important`,
            [`&.${autocompleteClasses.input}`]: {
              paddingLeft: "0px !important",
            },
          },
      },
    },
  ],
  styleOverrides: {
    root: ({ theme }) => [
      {
        borderRadius: inputTokens.borderRadius.md,
        backgroundColor: theme.vars.palette.background.elevation2,
        "&:hover": {
          backgroundColor: theme.vars.palette.background.elevation3,
        },
        "&:before, &:after": {
          display: "none",
        },
        [`&.${filledInputClasses.focused}`]: {
          backgroundColor: theme.vars.palette.secondary.lighter,
          boxShadow: `0 0 0 1px ${theme.vars.palette.primary.main}`,
        },
        [`&.${filledInputClasses.error}`]: {
          backgroundColor: theme.vars.palette.error.lighter,
          boxShadow: `0 0 0 1px ${theme.vars.palette.error.main}`,
        },
        [`&.${filledInputClasses.disabled}`]: {
          backgroundColor: theme.vars.palette.action.disabledBackground,
        },
        [`&.${inputBaseClasses.multiline}`]: {
          paddingLeft: 0,
          paddingRight: 0,
        },
      },
    ],
    input: () => ({
      paddingTop: inputTokens.padding.md.y,
      paddingBottom: inputTokens.padding.md.y,
      fontSize: inputTokens.fontSize.md,
      lineHeight: 1.5,
      [`&:not(.${inputBaseClasses.adornedStart} > .${inputBaseClasses.input})`]:
        {
          paddingLeft: inputTokens.padding.md.x,
          paddingRight: inputTokens.padding.md.x,
        },
      "&:-webkit-autofill": {
        borderRadius: "inherit",
      },
    }),
    sizeSmall: {
      borderRadius: inputTokens.borderRadius.sm,
      [`&.${inputBaseClasses.sizeSmall} > .${inputBaseClasses.input}`]: {
        paddingTop: inputTokens.padding.sm.y,
        paddingBottom: inputTokens.padding.sm.y,
        fontSize: inputTokens.fontSize.sm,
        [`&:not(.${inputBaseClasses.adornedStart} > .${inputBaseClasses.input})`]:
          {
            paddingLeft: inputTokens.padding.sm.x,
            paddingRight: inputTokens.padding.sm.x,
          },
      },
    },
    multiline: {
      [`& .${filledInputClasses.input}`]: {
        padding: 0,
      },
    },
    adornedStart: {
      paddingLeft: inputTokens.padding.md.x,
      [`&.${inputBaseClasses.sizeSmall}`]: {
        paddingLeft: inputTokens.padding.sm.x,
      },
      [`&.MuiInputBase-sizeLarge`]: {
        paddingLeft: inputTokens.padding.lg.x,
      },
    },
  },
};

export default FilledInput;
