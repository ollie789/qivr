import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { FormDialog } from '@qivr/design-system';
import { FormField } from '@qivr/design-system';
import { Stack } from '@qivr/design-system';

const meta: Meta<typeof FormDialog> = {
  title: 'Dialogs/FormDialog',
  component: FormDialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormDialog>;

export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Add Patient
        </Button>
        <FormDialog
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={() => {
            alert('Form submitted');
            setOpen(false);
          }}
          title="Add New Patient"
        >
          <Stack spacing={2}>
            <FormField label="First Name" required />
            <FormField label="Last Name" required />
            <FormField label="Email" type="email" />
            <FormField label="Phone" type="tel" />
          </Stack>
        </FormDialog>
      </>
    );
  },
};

export const WithLoading: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Form
        </Button>
        <FormDialog
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              setOpen(false);
            }, 2000);
          }}
          title="Add Patient"
          formActionsProps={{
            submitLabel: 'Add Patient',
            submitLoading: loading,
          }}
        >
          <Stack spacing={2}>
            <FormField label="First Name" required />
            <FormField label="Last Name" required />
          </Stack>
        </FormDialog>
      </>
    );
  },
};

export const LargeForm: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Large Form
        </Button>
        <FormDialog
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={() => {
            alert('Form submitted');
            setOpen(false);
          }}
          title="Patient Registration"
          maxWidth="md"
        >
          <Stack spacing={2}>
            <FormField label="First Name" required />
            <FormField label="Last Name" required />
            <FormField label="Email" type="email" required />
            <FormField label="Phone" type="tel" />
            <FormField label="Date of Birth" type="date" required />
            <FormField label="Address" />
            <FormField label="Notes" multiline rows={4} />
          </Stack>
        </FormDialog>
      </>
    );
  },
};
