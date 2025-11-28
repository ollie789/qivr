import { glassTokens } from "../../theme/auraTokens";
import { resolveThemeColor } from "../../theme/utils";
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
  const accentColor = resolveThemeColor(color || 'primary.main', theme);

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
        p: 2.5,
        position: "relative",
        overflow: "hidden",
        transition: "all 0.2s ease-in-out",
        // Fixed minimum height for consistent card sizing
        minHeight: 140,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
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

      <Stack spacing={1.5} sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
        {/* Header row - icon and title */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: alpha(accentColor, 0.1),
              color: accentColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              "& svg": { fontSize: 20 },
            }}
          >
            {icon}
          </Box>
        </Stack>

        {/* Value - prominent display */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              lineHeight: 1.2,
              fontSize: { xs: '1.75rem', sm: '2rem' },
            }}
          >
            {value}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={500}
            sx={{
              mt: 0.5,
              letterSpacing: 0.2,
              fontSize: "0.813rem",
              lineHeight: 1.4,
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Trend indicator */}
        {trend && (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.25,
                px: 0.75,
                py: 0.25,
                borderRadius: 1,
                bgcolor: trend.isPositive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
              }}
            >
              {trend.isPositive ? (
                <TrendingUp sx={{ fontSize: 14, color: "success.main" }} />
              ) : (
                <TrendingDown sx={{ fontSize: 14, color: "error.main" }} />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: trend.isPositive ? "success.main" : "error.main",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              >
                {Math.abs(trend.value)}%
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                fontSize: "0.75rem",
              }}
            >
              {trend.label || "vs last period"}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};
