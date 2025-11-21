import { Paper, Stack, Typography } from '@mui/material';
import { ReactNode } from 'react';

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
}

export const ChartCard = ({ title, subtitle, action, legend, children }: ChartCardProps) => {
  return (
    <Paper sx={{ p: { xs: 3, md: 5 }, height: 1 }}>
      <Stack direction="column" sx={{ rowGap: 4, height: 1 }}>
        <Stack
          sx={{
            columnGap: { xs: 5, lg: 2, xl: 5 },
            rowGap: 3,
            flexWrap: { xs: 'wrap', sm: 'nowrap' },
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Typography variant="h6" mb={1}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </div>

          {legend && (
            <Stack
              sx={{
                flex: 1,
                flexBasis: { xs: '100%', sm: 0 },
                order: { xs: 1, sm: 0 },
                alignSelf: 'flex-end',
                gap: 2,
              }}
            >
              {legend}
            </Stack>
          )}

          {action}
        </Stack>

        {children}
      </Stack>
    </Paper>
  );
};
