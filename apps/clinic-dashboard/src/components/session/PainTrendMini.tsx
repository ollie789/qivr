import { Box, Typography, alpha, useTheme } from '@mui/material';
import {
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  ReferenceLine,
  Tooltip,
} from 'recharts';
import { format, parseISO, isValid } from 'date-fns';
import { auraColors } from '@qivr/design-system';

interface PainDataPoint {
  date: string;
  painLevel: number;
}

interface PainTrendMiniProps {
  history: PainDataPoint[];
  currentPainBefore?: number;
  height?: number;
}

// Safely parse and format date
function safeFormatDate(dateString: string): string {
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return format(parsed, 'MMM d');
    }
    return 'N/A';
  } catch {
    return 'N/A';
  }
}

export function PainTrendMini({ history, currentPainBefore, height = 100 }: PainTrendMiniProps) {
  const theme = useTheme();

  // Filter out entries with invalid data
  const validHistory = history.filter(
    (h) => h && typeof h.date === 'string' && typeof h.painLevel === 'number'
  );

  if (validHistory.length === 0) {
    return (
      <Box sx={{ py: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          No pain history available
        </Typography>
      </Box>
    );
  }

  // Prepare chart data - most recent last for chronological display
  const chartData = validHistory
    .slice(0, 8)
    .reverse()
    .map((h) => ({
      date: safeFormatDate(h.date),
      value: h.painLevel,
    }));

  // Add current session point if provided
  if (currentPainBefore !== undefined) {
    chartData.push({
      date: 'Today',
      value: currentPainBefore,
    });
  }

  // Calculate trend
  const lastValue = validHistory[0]?.painLevel ?? 0;
  const previousValue = validHistory[1]?.painLevel ?? lastValue;
  const trend = lastValue - previousValue;

  const getTrendInfo = () => {
    if (trend < -1) {
      return {
        icon: <TrendingDownIcon fontSize="small" />,
        label: 'Improving',
        color: auraColors.green.main,
      };
    } else if (trend > 1) {
      return {
        icon: <TrendingUpIcon fontSize="small" />,
        label: 'Worsening',
        color: auraColors.red.main,
      };
    } else {
      return {
        icon: <TrendingFlatIcon fontSize="small" />,
        label: 'Stable',
        color: auraColors.orange.main,
      };
    }
  };

  const trendInfo = getTrendInfo();

  return (
    <Box>
      {/* Trend indicator */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Pain Trend
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            color: trendInfo.color,
          }}
        >
          {trendInfo.icon}
          <Typography variant="caption" fontWeight={600}>
            {trendInfo.label}
          </Typography>
        </Box>
      </Box>

      {/* Mini chart */}
      <Box sx={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9 }} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, 10]}
              tick={{ fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              ticks={[0, 5, 10]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                fontSize: 12,
                padding: '4px 8px',
              }}
              formatter={(value: number) => [`${value}/10`, 'Pain']}
            />
            <ReferenceLine y={5} stroke={theme.palette.divider} strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="value"
              stroke={auraColors.red.main}
              strokeWidth={2}
              dot={{
                fill: auraColors.red.main,
                strokeWidth: 0,
                r: 3,
              }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* Last session comparison */}
      {validHistory.length >= 1 && validHistory[0] && (
        <Box
          sx={{
            mt: 1,
            p: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Last session:{' '}
            <Typography component="span" variant="caption" fontWeight={600} color="text.primary">
              {lastValue}/10
            </Typography>
            {' on '}
            {safeFormatDate(validHistory[0].date)}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
