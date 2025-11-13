import type { Meta, StoryObj } from '@storybook/react';
import { Typography } from '@mui/material';
import { AvailabilitySlot } from '../components';

const meta: Meta<typeof AvailabilitySlot> = {
  title: 'Design System/AvailabilitySlot',
  component: AvailabilitySlot,
  args: {
    children: <Typography variant="caption" color="text.secondary">Available</Typography>,
  },
};

export default meta;
type Story = StoryObj<typeof AvailabilitySlot>;

export const Dashed: Story = {};

export const Solid: Story = {
  args: {
    dashed: false,
    children: <Typography variant="caption">Booked</Typography>,
  },
};
