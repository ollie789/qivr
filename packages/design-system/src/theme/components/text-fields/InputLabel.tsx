import { Theme, inputLabelClasses } from "@mui/material";
import { Components } from "@mui/material/styles";

declare module "@mui/material/InputLabel" {
  interface InputLabelPropsSizeOverrides {
    large: true;
  }
}

const InputLabel: Components<Omit<Theme, "components">>["MuiInputLabel"] = {
  styleOverrides: {
    root: {
      fontSize: "14px",
    },

    // Filled variant: Label sits ABOVE the input (static positioning)
    filled: ({ theme }) => {
      return {
        position: "static",
        transform: "none",
        marginBottom: theme.spacing(0.5),
        marginLeft: theme.spacing(1.75),
        fontSize: "12px",
        fontWeight: theme.typography.fontWeightMedium,
        lineHeight: 1.3,
        [`&.${inputLabelClasses.shrink}`]: {
          transform: "none",
        },
        [`&.${inputLabelClasses.sizeSmall}`]: {
          marginLeft: theme.spacing(1.5),
        },
        "&.MuiInputLabel-sizeLarge": {
          marginLeft: theme.spacing(2),
          fontSize: "13px",
        },
      };
    },
    // Outlined variant: Label sits ABOVE the input (static positioning)
    outlined: ({ theme }) => {
      return {
        position: "static",
        transform: "none",
        marginBottom: theme.spacing(0.5),
        marginLeft: theme.spacing(1.75),
        fontSize: "12px",
        fontWeight: theme.typography.fontWeightMedium,
        lineHeight: 1.3,
        [`&.${inputLabelClasses.shrink}`]: {
          transform: "none",
        },
        [`&.${inputLabelClasses.sizeSmall}`]: {
          marginLeft: theme.spacing(1.5),
        },
        "&.MuiInputLabel-sizeLarge": {
          marginLeft: theme.spacing(2),
          fontSize: "13px",
        },
      };
    },
    // Standard variant: Label sits ABOVE the input (static positioning)
    standard: ({ theme }) => {
      return {
        position: "static",
        transform: "none",
        marginBottom: theme.spacing(0.5),
        fontSize: "12px",
        fontWeight: theme.typography.fontWeightMedium,
        lineHeight: 1.3,
        [`&.${inputLabelClasses.shrink}`]: {
          transform: "none",
        },
      };
    },
  },
};

export default InputLabel;
