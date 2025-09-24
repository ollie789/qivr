import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Stack,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon } from '@mui/icons-material';
import { useAnalyticsDashboardData } from '../hooks/useAnalyticsDashboardData';
import type { HealthGoal, HealthMetric } from '../../../types';

const formatMetricValue = (metric: HealthMetric) => {
  const value = metric.value.toLocaleString();
  return metric.unit ? `${value} ${metric.unit}` : value;
};

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30days');
  const { healthMetrics, promAnalytics, healthGoals, correlations, loading } =
    useAnalyticsDashboardData(timeRange);

  const topMetrics = useMemo(() => healthMetrics.slice(0, 3), [healthMetrics]);
  const topGoals = useMemo(() => healthGoals.slice(0, 3), [healthGoals]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ xs: 'stretch', md: 'center' }} sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Health Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Snapshot of key metrics, PROM performance, and active goals.
          </Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="analytics-range-label">Time Range</InputLabel>
          <Select
            labelId="analytics-range-label"
            value={timeRange}
            label="Time Range"
            onChange={(event) => setTimeRange(event.target.value)}
          >
            <MenuItem value="7days">Last 7 days</MenuItem>
            <MenuItem value="30days">Last 30 days</MenuItem>
            <MenuItem value="90days">Last 90 days</MenuItem>
            <MenuItem value="1year">Last year</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {loading ? (
        <LinearProgress />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                {topMetrics.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No metrics available.
                  </Typography>
                ) : (
                  <List>
                    {topMetrics.map((metric) => (
                      <React.Fragment key={metric.id}>
                        <ListItem>
                          <ListItemText
                            primary={metric.name}
                            secondary={formatMetricValue(metric)}
                          />
                          <ListItemSecondaryAction>
                            <Chip
                              size="small"
                              icon={
                                metric.trend === 'up' ? <TrendingUpIcon /> :
                                metric.trend === 'down' ? <TrendingDownIcon /> : undefined
                              }
                              label={`${metric.percentageChange > 0 ? '+' : ''}${metric.percentageChange}%`}
                              color={metric.status === 'good' ? 'success' : metric.status === 'warning' ? 'warning' : 'error'}
                            />
                          </ListItemSecondaryAction>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>PROM Performance</Typography>
                {promAnalytics.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No PROM analytics available.
                  </Typography>
                ) : (
                  <List>
                    {promAnalytics.slice(0, 3).map((prom) => (
                      <React.Fragment key={prom.templateName}>
                        <ListItem>
                          <ListItemText
                            primary={prom.templateName}
                            secondary={`Completion ${prom.completionRate}% • Average score ${prom.averageScore}%`}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Active Goals</Typography>
                {topGoals.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No goals defined.
                  </Typography>
                ) : (
                  <List>
                    {topGoals.map((goal: HealthGoal) => (
                      <React.Fragment key={goal.id}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={goal.title}
                            secondary={`${goal.current}/${goal.target} ${goal.unit} • ${goal.status}`}
                          />
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
                {healthGoals.length > 3 && (
                  <Button sx={{ mt: 2 }} size="small">View all goals</Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>Correlations</Typography>
        {correlations.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No correlations available.
          </Typography>
        ) : (
          <List>
            {correlations.slice(0, 5).map((correlation) => (
              <React.Fragment key={`${correlation.metric1}-${correlation.metric2}`}>
                <ListItem>
                  <ListItemText
                    primary={`${correlation.metric1} ↔ ${correlation.metric2}`}
                    secondary={`Correlation ${correlation.correlation.toFixed(2)} • ${correlation.significance} significance`}
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsPage;
