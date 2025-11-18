import type { Meta, StoryObj } from '@storybook/react';
import { PageLoader } from './PageLoader';

const meta: Meta<typeof PageLoader> = {
  title: 'Feedback/PageLoader',
  component: PageLoader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof PageLoader>;

export const Default: Story = {
  args: {},
};

export const CustomMessage: Story = {
  args: {
    message: 'Loading dashboard...',
  },
};

export const LargeSize: Story = {
  args: {
    size: 80,
    message: 'Please wait...',
  },
};

export const NoMessage: Story = {
  args: {
    message: undefined,
  },
};
