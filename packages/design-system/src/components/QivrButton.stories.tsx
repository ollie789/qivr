import type { Meta, StoryObj } from '@storybook/react';
import { QivrButton } from './QivrButton';

const meta: Meta<typeof QivrButton> = {
  title: 'Design System/QivrButton',
  component: QivrButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    emphasize: {
      control: 'select',
      options: ['primary', 'secondary', 'subtle'],
      description: 'The emphasis level of the button',
    },
    variant: {
      control: 'select',
      options: ['text', 'outlined', 'contained'],
      description: 'The variant of the button',
    },
    color: {
      control: 'select',
      options: ['primary', 'secondary', 'error', 'warning', 'info', 'success'],
      description: 'The color of the button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: 'The size of the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    emphasize: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    emphasize: 'secondary',
  },
};

export const Subtle: Story = {
  args: {
    children: 'Subtle Button',
    emphasize: 'subtle',
  },
};

export const Outlined: Story = {
  args: {
    children: 'Outlined Button',
    variant: 'outlined',
  },
};

export const Disabled: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'large',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'small',
  },
};