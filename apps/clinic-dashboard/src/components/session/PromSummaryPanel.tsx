import { useState, useMemo } from 'react';
import { Box, Typography, Collapse, Chip, Stack, alpha, Skeleton } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { auraColors } from '@qivr/design-system';
import type { PromResponse } from '../../services/promApi';

interface PromSummaryPanelProps {
  promResponses: PromResponse[];
  isLoading?: boolean;
}

// Compute a normalized score (0-100) from the response
function getNormalizedScore(prom: PromResponse): number | undefined {
  if (prom.score !== undefined) return prom.score;
  if (prom.rawScore !== undefined && prom.maxScore && prom.maxScore > 0) {
    return Math.round((prom.rawScore / prom.maxScore) * 100);
  }
  return undefined;
}

export function PromSummaryPanel({ promResponses, isLoading }: PromSummaryPanelProps) {
  const [expanded, setExpanded] = useState(true);

  const promSummary = useMemo(() => {
    if (promResponses.length === 0) return null;

    const completedProms = promResponses
      .filter((p) => p.status === 'completed' && getNormalizedScore(p) !== undefined)
      .sort(
        (a, b) =>
          new Date(b.completedAt || b.scheduledAt || '').getTime() -
          new Date(a.completedAt || a.scheduledAt || '').getTime()
      );

    if (completedProms.length === 0) return null;

    const latest = completedProms[0];
    if (!latest) return null;

    const previous = completedProms.length > 1 ? completedProms[1] : null;

    let trend: 'improving' | 'stable' | 'worsening' | null = null;
    let trendValue = 0;

    const latestScore = getNormalizedScore(latest);
    const previousScore = previous ? getNormalizedScore(previous) : undefined;

    if (latestScore !== undefined && previousScore !== undefined) {
      trendValue = latestScore - previousScore;
      if (Math.abs(trendValue) < 5) {
        trend = 'stable';
      } else if (trendValue > 0) {
        trend = 'improving';
      } else {
        trend = 'worsening';
      }
    }

    return {
      latest,
      latestScore,
      previous,
      trend,
      trendValue: Math.abs(trendValue),
      completedCount: completedProms.length,
      recentProms: completedProms.slice(0, 3),
    };
  }, [promResponses]);

  if (isLoading) {
    return (
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Skeleton variant="text" width={150} />
        <Skeleton variant="rectangular" height={60} sx={{ mt: 1, borderRadius: 1 }} />
      </Box>
    );
  }

  if (!promSummary) {
    return null;
  }

  const getTrendIcon = () => {
    switch (promSummary.trend) {
      case 'improving':
        return <TrendingUpIcon sx={{ fontSize: 16, color: auraColors.green.main }} />;
      case 'worsening':
        return <TrendingDownIcon sx={{ fontSize: 16, color: auraColors.red.main }} />;
      case 'stable':
        return <TrendingFlatIcon sx={{ fontSize: 16, color: auraColors.orange.main }} />;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (promSummary.trend) {
      case 'improving':
        return auraColors.green.main;
      case 'worsening':
        return auraColors.red.main;
      case 'stable':
        return auraColors.orange.main;
      default:
        return 'text.secondary';
    }
  };

  const getScoreColor = (score: number | undefined) => {
    if (score === undefined) return 'text.secondary';
    if (score >= 70) return auraColors.green.main;
    if (score >= 40) return auraColors.orange.main;
    return auraColors.red.main;
  };

  return (
    <Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      {/* Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          '&:hover': { bgcolor: 'action.hover' },
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon fontSize="small" color="primary" />
          <Typography variant="subtitle2" fontWeight={600}>
            PROM Scores
          </Typography>
          {promSummary.trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getTrendIcon()}
              <Typography variant="caption" color={getTrendColor()} fontWeight={500}>
                {promSummary.trend === 'improving'
                  ? `+${promSummary.trendValue}%`
                  : promSummary.trend === 'worsening'
                    ? `-${promSummary.trendValue}%`
                    : 'Stable'}
              </Typography>
            </Box>
          )}
        </Box>
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </Box>

      <Collapse in={expanded}>
        <Stack spacing={2} sx={{ px: 2, pb: 2 }}>
          {/* Latest Score */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: alpha(auraColors.purple.main, 0.05),
              borderRadius: 1,
              border: `1px solid ${alpha(auraColors.purple.main, 0.15)}`,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Latest Score
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {promSummary.latest.templateName || 'PROM'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  color={getScoreColor(promSummary.latestScore)}
                >
                  {promSummary.latestScore}%
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {promSummary.latest.completedAt
                    ? format(parseISO(promSummary.latest.completedAt), 'MMM d')
                    : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Previous Scores */}
          {promSummary.recentProms.length > 1 && (
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Recent History
              </Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                {promSummary.recentProms.slice(1).map((prom) => {
                  const promScore = getNormalizedScore(prom);
                  return (
                    <Box
                      key={prom.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 0.75,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                      }}
                    >
                      <Box>
                        <Typography variant="caption" fontWeight={500}>
                          {prom.templateName || 'PROM'}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontSize: '0.65rem' }}
                        >
                          {prom.completedAt
                            ? format(parseISO(prom.completedAt), 'MMM d, yyyy')
                            : ''}
                        </Typography>
                      </Box>
                      <Chip
                        label={`${promScore}%`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          bgcolor: alpha(getScoreColor(promScore), 0.15),
                          color: getScoreColor(promScore),
                        }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Summary Stats */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Total Completed
              </Typography>
              <Typography variant="body2" fontWeight={500}>
                {promSummary.completedCount} assessment{promSummary.completedCount !== 1 ? 's' : ''}
              </Typography>
            </Box>
            {promSummary.trend && (
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Trend
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  {getTrendIcon()}
                  <Typography
                    variant="body2"
                    fontWeight={500}
                    color={getTrendColor()}
                    sx={{ textTransform: 'capitalize' }}
                  >
                    {promSummary.trend}
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Stack>
      </Collapse>
    </Box>
  );
}
