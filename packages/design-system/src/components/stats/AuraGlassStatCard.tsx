import { auraTokens, glassTokens } from "../../theme/auraTokens";
import React from "react";
import { Box, Typography, Stack, alpha, useTheme } from "@mui/material";
import { TrendingUp, TrendingDown } from "@mui/icons-material";

interface AuraGlassStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  color?: string;
}

export const AuraGlassStatCard: React.FC<AuraGlassStatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color,
}) => {
  const theme = useTheme();
  const accentColor = color || theme.palette.primary.main;

  return (
    <Box
      sx={{
        // Glass effect - clean, consistent
        bgcolor: 'background.paper',
        backdropFilter: `blur(${glassTokens.blur.standard})`,
        WebkitBackdropFilter: `blur(${glassTokens.blur.standard})`,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        p: 3,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: glassTokens.shadow.standard,
          borderColor: alpha(accentColor, 0.3),
        },
      }}
    >
      {/* Subtle accent gradient in corner */}
      <Box
        sx={{
          position: "absolute",
          top: -40,
          right: -40,
          width: 120,
          height: 120,
          background: `radial-gradient(circle, ${alpha(accentColor, 0.08)} 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <Stack spacing={1.5}>
        {/* Header row */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            sx={{ letterSpacing: 0.2 }}
          >
            {title}
          </Typography>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(accentColor, 0.1),
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              "& svg": { fontSize: 20 },
            }}
          >
            {icon}
          </Box>
        </Stack>

        {/* Value */}
        <Typography variant="h4" fontWeight={700} sx={{ lineHeight: 1.2 }}>
          {value}
        </Typography>

        {/* Trend indicator */}
        {trend && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {trend.isPositive ? (
              <TrendingUp sx={{ fontSize: 16, color: "success.main" }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: "error.main" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend.isPositive ? "success.main" : "error.main",
                fontWeight: 600,
              }}
            >
              {Math.abs(trend.value)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {trend.label || "vs last period"}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};
