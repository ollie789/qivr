import type { Meta, StoryObj } from '@storybook/react';
import { Typography, List, ListItem, ListItemText, Divider } from '@mui/material';
import { DashboardSectionCard } from './DashboardSectionCard';
import { QivrButton } from '../buttons/QivrButton';

const meta: Meta<typeof DashboardSectionCard> = {
  title: 'Design System/DashboardSectionCard',
  component: DashboardSectionCard,
  args: {
    header: <Typography variant="h6">Section Title</Typography>,
  },
};

export default meta;
type Story = StoryObj<typeof DashboardSectionCard>;

const SampleContent = () => (
  <List dense>
    <ListItem>
      <ListItemText primary="Item one" secondary="Additional context" />
    </ListItem>
    <Divider component="li" />
    <ListItem>
      <ListItemText primary="Item two" secondary="Another piece of information" />
    </ListItem>
    <Divider component="li" />
    <ListItem>
      <ListItemText primary="Item three" secondary="More details" />
    </ListItem>
  </List>
);

export const Default: Story = {
  render: (args) => (
    <DashboardSectionCard {...args}>
      <SampleContent />
    </DashboardSectionCard>
  ),
};

export const WithActions: Story = {
  render: (args) => (
    <DashboardSectionCard
      {...args}
      header={
        <Typography component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Team Activity</span>
          <QivrButton size="small" variant="outlined" emphasize="subtle">
            View all
          </QivrButton>
        </Typography>
      }
    >
      <SampleContent />
    </DashboardSectionCard>
  ),
};
