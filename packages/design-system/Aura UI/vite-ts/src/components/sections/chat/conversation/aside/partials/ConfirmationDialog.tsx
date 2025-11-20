import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

interface ConfirmationDialogProps {
  isOpen: boolean;
  handleConfirmation: {
    close: () => void;
    confirm: () => void;
  };
}

const ConfirmationDialog = ({ isOpen, handleConfirmation }: ConfirmationDialogProps) => {
  return (
    <Dialog maxWidth="xs" open={isOpen} onClose={handleConfirmation.close}>
      <DialogTitle sx={{ pt: 3 }}>Delete Conversation</DialogTitle>

      <DialogContent sx={{ pb: 2 }}>
        <DialogContentText>
          Are you sure you want to delete this conversation? This action cannot be undone.
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ pb: 3, px: 3, pt: 0 }}>
        <Button variant="soft" color="neutral" onClick={handleConfirmation.close}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleConfirmation.confirm} color="error" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;
