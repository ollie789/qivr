import React, { useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  Calculate as ScoreIcon,
  CheckCircle as CompletedIcon,
  HourglassTop as PendingIcon,
  Timeline as TrendIcon,
  EventAvailable as BookingIcon,
} from '@mui/icons-material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { usePromAnalytics } from '../../context/PromAnalyticsContext';

const statusColors: Record<string, string> = {
  completed: '#4CAF50',
  pending: '#FF9800',
  'in-progress': '#2196F3',
  expired: '#F44336',
};

const formatDate = (value: string) => {
  try {
    return format(parseISO(value), 'MMM d');
  } catch {
    return value;
  }
};

const PromsAnalyticsDashboard: React.FC = () => {
  const { instances, history, stats, templates, bookings } = usePromAnalytics();

  const statusDistribution = useMemo(() => {
    const buckets = new Map<string, { value: number; color: string }>();
    instances.forEach((instance) => {
      const color = statusColors[instance.status] ?? '#999999';
      const bucket = buckets.get(instance.status) ?? { value: 0, color };
      bucket.value += 1;
      buckets.set(instance.status, bucket);
    });

    return Array.from(buckets.entries()).map(([status, bucket]) => ({
      name: status.replace('-', ' '),
      value: bucket.value,
      color: bucket.color,
    }));
  }, [instances]);

  const completionTrend = useMemo(() => {
    const buckets = new Map<string, { count: number; score: number; scoreCount: number }>();

    history.forEach((entry) => {
      const key = formatDate(entry.completedDate);
      const bucket = buckets.get(key) ?? { count: 0, score: 0, scoreCount: 0 };
      bucket.count += 1;
      bucket.score += entry.score;
      bucket.scoreCount += 1;
      buckets.set(key, bucket);
    });

    return Array.from(buckets.entries()).map(([date, values]) => ({
      date,
      completed: values.count,
      averageScore: values.scoreCount > 0 ? Number((values.score / values.scoreCount).toFixed(1)) : 0,
    }));
  }, [history]);

  const templatePerformance = useMemo(() => {
    const grouped = new Map<string, { name: string; completed: number; avgScore: number; count: number }>();

    history.forEach((entry) => {
      const record = grouped.get(entry.templateName) ?? {
        name: entry.templateName,
        completed: 0,
        avgScore: 0,
        count: 0,
      };
      record.completed += 1;
      record.avgScore += entry.score;
      record.count += 1;
      grouped.set(entry.templateName, record);
    });

    return Array.from(grouped.values())
      .map((item) => ({
        ...item,
        avgScore: item.count > 0 ? Number((item.avgScore / item.count).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 5);
  }, [history]);

  const activeTemplateCount = templates.length;

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="h4" gutterBottom>
          PROM Analytics Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor adoption, completion trends, and performance of patient-reported outcome measures.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Active Templates
                  </Typography>
                  <Typography variant="h4">{activeTemplateCount}</Typography>
                </Box>
                <Chip label="Library" color="primary" size="small" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Completed (30d)
                  </Typography>
                  <Typography variant="h4">{history.length}</Typography>
                </Box>
                <CompletedIcon color="success" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Pending Queue
                  </Typography>
                  <Typography variant="h4">{stats.pending}</Typography>
                </Box>
                <PendingIcon color="warning" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Avg. Score
                  </Typography>
                  <Typography variant="h4">{Math.round(stats.averageScore) || '—'}%</Typography>
                </Box>
                <ScoreIcon color="info" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="text.secondary" gutterBottom>
                    Bookings in queue
                  </Typography>
                  <Typography variant="h4">{bookings.filter((booking) => booking.status !== 'completed').length}</Typography>
                </Box>
                <BookingIcon color="secondary" />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Status distribution
              </Typography>
              {instances.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No PROM assignments available.
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie data={statusDistribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                <TrendIcon color="primary" />
                <Typography variant="h6">Completion trend</Typography>
              </Stack>
              {completionTrend.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No completion data recorded yet.
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={completionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <ChartTooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="completed" stroke="#1976d2" strokeWidth={2} name="Completed" />
                    <Line yAxisId="right" type="monotone" dataKey="averageScore" stroke="#2e7d32" strokeWidth={2} name="Avg score" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top performing templates
          </Typography>
          {templatePerformance.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Once patients complete questionnaires, template performance will appear here.
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={templatePerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <ChartTooltip />
                <Legend />
                <Bar dataKey="completed" name="Completions" fill="#1976d2" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgScore" name="Avg score" fill="#66bb6a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Paper sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h6">Upcoming bookings</Typography>
            <Typography variant="body2" color="text.secondary">
              Track follow-up outreach created when PROMs are scheduled
            </Typography>
          </Box>
          <Chip label={`${bookings.length} total`} />
        </Stack>

        {bookings.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No bookings on file.
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ mt: 2 }}>
            {bookings.slice(0, 6).map((booking) => (
              <Paper key={booking.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
                  <Box>
                    <Typography variant="subtitle2">{booking.patientName}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {booking.templateName}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={booking.scheduleType.toUpperCase()} />
                    <Chip
                      size="small"
                      color={booking.status === 'completed' ? 'success' : booking.status === 'sent' ? 'info' : 'warning'}
                      label={booking.status === 'completed' ? 'Completed' : booking.status === 'sent' ? 'Sent' : 'Scheduled'}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {format(parseISO(booking.scheduledFor), 'MMM d, yyyy h:mm a')}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>
    </Stack>
  );
};

export default PromsAnalyticsDashboard;
