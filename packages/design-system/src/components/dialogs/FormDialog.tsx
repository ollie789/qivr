import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  type DialogProps,
} from '@mui/material';
import { FormActions, type FormActionsProps } from '../forms/FormActions';

export interface FormDialogProps extends Omit<DialogProps, 'onSubmit'> {
  title: string;
  onClose: () => void;
  onSubmit?: () => void;
  children: React.ReactNode;
  formActionsProps?: Omit<FormActionsProps, 'onCancel' | 'onSubmit'>;
}

export const FormDialog = ({
  open,
  title,
  onClose,
  onSubmit,
  children,
  formActionsProps,
  maxWidth = 'sm',
  ...dialogProps
}: FormDialogProps) => (
  <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth {...dialogProps}>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>{children}</DialogContent>
    {(onClose || onSubmit) && (
      <DialogActions>
        <FormActions
          onCancel={onClose}
          onSubmit={onSubmit}
          {...formActionsProps}
        />
      </DialogActions>
    )}
  </Dialog>
);
