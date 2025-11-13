import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Typography,
  Stack,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { 
  QivrCard, 
  FlexBetween, 
  QivrButton,
  IconWithLabel,
  CalendarGridCell,
  AppointmentChip,
} from '@qivr/design-system';

/**
 * Demonstrates a complete appointment scheduling flow with calendar grid
 */
const AppointmentSchedulingFlow: React.FC = () => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [appointments] = useState([
    { time: '09:00', patient: 'John Smith', color: '#1976d2' },
    { time: '14:00', patient: 'Sarah Johnson', color: '#2e7d32' },
  ]);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Appointment Scheduling
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Select an available time slot to schedule an appointment
      </Typography>

      <Stack spacing={3}>
        {/* Calendar Grid */}
        <QivrCard elevated>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Monday, January 15, 2024
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, mt: 2 }}>
              {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map((time) => {
                const appointment = appointments.find(apt => apt.time === time);
                const isSelected = selectedSlot === time;
                
                return (
                  <CalendarGridCell
                    key={time}
                    selected={isSelected}
                    onClick={() => !appointment && setSelectedSlot(time)}
                    sx={{ 
                      cursor: appointment ? 'default' : 'pointer',
                      opacity: appointment ? 0.9 : 1,
                    }}
                  >
                    {appointment ? (
                      <AppointmentChip color={appointment.color}>
                        {appointment.patient}
                      </AppointmentChip>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {time}
                      </Typography>
                    )}
                  </CalendarGridCell>
                );
              })}
            </Box>
          </CardContent>
        </QivrCard>

        {/* Selection Summary */}
        {selectedSlot && (
          <QivrCard>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected Time Slot
              </Typography>
              
              <Stack spacing={2}>
                <IconWithLabel 
                  icon={<CalendarIcon />} 
                  label="Date & Time"
                >
                  Monday, January 15, 2024 at {selectedSlot}
                </IconWithLabel>

                <FlexBetween>
                  <QivrButton
                    emphasize="subtle"
                    onClick={() => setSelectedSlot(null)}
                  >
                    Cancel
                  </QivrButton>
                  <QivrButton variant="contained">
                    Confirm Appointment
                  </QivrButton>
                </FlexBetween>
              </Stack>
            </CardContent>
          </QivrCard>
        )}

        {/* Legend */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Legend
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip label="Available" variant="outlined" size="small" />
              <Chip label="Selected" color="primary" size="small" />
              <Chip label="Booked" disabled size="small" />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

const meta: Meta<typeof AppointmentSchedulingFlow> = {
  title: 'App Scenarios/Appointment Scheduling Flow',
  component: AppointmentSchedulingFlow,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A complete appointment scheduling flow demonstrating calendar grid selection, appointment chips, and confirmation flow.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithManyAppointments: Story = {
  render: () => {
    const [selectedDay, setSelectedDay] = useState(0);
    
    const weekData = [
      { day: 'Mon', date: 15, appointments: [
        { time: '09:00', patient: 'John S.', color: '#1976d2' },
        { time: '14:00', patient: 'Sarah J.', color: '#2e7d32' },
      ]},
      { day: 'Tue', date: 16, appointments: [
        { time: '10:00', patient: 'Mike W.', color: '#d32f2f' },
        { time: '11:00', patient: 'Emma B.', color: '#ed6c02' },
        { time: '15:00', patient: 'Chris L.', color: '#1976d2' },
      ]},
      { day: 'Wed', date: 17, appointments: [
        { time: '09:00', patient: 'Lisa M.', color: '#2e7d32' },
      ]},
      { day: 'Thu', date: 18, appointments: [
        { time: '14:00', patient: 'David P.', color: '#d32f2f' },
        { time: '16:00', patient: 'Anna K.', color: '#1976d2' },
      ]},
      { day: 'Fri', date: 19, appointments: [] },
    ];

    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Week View - January 15-19, 2024
        </Typography>
        
        <QivrCard elevated sx={{ mt: 3 }}>
          <CardContent>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 1 }}>
              {weekData.map((dayData, idx) => (
                <Box key={dayData.day}>
                  <Button
                    fullWidth
                    variant={selectedDay === idx ? 'contained' : 'outlined'}
                    onClick={() => setSelectedDay(idx)}
                    sx={{ mb: 1 }}
                  >
                    {dayData.day} {dayData.date}
                  </Button>
                  
                  <Stack spacing={0.5}>
                    {['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map((time) => {
                      const appointment = dayData.appointments.find(apt => apt.time === time);
                      
                      return (
                        <CalendarGridCell
                          key={time}
                          isToday={idx === 2}
                          sx={{ height: 50 }}
                        >
                          {appointment ? (
                            <AppointmentChip color={appointment.color}>
                              {appointment.patient}
                            </AppointmentChip>
                          ) : (
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '9px' }}>
                              {time}
                            </Typography>
                          )}
                        </CalendarGridCell>
                      );
                    })}
                  </Stack>
                </Box>
              ))}
            </Box>
          </CardContent>
        </QivrCard>

        <Card variant="outlined" sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" gutterBottom>
              Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {weekData[selectedDay].appointments.length} appointments on {weekData[selectedDay].day}
            </Typography>
          </CardContent>
        </Card>
      </Container>
    );
  },
};
