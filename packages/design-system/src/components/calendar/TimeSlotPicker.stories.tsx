import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { TimeSlotPicker } from './TimeSlotPicker';

const meta: Meta<typeof TimeSlotPicker> = {
  title: 'Design System/Calendar/TimeSlotPicker',
  component: TimeSlotPicker,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const morningSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
const afternoonSlots = ['14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'];
const allDaySlots = [...morningSlots, '12:00', ...afternoonSlots];

export const MorningSlots: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <TimeSlotPicker
        slots={morningSlots}
        selectedSlot={selected}
        onSelectSlot={setSelected}
      />
    );
  },
};

export const AfternoonSlots: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>('15:00');
    return (
      <TimeSlotPicker
        slots={afternoonSlots}
        selectedSlot={selected}
        onSelectSlot={setSelected}
      />
    );
  },
};

export const FullDay: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <TimeSlotPicker
        slots={allDaySlots}
        selectedSlot={selected}
        onSelectSlot={setSelected}
        label="Available Appointment Times"
      />
    );
  },
};

export const Disabled: Story = {
  render: () => {
    return (
      <TimeSlotPicker
        slots={morningSlots}
        selectedSlot="10:00"
        onSelectSlot={() => {}}
        disabled
      />
    );
  },
};

export const CustomLabel: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    return (
      <TimeSlotPicker
        slots={morningSlots}
        selectedSlot={selected}
        onSelectSlot={setSelected}
        label="Choose Your Preferred Time"
      />
    );
  },
};
