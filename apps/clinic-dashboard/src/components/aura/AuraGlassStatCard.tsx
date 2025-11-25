import React from "react";
import { Box, Typography, Stack } from "@mui/material";
import { TrendingUp, TrendingDown } from "@mui/icons-material";
import { glassCard } from "@qivr/design-system";

interface AuraGlassStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
}

export const AuraGlassStatCard: React.FC<AuraGlassStatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = "#3b82f6",
}) => {
  return (
    <Box
      sx={{
        ...glassCard,
        p: 3,
        position: "relative",
        overflow: "hidden",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
        },
        transition: "all 0.3s ease",
      }}
    >
      {/* Background gradient */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "120px",
          height: "120px",
          background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: `${color}15`,
              color: color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Stack>

        <Typography variant="h3" fontWeight={700}>
          {value}
        </Typography>

        {trend && (
          <Stack direction="row" spacing={0.5} alignItems="center">
            {trend.isPositive ? (
              <TrendingUp sx={{ fontSize: 16, color: "#10b981" }} />
            ) : (
              <TrendingDown sx={{ fontSize: 16, color: "#ef4444" }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend.isPositive ? "#10b981" : "#ef4444",
                fontWeight: 600,
              }}
            >
              {Math.abs(trend.value)}%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              vs last period
            </Typography>
          </Stack>
        )}
      </Stack>
    </Box>
  );
};
