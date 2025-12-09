import React from "react";
import { Box } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { AuroraPageLoader } from "@qivr/design-system";
import { fetchProfile } from "../services/profileApi";
import { HealthDetailsWizard } from "../features/onboarding";

export const Onboarding: React.FC = () => {
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  if (isLoading) {
    return <AuroraPageLoader sx={{ height: "100vh" }} />;
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        Failed to load profile. Please refresh the page.
      </Box>
    );
  }

  return <HealthDetailsWizard profile={profile} />;
};

export default Onboarding;
