import type { Meta, StoryObj } from '@storybook/react';
import { Box } from '@mui/material';
import { Stack } from '@qivr/design-system';

const meta: Meta<typeof Stack> = {
  title: 'Layout/Stack',
  component: Stack,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Stack>;

const Item = ({ children }: { children: React.ReactNode }) => (
  <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', borderRadius: 1 }}>
    {children}
  </Box>
);

export const Vertical: Story = {
  render: () => (
    <Stack spacing={2}>
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
    </Stack>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <Stack direction="row" spacing={2}>
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
    </Stack>
  ),
};

export const SpaceBetween: Story = {
  render: () => (
    <Stack direction="row" justify="space-between">
      <Item>Left</Item>
      <Item>Right</Item>
    </Stack>
  ),
};

export const Centered: Story = {
  render: () => (
    <Stack direction="row" justify="center" align="center" spacing={2}>
      <Item>Centered 1</Item>
      <Item>Centered 2</Item>
    </Stack>
  ),
};

export const LargeSpacing: Story = {
  render: () => (
    <Stack spacing={4}>
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
    </Stack>
  ),
};

export const NoSpacing: Story = {
  render: () => (
    <Stack spacing={0}>
      <Item>Item 1</Item>
      <Item>Item 2</Item>
      <Item>Item 3</Item>
    </Stack>
  ),
};
