import type { Meta, StoryObj } from '@storybook/react';
import { StatusAvatar } from './StatusAvatar';
import { Stack } from '@mui/material';

const meta: Meta<typeof StatusAvatar> = {
  title: 'Components/Feedback/StatusAvatar',
  component: StatusAvatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusAvatar>;

export const Online: Story = {
  args: {
    name: 'John Doe',
    status: 'online',
  },
};

export const Offline: Story = {
  args: {
    name: 'Jane Smith',
    status: 'offline',
  },
};

export const Away: Story = {
  args: {
    name: 'Bob Wilson',
    status: 'away',
  },
};

export const Busy: Story = {
  args: {
    name: 'Alice Brown',
    status: 'busy',
  },
};

export const WithImage: Story = {
  args: {
    name: 'Dr. Sarah Johnson',
    src: 'https://i.pravatar.cc/150?img=1',
    status: 'online',
  },
};

export const Sizes: Story = {
  render: () => (
    <Stack direction="row" spacing={2} alignItems="center">
      <StatusAvatar name="Small" status="online" size={32} />
      <StatusAvatar name="Medium" status="online" size={40} />
      <StatusAvatar name="Large" status="online" size={56} />
      <StatusAvatar name="XLarge" status="online" size={72} />
    </Stack>
  ),
};

export const AllStatuses: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <StatusAvatar name="Online" status="online" />
      <StatusAvatar name="Away" status="away" />
      <StatusAvatar name="Busy" status="busy" />
      <StatusAvatar name="Offline" status="offline" />
    </Stack>
  ),
};
