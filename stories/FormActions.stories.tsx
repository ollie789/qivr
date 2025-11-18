import type { Meta, StoryObj } from '@storybook/react';
import { FormActions } from './FormActions';

const meta: Meta<typeof FormActions> = {
  title: 'Forms/FormActions',
  component: FormActions,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FormActions>;

export const Default: Story = {
  args: {
    onCancel: () => alert('Cancelled'),
    onSubmit: () => alert('Submitted'),
  },
};

export const CustomLabels: Story = {
  args: {
    onCancel: () => alert('Cancelled'),
    onSubmit: () => alert('Submitted'),
    cancelLabel: 'Go Back',
    submitLabel: 'Save Changes',
  },
};

export const Loading: Story = {
  args: {
    onCancel: () => alert('Cancelled'),
    onSubmit: () => alert('Submitted'),
    submitLoading: true,
  },
};

export const Disabled: Story = {
  args: {
    onCancel: () => alert('Cancelled'),
    onSubmit: () => alert('Submitted'),
    submitDisabled: true,
  },
};

export const LeftAligned: Story = {
  args: {
    onCancel: () => alert('Cancelled'),
    onSubmit: () => alert('Submitted'),
    align: 'left',
  },
};

export const CenterAligned: Story = {
  args: {
    onCancel: () => alert('Cancelled'),
    onSubmit: () => alert('Submitted'),
    align: 'center',
  },
};

export const OnlySubmit: Story = {
  args: {
    onSubmit: () => alert('Submitted'),
    submitLabel: 'Continue',
  },
};
