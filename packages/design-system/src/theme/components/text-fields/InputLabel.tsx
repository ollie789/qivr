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
      variants: [
        {
          props: { variant: "standard" },
          style: {
            transform: "translate(2px,14px) scale(1)",
          },
        },
      ],
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
    outlined: () => {
      return {
        lineHeight: 1.3,
        transform: "translate(16px, 12px) scale(1)",
        [`&.${inputLabelClasses.shrink}`]: {
          fontWeight: 500,
          transform: "translate(16px, -7px) scale(.85)",
        },
        [`&.${inputLabelClasses.sizeSmall}`]: {
          transform: "translate(12px, 8px) scale(1)",
          [`&.${inputLabelClasses.shrink}`]: {
            transform: "translate(12px, -7px) scale(.85)",
          },
        },
        "&.MuiInputLabel-sizeLarge": {
          transform: "translate(20px, 14px) scale(1)",
          [`&.${inputLabelClasses.shrink}`]: {
            transform: "translate(20px, -7px) scale(.75)",
          },
        },
      };
    },
    standard: () => {
      return {
        [`&.${inputLabelClasses.shrink}`]: {
          transform: "translate(0, 0) scale(.75)",
        },
      };
    },
  },
};

export default InputLabel;
