import { Dialog as MuiDialog, DialogProps as MuiDialogProps, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { forwardRef, ReactNode } from 'react';

export interface AuraDialogProps extends Omit<MuiDialogProps, 'title'> {
  title?: string;
  actions?: ReactNode;
}

export const AuraDialog = forwardRef<HTMLDivElement, AuraDialogProps>(
  ({ title, actions, children, ...props }, ref) => {
    return (
      <MuiDialog ref={ref} {...props}>
        {title && <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>}
        <DialogContent>{children}</DialogContent>
        {actions && <DialogActions sx={{ px: 3, pb: 3 }}>{actions}</DialogActions>}
      </MuiDialog>
    );
  }
);

AuraDialog.displayName = 'AuraDialog';

export { DialogTitle, DialogContent, DialogActions };
