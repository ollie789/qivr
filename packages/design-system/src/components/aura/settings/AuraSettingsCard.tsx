import { auraTokens } from "../../../theme/auraTokens";
import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { glassCard } from '../../../styles/glassmorphism';

interface AuraSettingsCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const AuraSettingsCard: React.FC<AuraSettingsCardProps> = ({
  title,
  description,
  icon,
  children,
}) => {
  return (
    <Box sx={{ ...glassCard, p: auraTokens.spacing.lg }}>
      <Stack spacing={3}>
        <Stack direction="row" spacing={2} alignItems="center">
          {icon && (
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: auraTokens.borderRadius.md,
                bgcolor: "primary.main",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {icon}
            </Box>
          )}
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
            {description && (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            )}
          </Box>
        </Stack>
        <Box>{children}</Box>
      </Stack>
    </Box>
  );
};
