import type { Meta, StoryObj } from '@storybook/react';
import { StatCard } from './StatCard';
import { Favorite, ThermostatAuto, MonitorHeart } from '@mui/icons-material';
import { Grid } from '@mui/material';

const meta = {
  title: 'Components/Stats/StatCard',
  component: StatCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StatCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Basic: Story = {
  args: {
    label: 'Total Patients',
    value: '1,234',
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Heart Rate',
    value: '72 bpm',
    icon: <MonitorHeart />,
    iconColor: 'error',
  },
};

export const Compact: Story = {
  args: {
    label: 'Blood Type',
    value: 'O+',
    compact: true,
  },
};

export const VitalSignsGrid: Story = {
  render: () => (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <StatCard
          label="Blood Pressure"
          value="120/80"
          icon={<Favorite />}
          iconColor="error"
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard
          label="Heart Rate"
          value="72 bpm"
          icon={<MonitorHeart />}
          iconColor="primary"
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard
          label="Temperature"
          value="98.6°F"
          icon={<ThermostatAuto />}
          iconColor="warning"
        />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label="Weight" value="165 lbs" />
      </Grid>
    </Grid>
  ),
};

export const CompactGrid: Story = {
  render: () => (
    <Grid container spacing={2}>
      <Grid item xs={6} md={3}>
        <StatCard label="Blood Type" value="O+" compact />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label="Allergies" value={3} compact />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label="Medications" value={5} compact />
      </Grid>
      <Grid item xs={6} md={3}>
        <StatCard label="Last Visit" value="Jan 15" compact />
      </Grid>
    </Grid>
  ),
};
