import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { FormSection } from './FormSection';
import { FormRow } from './FormRow';
import { QivrCard } from '../QivrCard';
import { QivrButton } from '../QivrButton';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import MenuItem from '@mui/material/MenuItem';

// FormSection Stories
const formSectionMeta: Meta<typeof FormSection> = {
  title: 'Design System/Forms/FormSection',
  component: FormSection,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default formSectionMeta;
type FormSectionStory = StoryObj<typeof formSectionMeta>;

export const Basic: FormSectionStory = {
  args: {
    title: 'Personal Information',
    description: 'Please provide your contact details',
    children: (
      <>
        <TextField fullWidth label="Full Name" sx={{ mb: 2 }} />
        <TextField fullWidth label="Email" type="email" sx={{ mb: 2 }} />
        <TextField fullWidth label="Phone" />
      </>
    ),
  },
};

export const WithDivider: FormSectionStory = {
  args: {
    title: 'Account Settings',
    description: 'Manage your account preferences',
    divider: true,
    children: (
      <>
        <TextField fullWidth label="Username" sx={{ mb: 2 }} />
        <TextField fullWidth label="Password" type="password" />
      </>
    ),
  },
};

export const NoHeader: FormSectionStory = {
  args: {
    children: (
      <>
        <TextField fullWidth label="Field 1" sx={{ mb: 2 }} />
        <TextField fullWidth label="Field 2" />
      </>
    ),
  },
};

// FormRow Stories
const formRowMeta: Meta<typeof FormRow> = {
  title: 'Design System/Forms/FormRow',
  component: FormRow,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export { formRowMeta as FormRowMeta };
type FormRowStory = StoryObj<typeof formRowMeta>;

export const TwoColumns: FormRowStory = {
  args: {
    children: (
      <>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="First Name" />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField fullWidth label="Last Name" />
        </Grid>
      </>
    ),
  },
};

export const ThreeColumns: FormRowStory = {
  args: {
    children: (
      <>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="City" />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="State" select>
            <MenuItem value="NSW">NSW</MenuItem>
            <MenuItem value="VIC">VIC</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="Postcode" />
        </Grid>
      </>
    ),
  },
};

export const CompleteFormExample: FormRowStory = {
  render: () => (
    <QivrCard sx={{ maxWidth: 800, mx: 'auto' }}>
      <FormSection
        title="Patient Registration"
        description="Enter the patient's information below"
      >
        <FormRow>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="First Name" required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Last Name" required />
          </Grid>
        </FormRow>

        <FormRow>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Email" type="email" required />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Phone" />
          </Grid>
        </FormRow>

        <FormRow>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Date of Birth" type="date" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField fullWidth label="Gender" select>
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </TextField>
          </Grid>
        </FormRow>

        <FormRow>
          <Grid item xs={12}>
            <TextField fullWidth label="Address" />
          </Grid>
        </FormRow>

        <FormRow>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="City" />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="State" select>
              <MenuItem value="NSW">NSW</MenuItem>
              <MenuItem value="VIC">VIC</MenuItem>
              <MenuItem value="QLD">QLD</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField fullWidth label="Postcode" />
          </Grid>
        </FormRow>

        <FormRow sx={{ mt: 2, mb: 0 }}>
          <Grid item xs={12} sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <QivrButton emphasize="subtle">Cancel</QivrButton>
            <QivrButton variant="contained">Save Patient</QivrButton>
          </Grid>
        </FormRow>
      </FormSection>
    </QivrCard>
  ),
};
