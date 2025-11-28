import { Box, Typography, Stack, alpha, useTheme, LinearProgress } from '@mui/material';
import { 
  EmojiEvents, 
  LocalFireDepartment, 
  TrendingUp, 
  CheckCircle, 
  Star, 
  Refresh,
  Assignment,
  CalendarMonth
} from '@mui/icons-material';
import { 
  AuraGlassStatCard, 
  AuraCard, 
  AuraButton, 
  SectionLoader, 
  Callout
} from '@qivr/design-system';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api-client';

const achievements = [
  { id: 1, title: 'First Steps', description: 'Completed intake form', icon: '🎯', unlocked: true },
  { id: 2, title: 'Consistent Care', description: '5 appointments attended', icon: '💪', unlocked: true },
  { id: 3, title: 'Data Champion', description: '10 PROMs completed', icon: '📊', unlocked: true },
  { id: 4, title: 'Recovery Warrior', description: '50% improvement', icon: '🏆', unlocked: false },
  { id: 5, title: 'Perfect Week', description: '7 day streak', icon: '⭐', unlocked: false },
  { id: 6, title: 'Health Hero', description: '30 day streak', icon: '🔥', unlocked: false },
];

const calculateHealthScore = (data: any) => {
  if (!data) return 0;
  const appointmentScore = Math.min((data.completedAppointments || 0) * 5, 30);
  const promScore = Math.min((data.totalPromCompleted || 0) * 3, 30);
  const improvementScore = Math.min((data.promImprovement || 0), 40);
  return Math.min(appointmentScore + promScore + improvementScore, 100);
};

export default function HealthProgress() {
  const theme = useTheme();
  
  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-analytics-dashboard'],
    queryFn: async () => {
      const response: any = await api.get('/api/patient-analytics/dashboard');
      return response.data || response;
    },
    retry: 2,
  });

  const stats = rawData ? {
    healthScore: calculateHealthScore(rawData),
    appointmentStreak: rawData.currentStreak || 0,
    promStreak: rawData.currentStreak || 0,
    totalAppointments: rawData.totalAppointments || 0,
    completedProms: rawData.totalPromCompleted || 0,
    improvementRate: rawData.promImprovement || 0,
    nextMilestone: { 
      current: rawData.completedAppointments || 0, 
      target: 15 
    }
  } : null;

  const healthScore = stats?.healthScore || 0;

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Health Progress
        </Typography>
        <Callout variant="error">
          Failed to load your health data. Please try again.
        </Callout>
        <Box sx={{ mt: 2 }}>
          <AuraButton onClick={() => refetch()} startIcon={<Refresh />}>
            Retry
          </AuraButton>
        </Box>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <SectionLoader />
      </Box>
    );
  }

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const milestoneProgress = ((stats?.nextMilestone?.current || 0) / (stats?.nextMilestone?.target || 15)) * 100;

  return (
    <Box sx={{ p: 3 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Health Progress
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your recovery journey and unlock achievements
        </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Stats Row */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, 
          gap: 3 
        }}>
          <AuraGlassStatCard
            title="Health Score"
            value={healthScore}
            icon={<EmojiEvents />}
            color={healthScore >= 80 ? 'success.main' : healthScore >= 60 ? 'warning.main' : 'error.main'}
            trend={stats?.improvementRate ? {
              value: stats.improvementRate,
              isPositive: stats.improvementRate > 0,
              label: 'overall improvement'
            } : undefined}
          />
          <AuraGlassStatCard
            title="Appointment Streak"
            value={`${stats?.appointmentStreak || 0} 🔥`}
            icon={<LocalFireDepartment />}
            color="error.main"
          />
          <AuraGlassStatCard
            title="Total Appointments"
            value={stats?.totalAppointments || 0}
            icon={<CalendarMonth />}
            color="primary.main"
          />
          <AuraGlassStatCard
            title="PROMs Completed"
            value={stats?.completedProms || 0}
            icon={<Assignment />}
            color="info.main"
          />
        </Box>

        {/* Achievements Section */}
        <AuraCard>
          <Box sx={{ p: 3 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  🏆 Achievements
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {unlockedCount} of {achievements.length} unlocked
                </Typography>
              </Box>
              <Box sx={{ 
                px: 2, 
                py: 0.5, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.warning.main, 0.1),
                color: 'warning.main'
              }}>
                <Typography variant="body2" fontWeight={600}>
                  {unlockedCount} / {achievements.length}
                </Typography>
              </Box>
            </Stack>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, 
              gap: 2 
            }}>
              {achievements.map((achievement) => (
                <Box
                  key={achievement.id}
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    bgcolor: achievement.unlocked 
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.action.hover, 0.5),
                    border: '1px solid',
                    borderColor: achievement.unlocked 
                      ? alpha(theme.palette.primary.main, 0.2)
                      : 'divider',
                    opacity: achievement.unlocked ? 1 : 0.6,
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': achievement.unlocked ? {
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                    } : {}
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Typography variant="h4" sx={{ lineHeight: 1 }}>
                      {achievement.icon}
                    </Typography>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {achievement.title}
                        </Typography>
                        {achievement.unlocked && (
                          <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                        )}
                      </Stack>
                      <Typography variant="caption" color="text.secondary">
                        {achievement.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Box>
        </AuraCard>

        {/* Progress Cards Row */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, 
          gap: 3 
        }}>
          {/* Next Milestone */}
          <AuraCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                🎯 Next Milestone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Keep going! You're making great progress.
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                  <Typography variant="body2" fontWeight={500}>
                    {stats?.nextMilestone?.current || 0} / {stats?.nextMilestone?.target || 15} appointments
                  </Typography>
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    {Math.round(milestoneProgress)}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  value={milestoneProgress}
                  sx={{ 
                    height: 10, 
                    borderRadius: 5,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 5,
                    }
                  }}
                />
              </Box>
              
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.info.main, 0.08),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.2)
              }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <CheckCircle sx={{ color: 'info.main', fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">
                    <strong>{(stats?.nextMilestone?.target || 15) - (stats?.nextMilestone?.current || 0)}</strong> more to unlock "Dedicated Patient" badge
                  </Typography>
                </Stack>
              </Box>
            </Box>
          </AuraCard>

          {/* Streaks */}
          <AuraCard>
            <Box sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                🔥 Your Streaks
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Consistency is key to recovery
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.error.main, 0.08),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.error.main, 0.2)
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: alpha(theme.palette.error.main, 0.15),
                      display: 'flex'
                    }}>
                      <LocalFireDepartment sx={{ color: 'error.main' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {stats?.appointmentStreak || 0} 🔥
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Appointment Streak
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  border: '1px solid',
                  borderColor: alpha(theme.palette.primary.main, 0.2)
                }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      display: 'flex'
                    }}>
                      <CheckCircle sx={{ color: 'primary.main' }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h5" fontWeight={700}>
                        {stats?.promStreak || 0} weeks
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        PROM Completion Streak
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {(stats?.improvementRate ?? 0) > 0 && (
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2, 
                    bgcolor: alpha(theme.palette.success.main, 0.08),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.success.main, 0.2)
                  }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ 
                        p: 1.5, 
                        borderRadius: 2, 
                        bgcolor: alpha(theme.palette.success.main, 0.15),
                        display: 'flex'
                      }}>
                        <TrendingUp sx={{ color: 'success.main' }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h5" fontWeight={700} color="success.main">
                          +{stats?.improvementRate}%
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Overall Improvement
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Box>
          </AuraCard>
        </Box>
      </Stack>
    </Box>
  );
}
