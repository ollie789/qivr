import { auraTokens } from "../../../theme/auraTokens";
import React from "react";
import { Box, Typography, Stack, IconButton } from "@mui/material";
import { MoreVert } from "@mui/icons-material";
import { glassCard } from '../../../styles/glassmorphism';

interface AuraGlassChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}

export const AuraGlassChartCard: React.FC<AuraGlassChartCardProps> = ({
  title,
  subtitle,
  children,
  action,
}) => {
  return (
    <Box
      sx={{
        ...glassCard,
        p: auraTokens.spacing.lg,
        height: "100%",
      }}
    >
      <Stack spacing={3}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" fontWeight={700}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action || (
            <IconButton size="small" sx={{ opacity: 0.6 }}>
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Box>{children}</Box>
      </Stack>
    </Box>
  );
};
