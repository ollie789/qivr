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
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  severity = 'warning',
  loading = false,
}: ConfirmDialogProps) => {
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
          {loading ? 'Processing...' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
