import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import { Stack } from '../layout';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmText?: string; // Alias for confirmLabel
  cancelLabel?: string;
  severity?: 'warning' | 'error' | 'info';
  loading?: boolean;
}

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  confirmText,
  cancelLabel = 'Cancel',
  severity = 'warning',
  loading = false,
}: ConfirmDialogProps) => {
  const finalConfirmLabel = confirmLabel || confirmText || 'Confirm';
  
  const colorMap = {
    warning: 'warning.main',
    error: 'error.main',
    info: 'info.main',
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" spacing={2} align="center">
          <Warning sx={{ color: colorMap[severity] }} />
          <Typography variant="h6">{title}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Typography>{message}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color={severity === 'error' ? 'error' : 'primary'}
          disabled={loading}
        >
          {loading ? 'Processing...' : finalConfirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
