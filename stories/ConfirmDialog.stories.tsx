import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@mui/material';
import { ConfirmDialog } from '@qivr/design-system';

const meta: Meta<typeof ConfirmDialog> = {
  title: 'Dialogs/ConfirmDialog',
  component: ConfirmDialog,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ConfirmDialog>;

export const Warning: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open Warning Dialog
        </Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            alert('Confirmed');
            setOpen(false);
          }}
          title="Confirm Action"
          message="Are you sure you want to proceed with this action?"
          severity="warning"
        />
      </>
    );
  },
};

export const Error: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="contained" color="error" onClick={() => setOpen(true)}>
          Delete Patient
        </Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            alert('Deleted');
            setOpen(false);
          }}
          title="Delete Patient"
          message="Are you sure you want to delete this patient? This action cannot be undone."
          confirmLabel="Delete"
          severity="error"
        />
      </>
    );
  },
};

export const Info: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Show Info
        </Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            alert('Confirmed');
            setOpen(false);
          }}
          title="Information"
          message="This is an informational message that requires confirmation."
          severity="info"
        />
      </>
    );
  },
};

export const Loading: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    return (
      <>
        <Button variant="contained" onClick={() => setOpen(true)}>
          Open with Loading
        </Button>
        <ConfirmDialog
          open={open}
          onClose={() => setOpen(false)}
          onConfirm={() => {
            setLoading(true);
            setTimeout(() => {
              setLoading(false);
              setOpen(false);
            }, 2000);
          }}
          title="Confirm Action"
          message="Click confirm to see loading state"
          loading={loading}
        />
      </>
    );
  },
};
