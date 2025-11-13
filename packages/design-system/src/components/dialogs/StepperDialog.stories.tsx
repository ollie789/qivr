import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { StepperDialog } from './StepperDialog';
import { FormSection } from '../forms/FormSection';
import { FormRow } from '../forms/FormRow';
import { TextField, Typography } from '@mui/material';

const meta: Meta<typeof StepperDialog> = {
  title: 'Design System/Dialogs/StepperDialog',
  component: StepperDialog,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const ThreeSteps: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [activeStep, setActiveStep] = useState(0);
    const [formData, setFormData] = useState({ name: '', email: '', message: '' });

    const steps = ['Personal Info', 'Contact', 'Message'];

    const renderStep = () => {
      switch (activeStep) {
        case 0:
          return (
            <FormSection title="Personal Information">
              <FormRow label="Name" required>
                <TextField
                  fullWidth
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </FormRow>
            </FormSection>
          );
        case 1:
          return (
            <FormSection title="Contact Details">
              <FormRow label="Email" required>
                <TextField
                  fullWidth
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </FormRow>
            </FormSection>
          );
        case 2:
          return (
            <FormSection title="Your Message">
              <FormRow label="Message">
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                />
              </FormRow>
            </FormSection>
          );
        default:
          return null;
      }
    };

    return (
      <StepperDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Multi-Step Form"
        steps={steps}
        activeStep={activeStep}
        onNext={() => setActiveStep((prev) => prev + 1)}
        onBack={() => setActiveStep((prev) => prev - 1)}
        onComplete={() => {
          alert('Form completed!');
          setOpen(false);
        }}
        isStepValid={
          activeStep === 0 ? formData.name !== '' :
          activeStep === 1 ? formData.email !== '' :
          true
        }
      >
        {renderStep()}
      </StepperDialog>
    );
  },
};

export const FourSteps: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [activeStep, setActiveStep] = useState(0);

    return (
      <StepperDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Appointment Booking"
        steps={['Select Service', 'Choose Date', 'Add Details', 'Confirm']}
        activeStep={activeStep}
        onNext={() => setActiveStep((prev) => prev + 1)}
        onBack={() => setActiveStep((prev) => prev - 1)}
        onComplete={() => {
          alert('Appointment booked!');
          setOpen(false);
        }}
      >
        <Typography>Step {activeStep + 1} content goes here</Typography>
      </StepperDialog>
    );
  },
};

export const WithLoading: Story = {
  render: () => {
    const [open, setOpen] = useState(true);
    const [activeStep, setActiveStep] = useState(2);

    return (
      <StepperDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Processing Request"
        steps={['Step 1', 'Step 2', 'Step 3']}
        activeStep={activeStep}
        onNext={() => {}}
        onBack={() => setActiveStep((prev) => prev - 1)}
        onComplete={() => {}}
        loading={true}
      >
        <Typography>Submitting your request...</Typography>
      </StepperDialog>
    );
  },
};
