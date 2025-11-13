import React from 'react';
import {
  Avatar,
  Box,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import type { SxProps, Theme } from '@mui/material/styles';
import type { StatCardItem } from '../types';
import { QivrCard } from '@qivr/design-system';

export interface StatCardGridProps {
  items: StatCardItem[];
  loading?: boolean;
  skeletonCount?: number;
  itemSizes?: Partial<Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', number>>;
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
            <Grid item key={`stat-skeleton-${index}`} {...itemSizes}>
              <QivrCard elevated>
                <CardContent>
                  <Skeleton variant="rectangular" height={80} />
                </CardContent>
              </QivrCard>
            </Grid>
          ))
        : items.map((item) => {
            const hasChange = item.change !== undefined || item.changeLabel !== undefined;
            const changeValue = typeof item.change === 'number' ? item.change : undefined;
            const isPositive = changeValue === undefined ? true : changeValue >= 0;
            const chipColor: 'success' | 'error' = isPositive ? 'success' : 'error';
            const chipLabel =
              item.changeLabel ??
              (changeValue !== undefined ? `${Math.abs(changeValue).toFixed(1)}%` : undefined);

            return (
              <Grid item key={item.id} {...itemSizes}>
                <QivrCard elevated>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">
                          {item.title}
                        </Typography>
                        <Typography variant="h5">{item.value}</Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: item.avatarColor ?? 'primary.main' }}>
                        {item.icon}
                      </Avatar>
                    </Box>
                    {hasChange && chipLabel ? (
                      <Chip
                        size="small"
                        color={chipColor}
                        icon={isPositive ? <TrendingUpIcon /> : <TrendingDownIcon />}
                        label={chipLabel}
                        variant="outlined"
                        sx={{ mt: 2 }}
                      />
                    ) : null}
                  </CardContent>
                </QivrCard>
              </Grid>
            );
          })}
    </Grid>
  );
};

export default StatCardGrid;
