import { glassTokens } from "../../theme/auraTokens";
import React from "react";
import { Box, Typography, Stack, IconButton, Paper, SxProps, Theme } from "@mui/material";
import { MoreVert } from "@mui/icons-material";

interface AuraGlassChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  sx?: SxProps<Theme>;
}

export const AuraGlassChartCard: React.FC<AuraGlassChartCardProps> = ({
  title,
  subtitle,
  children,
  action,
  sx,
}) => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: "100%",
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          boxShadow: glassTokens.shadow.standard,
        },
        ...sx,
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h6" fontWeight={600}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action || (
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <MoreVert fontSize="small" />
            </IconButton>
          )}
        </Stack>

        <Box>{children}</Box>
      </Stack>
    </Paper>
  );
};
