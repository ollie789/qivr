import type { Meta, StoryObj } from '@storybook/react';
import { Grid } from '@mui/material';
import AppointmentTrendCard from '../apps/clinic-dashboard/src/features/analytics/components/AppointmentTrendCard';
import PromCompletionCard from '../apps/clinic-dashboard/src/features/analytics/components/PromCompletionCard';
import TopDiagnosesCard from '../apps/clinic-dashboard/src/features/analytics/components/TopDiagnosesCard';

const meta: Meta = {
  title: 'App/Analytics/Overview',
};

export default meta;

type Story = StoryObj;

const appointmentSample = Array.from({ length: 7 }).map((_, index) => ({
  name: `Day ${index + 1}`,
  appointments: Math.floor(Math.random() * 20) + 5,
  completed: Math.floor(Math.random() * 15) + 3,
}));

const promSample = [
  { name: 'Pain', completed: 78, pending: 22, completionRate: 78 },
  { name: 'Function', completed: 64, pending: 36, completionRate: 64 },
  { name: 'Satisfaction', completed: 92, pending: 8, completionRate: 92 },
];

const diagnosisSample = [
  { name: 'Lower back pain', percentage: 32, value: 120, color: 'var(--qivr-palette-primary-main)' },
  { name: 'Shoulder injury', percentage: 24, value: 90, color: 'var(--qivr-palette-secondary-main)' },
  { name: 'ACL tear', percentage: 18, value: 65, color: 'var(--qivr-palette-success-main)' },
  { name: 'Post-op rehab', percentage: 15, value: 55, color: 'var(--qivr-palette-warning-main)' },
  { name: 'Other', percentage: 11, value: 40, color: 'var(--qivr-palette-neutral-500, #94a3b8)' },
];

export const Cards: Story = {
  render: () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={8}>
        <AppointmentTrendCard data={appointmentSample} showLegend />
      </Grid>
      <Grid item xs={12} md={4}>
        <PromCompletionCard data={promSample} />
      </Grid>
      <Grid item xs={12} md={6}>
        <TopDiagnosesCard title="Top Diagnoses" data={diagnosisSample} />
      </Grid>
    </Grid>
  ),
};
