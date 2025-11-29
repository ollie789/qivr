import type { ReactNode } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  type DialogProps,
} from '@mui/material';
import { FormActions, type FormActionsProps } from '../forms/FormActions';

export interface FormDialogProps extends Omit<DialogProps, 'onSubmit' | 'title'> {
  title: ReactNode;
  onClose: () => void;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  formActionsProps?: Omit<FormActionsProps, 'onCancel' | 'onSubmit'>;
  /** Custom actions to render instead of FormActions */
  actions?: ReactNode;
}

export const FormDialog = ({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel,
  submitDisabled,
  loading,
  children,
  formActionsProps,
  actions,
  maxWidth = 'sm',
  ...dialogProps
}: FormDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth {...dialogProps}>
    <DialogTitle sx={{ pb: 1 }}>{title}</DialogTitle>
    <DialogContent sx={{ pt: 2 }}>{children}</DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      {actions ?? (
        <FormActions
          onCancel={onClose}
          onSubmit={onSubmit}
          submitLabel={submitLabel}
          submitDisabled={submitDisabled}
          submitLoading={loading}
          {...formActionsProps}
        />
      )}
    </DialogActions>
  </Dialog>
);
