import type { Meta, StoryObj } from '@storybook/react';
import { Box, Typography } from '@mui/material';
import { Container } from './Container';

const meta: Meta<typeof Container> = {
  title: 'Layout/Container',
  component: Container,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Container>;

const Content = () => (
  <Box sx={{ p: 3, bgcolor: 'grey.100', borderRadius: 1 }}>
    <Typography>
      This content is centered with a max width. Resize the window to see the effect.
    </Typography>
  </Box>
);

export const Small: Story = {
  render: () => (
    <Container maxWidth="sm">
      <Content />
    </Container>
  ),
};

export const Medium: Story = {
  render: () => (
    <Container maxWidth="md">
      <Content />
    </Container>
  ),
};

export const Large: Story = {
  render: () => (
    <Container maxWidth="lg">
      <Content />
    </Container>
  ),
};

export const ExtraLarge: Story = {
  render: () => (
    <Container maxWidth="xl">
      <Content />
    </Container>
  ),
};

export const FullWidth: Story = {
  render: () => (
    <Container maxWidth={false}>
      <Content />
    </Container>
  ),
};

export const CustomPadding: Story = {
  render: () => (
    <Container maxWidth="lg" padding={5}>
      <Content />
    </Container>
  ),
};
