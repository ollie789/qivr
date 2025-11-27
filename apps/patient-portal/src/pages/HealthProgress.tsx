import { Box, Typography, LinearProgress, Stack, Avatar, Alert } from '@mui/material';
import { EmojiEvents, LocalFireDepartment, TrendingUp, CheckCircle, Star, Refresh } from '@mui/icons-material';
import { glassCard, AuraButton, SectionLoader } from '@qivr/design-system';
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
  const appointmentScore = Math.min((data.totalAppointments || 0) * 5, 30);
  const promScore = Math.min((data.completedProms || 0) * 3, 30);
  const improvementScore = Math.min((data.improvementRate || 0), 40);
  return Math.min(appointmentScore + promScore + improvementScore, 100);
};

export default function HealthProgress() {
  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ['patient-analytics'],
    queryFn: async () => {
      const response: any = await api.get('/api/patient-analytics/progress');
      return response.data || response;
    },
    retry: 2,
  });

  const stats = rawData ? {
    healthScore: calculateHealthScore(rawData),
    appointmentStreak: rawData.appointmentStreak || 0,
    promStreak: rawData.promStreak || 0,
    totalAppointments: rawData.totalAppointments || 0,
    completedProms: rawData.completedProms || 0,
    improvementRate: rawData.improvementRate || 0,
    nextMilestone: rawData.nextMilestone || { current: 0, target: 15 }
  } : null;

  const healthScore = stats?.healthScore || 0;
  const scoreColor = healthScore >= 80 ? 'success' : healthScore >= 60 ? 'warning' : 'error';

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Health Progress
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load your health data. Please try again.
        </Alert>
        <AuraButton onClick={() => refetch()} startIcon={<Refresh />}>
          Retry
        </AuraButton>
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Health Progress
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Track your recovery journey and unlock achievements
      </Typography>

      <Stack spacing={3}>
        {/* Top Row - Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {/* Health Score */}
          <Box sx={{ ...glassCard, p: 3, textAlign: 'center' }}>
            <EmojiEvents sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h3" fontWeight={700} color={`${scoreColor}.main`}>
              {healthScore}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Health Score
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={healthScore} 
              color={scoreColor}
              sx={{ mt: 2, height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {100 - healthScore} points to next level
            </Typography>
          </Box>

          {/* Streaks */}
          <Box sx={{ ...glassCard, p: 3 }}>
            <Stack spacing={2}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'error.main' }}>
                  <LocalFireDepartment />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={600}>
                    {stats?.appointmentStreak || 0} 🔥
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Appointment Streak
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <CheckCircle />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={600}>
                    {stats?.promStreak || 0} weeks
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    PROM Completion Streak
                  </Typography>
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Quick Stats */}
          <Box sx={{ ...glassCard, p: 3 }}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Appointments
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {stats?.totalAppointments || 0}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  PROMs Completed
                </Typography>
                <Typography variant="h5" fontWeight={600}>
                  {stats?.completedProms || 0}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="success" />
                <Typography variant="body2" color="success.main" fontWeight={600}>
                  {stats?.improvementRate || 0}% improvement
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>

        {/* Achievements */}
        <Box sx={{ ...glassCard, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            🏆 Achievements
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2, mt: 2 }}>
            {achievements.map((achievement) => (
              <Box
                key={achievement.id}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: achievement.unlocked ? 'primary.light' : 'action.hover',
                  opacity: achievement.unlocked ? 1 : 0.5,
                  border: 1,
                  borderColor: achievement.unlocked ? 'primary.main' : 'divider',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: achievement.unlocked ? 'translateY(-4px)' : 'none',
                    boxShadow: achievement.unlocked ? 3 : 0,
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="h4">{achievement.icon}</Typography>
                  {achievement.unlocked && <Star sx={{ color: 'warning.main', fontSize: 20 }} />}
                </Box>
                <Typography variant="subtitle2" fontWeight={600}>
                  {achievement.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {achievement.description}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* Next Milestone */}
        <Box sx={{ ...glassCard, p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            🎯 Next Milestone
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2">
                {stats?.nextMilestone?.current || 0} / {stats?.nextMilestone?.target || 15} appointments
              </Typography>
              <Typography variant="body2" color="primary.main" fontWeight={600}>
                {Math.round(((stats?.nextMilestone?.current || 0) / (stats?.nextMilestone?.target || 15)) * 100)}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={((stats?.nextMilestone?.current || 0) / (stats?.nextMilestone?.target || 15)) * 100}
              sx={{ height: 10, borderRadius: 5 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {(stats?.nextMilestone?.target || 15) - (stats?.nextMilestone?.current || 0)} more to unlock "Dedicated Patient" badge
            </Typography>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
