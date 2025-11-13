import type { Meta, StoryObj } from '@storybook/react';
import { QivrCard } from './QivrCard';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

const meta: Meta<typeof QivrCard> = {
  title: 'Design System/QivrCard',
  component: QivrCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    elevated: {
      control: 'boolean',
      description: 'Whether the card should be elevated',
    },
    elevation: {
      control: { type: 'range', min: 0, max: 24 },
      description: 'The elevation level of the card',
    },
    variant: {
      control: 'select',
      options: ['elevation', 'outlined'],
      description: 'The variant of the card',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ width: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

const CardWithContent = (args: any) => (
  <QivrCard {...args}>
    <CardContent>
      <Typography variant="h5" component="div" gutterBottom>
        Card Title
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This is an example card content. You can put any content here including text, images, and other components.
      </Typography>
    </CardContent>
  </QivrCard>
);

export const Default: Story = {
  render: CardWithContent,
  args: {},
};

export const Elevated: Story = {
  render: CardWithContent,
  args: {
    elevated: true,
  },
};

export const Outlined: Story = {
  render: CardWithContent,
  args: {
    variant: 'outlined',
  },
};

export const CustomElevation: Story = {
  render: CardWithContent,
  args: {
    variant: 'elevation',
    elevation: 8,
  },
};

export const WithHoverEffect: Story = {
  render: CardWithContent,
  args: {
    elevated: true,
    sx: {
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 8,
      },
    },
  },
};