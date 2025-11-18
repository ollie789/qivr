import { Button, type ButtonProps } from '@mui/material';
import { Stack } from '../layout';

export interface FormActionsProps {
  onCancel?: () => void;
  onSubmit?: () => void;
  cancelLabel?: string;
  submitLabel?: string;
  submitDisabled?: boolean;
  submitLoading?: boolean;
  cancelProps?: ButtonProps;
  submitProps?: ButtonProps;
  align?: 'left' | 'center' | 'right';
}

export const FormActions = ({
  onCancel,
  onSubmit,
  cancelLabel = 'Cancel',
  submitLabel = 'Submit',
  submitDisabled = false,
  submitLoading = false,
  cancelProps,
  submitProps,
  align = 'right',
}: FormActionsProps) => {
  const justifyMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  return (
    <Stack direction="row" spacing={2} justify={justifyMap[align]}>
      {onCancel && (
        <Button
          variant="outlined"
          onClick={onCancel}
          {...cancelProps}
        >
          {cancelLabel}
        </Button>
      )}
      {onSubmit && (
        <Button
          variant="contained"
          onClick={onSubmit}
          disabled={submitDisabled || submitLoading}
          {...submitProps}
        >
          {submitLoading ? 'Submitting...' : submitLabel}
        </Button>
      )}
    </Stack>
  );
};
