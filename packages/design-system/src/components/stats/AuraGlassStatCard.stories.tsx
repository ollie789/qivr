import type { Meta, StoryObj } from '@storybook/react';
import { AuraGlassStatCard } from './AuraGlassStatCard';
import { People, TrendingUp, CalendarToday, Assessment } from '@mui/icons-material';
import { Box } from '@mui/material';

const meta: Meta<typeof AuraGlassStatCard> = {
  title: 'Components/Stats/AuraGlassStatCard',
  component: AuraGlassStatCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuraGlassStatCard>;

export const Default: Story = {
  args: {
    title: 'Total Patients',
    value: '1,234',
    icon: <People />,
  },
};

export const WithPositiveTrend: Story = {
  args: {
    title: 'Active Appointments',
    value: '89',
    icon: <CalendarToday />,
    trend: {
      value: 12.5,
      isPositive: true,
      label: 'vs last month',
    },
  },
};

export const WithNegativeTrend: Story = {
  args: {
    title: 'Pending Reviews',
    value: '23',
    icon: <Assessment />,
    trend: {
      value: 8.3,
      isPositive: false,
      label: 'vs last week',
    },
  },
};

export const CustomColor: Story = {
  args: {
    title: 'Revenue',
    value: '$45,678',
    icon: <TrendingUp />,
    color: '#26CD82',
    trend: {
      value: 15.2,
      isPositive: true,
    },
  },
};

export const Grid: Story = {
  render: () => (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 3 }}>
      <AuraGlassStatCard
        title="Total Patients"
        value="1,234"
        icon={<People />}
        trend={{ value: 12.5, isPositive: true }}
      />
      <AuraGlassStatCard
        title="Appointments"
        value="89"
        icon={<CalendarToday />}
        trend={{ value: 5.2, isPositive: true }}
      />
      <AuraGlassStatCard
        title="Pending Reviews"
        value="23"
        icon={<Assessment />}
        trend={{ value: 8.3, isPositive: false }}
      />
      <AuraGlassStatCard
        title="Revenue"
        value="$45,678"
        icon={<TrendingUp />}
        color="#26CD82"
        trend={{ value: 15.2, isPositive: true }}
      />
    </Box>
  ),
};
