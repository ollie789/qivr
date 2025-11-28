import type { Meta, StoryObj } from '@storybook/react';
import { AuraCard } from './AuraCard';
import { Typography, Button, Stack } from '@mui/material';

const meta: Meta<typeof AuraCard> = {
  title: 'Components/Cards/AuraCard',
  component: AuraCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof AuraCard>;

export const Default: Story = {
  args: {
    children: (
      <Stack spacing={2}>
        <Typography variant="h6">Default Card</Typography>
        <Typography variant="body2" color="text.secondary">
          This is a standard Aura card with default styling.
        </Typography>
      </Stack>
    ),
  },
};

export const Glass: Story = {
  args: {
    variant: 'glass',
    children: (
      <Stack spacing={2}>
        <Typography variant="h6">Glass Card</Typography>
        <Typography variant="body2" color="text.secondary">
          This card uses glassmorphism effects.
        </Typography>
      </Stack>
    ),
  },
};

export const Gradient: Story = {
  args: {
    variant: 'gradient',
    children: (
      <Stack spacing={2}>
        <Typography variant="h6" color="white">Gradient Card</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
          This card features a gradient background.
        </Typography>
      </Stack>
    ),
  },
};

export const Elevated: Story = {
  args: {
    variant: 'elevated',
    children: (
      <Stack spacing={2}>
        <Typography variant="h6">Elevated Card</Typography>
        <Typography variant="body2" color="text.secondary">
          This card has enhanced shadow for prominence.
        </Typography>
      </Stack>
    ),
  },
};

export const WithActions: Story = {
  args: {
    children: (
      <Stack spacing={2}>
        <Typography variant="h6">Card with Actions</Typography>
        <Typography variant="body2" color="text.secondary">
          Cards can contain interactive elements.
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="contained" size="small">Primary</Button>
          <Button variant="outlined" size="small">Secondary</Button>
        </Stack>
      </Stack>
    ),
  },
};
