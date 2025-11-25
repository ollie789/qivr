import { glassCard } from "@qivr/design-system";

export const auraComponentOverrides = {
  MuiPaper: {
    styleOverrides: {
      root: {
        ...glassCard,
        backgroundImage: "none",
      },
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        ...glassCard,
        backgroundImage: "none",
      },
    },
  },
};
