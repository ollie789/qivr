import type { Meta, StoryObj } from '@storybook/react';
import { CalendarGridCell } from './CalendarGridCell';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { AppointmentChip } from './AppointmentChip';

const meta: Meta<typeof CalendarGridCell> = {
  title: 'Design System/Calendar/CalendarGridCell',
  component: CalendarGridCell,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    selected: {
      control: 'boolean',
      description: 'Whether the cell is currently selected',
    },
    isToday: {
      control: 'boolean',
      description: 'Whether the cell represents today',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <Typography variant="caption">9:00 AM</Typography>,
  },
};

export const Selected: Story = {
  args: {
    selected: true,
    children: <Typography variant="caption">9:00 AM</Typography>,
  },
};

export const Today: Story = {
  args: {
    isToday: true,
    children: <Typography variant="caption">9:00 AM</Typography>,
  },
};

export const WithAppointment: Story = {
  args: {
    children: (
      <AppointmentChip color="#1976d2">
        John Smith
      </AppointmentChip>
    ),
  },
};

export const WeekViewExample: Story = {
  render: () => (
    <Grid container spacing={0.5} sx={{ width: 600 }}>
      {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, dayIdx) => (
        <Grid item xs key={day}>
          <Typography variant="caption" align="center" display="block">
            {day}
          </Typography>
          {[9, 10, 11, 14, 15, 16].map((hour) => (
            <CalendarGridCell
              key={`${day}-${hour}`}
              isToday={dayIdx === 2 && hour === 10}
              sx={{ mb: 0.5 }}
            >
              {dayIdx === 1 && hour === 10 && (
                <AppointmentChip color="#2e7d32">
                  Meeting
                </AppointmentChip>
              )}
              {dayIdx === 3 && hour === 14 && (
                <AppointmentChip color="#d32f2f">
                  Checkup
                </AppointmentChip>
              )}
            </CalendarGridCell>
          ))}
        </Grid>
      ))}
    </Grid>
  ),
};
