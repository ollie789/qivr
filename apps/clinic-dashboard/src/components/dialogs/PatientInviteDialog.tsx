import React, { useState } from 'react';
import { TextField, Alert } from '@mui/material';
import { DialogSection, FormSection, FormRow, FormDialog } from '@qivr/design-system';

interface PatientInviteDialogProps {
  open: boolean;
  onClose: () => void;
  onInvite: (email: string, firstName: string, lastName: string) => Promise<void>;
}

export const PatientInviteDialog: React.FC<PatientInviteDialogProps> = ({
  open,
  onClose,
  onInvite
}) => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (!email || !firstName || !lastName) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onInvite(email, firstName, lastName);
      setSuccess('Patient invitation sent successfully!');
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setError('');
    setSuccess('');
    setLoading(false);
    onClose();
  };

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title="Invite New Patient"
      onSubmit={handleSubmit}
      submitLabel="Send Invitation"
      submitDisabled={loading || success !== ''}
      loading={loading}
      maxWidth="sm"
    >
      <DialogSection>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        
        <FormSection
          title="Patient Information"
          description="Enter the patient's details to send an invitation"
        >
          <FormRow>
            <TextField
              fullWidth
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
            />
          </FormRow>
          
          <FormRow>
            <TextField
              fullWidth
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
            />
          </FormRow>
          
          <FormRow>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </FormRow>
        </FormSection>
      </DialogSection>
    </FormDialog>
  );
};
