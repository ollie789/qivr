import React from "react";
import { Grid, Skeleton, Paper } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { StatCardItem } from "../types";
import { StatCard } from "@qivr/design-system";

export interface StatCardGridProps {
  items: StatCardItem[];
  loading?: boolean;
  skeletonCount?: number;
  itemSizes?: Partial<Record<"xs" | "sm" | "md" | "lg" | "xl", number>>;
  spacing?: number;
  sx?: SxProps<Theme>;
}

const StatCardGrid: React.FC<StatCardGridProps> = ({
  items,
  loading = false,
  skeletonCount,
  itemSizes = { xs: 12, sm: 6, md: 3 },
  spacing = 3,
  sx,
}) => {
  const placeholders = skeletonCount ?? items.length;

  if (!loading && items.length === 0) {
    return null;
  }

  return (
    <Grid container spacing={spacing} sx={sx}>
      {loading
        ? Array.from({ length: placeholders }).map((_, index) => (
            <Grid key={`stat-skeleton-${index}`} size={itemSizes}>
              <Paper elevation={2} sx={{ p: 2 }}>
                <Skeleton variant="rectangular" height={80} />
              </Paper>
            </Grid>
          ))
        : items.map((item) => (
            <Grid key={item.id} size={itemSizes}>
              <StatCard
                label={item.title}
                value={item.value}
                icon={item.icon}
                iconColor={item.avatarColor}
              />
            </Grid>
          ))}
    </Grid>
  );
};

export default StatCardGrid;
