import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { SectionLoader } from './SectionLoader';

const meta: Meta<typeof SectionLoader> = {
  title: 'Feedback/SectionLoader',
  component: SectionLoader,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SectionLoader>;

export const Default: Story = {
  render: () => (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <SectionLoader />
    </Box>
  ),
};

export const WithMessage: Story = {
  render: () => (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <SectionLoader message="Loading patients..." />
    </Box>
  ),
};

export const CustomHeight: Story = {
  render: () => (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <SectionLoader minHeight="400px" message="Loading data..." />
    </Box>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <SectionLoader size={30} minHeight="150px" />
    </Box>
  ),
};
