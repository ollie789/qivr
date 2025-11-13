import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { ProviderCard } from './ProviderCard';
import { List } from '@mui/material';

const meta: Meta<typeof ProviderCard> = {
  title: 'Design System/Cards/ProviderCard',
  component: ProviderCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: '1',
    name: 'Dr. Emily Chen',
    title: 'Physiotherapist',
    subtitle: 'Available Mon-Fri',
    selected: false,
  },
};

export const Selected: Story = {
  args: {
    id: '1',
    name: 'Dr. Emily Chen',
    title: 'Physiotherapist',
    subtitle: 'Available Mon-Fri',
    selected: true,
  },
};

export const WithAvatar: Story = {
  args: {
    id: '1',
    name: 'Dr. James Williams',
    title: 'Sports Therapist',
    subtitle: 'Next available: Tomorrow',
    avatar: 'https://i.pravatar.cc/150?img=12',
    selected: false,
  },
};

export const ProviderList: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const providers = [
      {
        id: '1',
        name: 'Dr. Emily Chen',
        title: 'Physiotherapist',
        subtitle: 'Available Mon-Fri • 15 years experience',
      },
      {
        id: '2',
        name: 'Dr. James Williams',
        title: 'Sports Therapist',
        subtitle: 'Available Tue-Sat • Specializes in athletes',
      },
      {
        id: '3',
        name: 'Dr. Priya Patel',
        title: 'Pain Specialist',
        subtitle: 'Available Mon-Thu • Chronic pain management',
      },
      {
        id: '4',
        name: 'Dr. Michael Brown',
        title: 'Chiropractor',
        subtitle: 'Available Wed-Sun • Spinal adjustments',
      },
    ];

    return (
      <List>
        {providers.map((provider) => (
          <ProviderCard
            key={provider.id}
            {...provider}
            selected={selectedId === provider.id}
            onSelect={setSelectedId}
          />
        ))}
      </List>
    );
  },
};

export const LongSubtitle: Story = {
  args: {
    id: '1',
    name: 'Dr. Sarah Johnson',
    title: 'Occupational Therapist',
    subtitle: 'Available Mon-Fri 9am-5pm • Specializes in pediatric care and developmental disorders • 20+ years experience',
    selected: false,
  },
};
