import type { Meta, StoryObj } from '@storybook/react';
import { IconWithLabel } from './IconWithLabel';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NotesIcon from '@mui/icons-material/Notes';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

const meta: Meta<typeof IconWithLabel> = {
  title: 'Design System/Layout/IconWithLabel',
  component: IconWithLabel,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    captionLabel: {
      control: 'boolean',
      description: 'Whether to show the label as caption style',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <PersonIcon />,
    label: 'Patient',
    children: 'John Smith',
  },
};

export const WithCustomContent: Story = {
  args: {
    icon: <LocationOnIcon />,
    label: 'Location',
    children: (
      <>
        <Typography variant="body1">Main Clinic</Typography>
        <Typography variant="body2" color="text.secondary">
          123 Health St, Medical District
        </Typography>
      </>
    ),
  },
};

export const SubtitleLabel: Story = {
  args: {
    icon: <CalendarMonthIcon />,
    label: 'Appointment Date',
    captionLabel: false,
    children: 'Monday, January 15, 2024 at 9:00 AM',
  },
};

export const AppointmentSummaryExample: Story = {
  render: () => (
    <Paper sx={{ p: 3, width: 500, bgcolor: 'grey.50' }}>
      <Typography variant="h6" gutterBottom>
        Appointment Summary
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <IconWithLabel icon={<PersonIcon />} label="Patient">
            Sarah Johnson
          </IconWithLabel>
        </Grid>
        <Grid item xs={12} md={6}>
          <IconWithLabel icon={<PersonIcon />} label="Provider">
            Dr. Emily Chen
          </IconWithLabel>
        </Grid>
        <Grid item xs={12} md={6}>
          <IconWithLabel icon={<CalendarMonthIcon />} label="Date & Time">
            Monday, January 15, 2024 at 2:00 PM
          </IconWithLabel>
        </Grid>
        <Grid item xs={12} md={6}>
          <IconWithLabel icon={<LocationOnIcon />} label="Location">
            Main Clinic
          </IconWithLabel>
        </Grid>
        <Grid item xs={12}>
          <IconWithLabel icon={<NotesIcon />} label="Notes">
            <Typography variant="body1">Follow-up Consultation (30 minutes)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Patient requested to discuss recent test results and treatment plan adjustments.
            </Typography>
          </IconWithLabel>
        </Grid>
      </Grid>
    </Paper>
  ),
};
