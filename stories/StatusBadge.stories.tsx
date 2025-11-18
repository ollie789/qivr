import type { Meta, StoryObj } from '@storybook/react';
import { Stack } from '../layout/Stack';
import { StatusBadge } from './StatusBadge';

const meta: Meta<typeof StatusBadge> = {
  title: 'Feedback/StatusBadge',
  component: StatusBadge,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof StatusBadge>;

export const Active: Story = {
  args: {
    status: 'active',
  },
};

export const Inactive: Story = {
  args: {
    status: 'inactive',
  },
};

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const Success: Story = {
  args: {
    status: 'success',
  },
};

export const Error: Story = {
  args: {
    status: 'error',
  },
};

export const Warning: Story = {
  args: {
    status: 'warning',
  },
};

export const CustomLabel: Story = {
  args: {
    status: 'success',
    label: 'Verified',
  },
};

export const AllStatuses: Story = {
  render: () => (
    <Stack direction="row" spacing={1}>
      <StatusBadge status="active" />
      <StatusBadge status="inactive" />
      <StatusBadge status="pending" />
      <StatusBadge status="success" />
      <StatusBadge status="error" />
      <StatusBadge status="warning" />
    </Stack>
  ),
};
