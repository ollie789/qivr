import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Send as SendIcon, Close as CloseIcon } from '@mui/icons-material';

export interface MessageComposerProps {
  open: boolean;
  onClose: () => void;
  onSend: (data: {
    subject: string;
    content: string;
    category?: string;
  }) => Promise<void>;
  defaultSubject?: string;
  defaultContent?: string;
  showCategorySelector?: boolean;
  categories?: string[];
  title?: string;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  open,
  onClose,
  onSend,
  defaultSubject = '',
  defaultContent = '',
  showCategorySelector = false,
  categories = ['General', 'Appointment', 'Medical', 'Billing', 'Administrative'],
  title = 'Send Message',
}) => {
  const [subject, setSubject] = useState(defaultSubject);
  const [content, setContent] = useState(defaultContent);
  const [category, setCategory] = useState('General');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!subject.trim() || !content.trim()) {
      setError('Subject and message are required');
      return;
    }

    setError(null);
    setSending(true);

    try {
      await onSend({
        subject,
        content,
        category: showCategorySelector ? category : undefined,
      });
      
      // Reset form
      setSubject('');
      setContent('');
      setCategory('General');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    if (!sending) {
      setSubject('');
      setContent('');
      setCategory('General');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      
      <DialogContent>
        {showCategorySelector && (
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            fullWidth
            margin="normal"
          >
            {categories.map((cat) => (
              <MenuItem key={cat} value={cat}>
                {cat}
              </MenuItem>
            ))}
          </TextField>
        )}

        <TextField
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          fullWidth
          margin="normal"
          required
        />

        <TextField
          label="Message"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          rows={8}
          fullWidth
          margin="normal"
          required
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} startIcon={<CloseIcon />} disabled={sending}>
          Cancel
        </Button>
        <Button
          onClick={handleSend}
          variant="contained"
          disabled={sending || !subject.trim() || !content.trim()}
          startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
        >
          {sending ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
