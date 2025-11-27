import { Button, ButtonProps, Popover, Stack, Typography } from '@mui/material';
import { useState, useRef } from 'react';

export interface ConfirmButtonProps extends ButtonProps {
  confirmTitle?: string;
  confirmText?: string;
  onConfirm: () => void;
}

export const ConfirmButton = ({ confirmTitle = 'Confirm', confirmText = 'Are you sure?', onConfirm, children, ...props }: ConfirmButtonProps) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button ref={anchorRef} onClick={() => setOpen(true)} {...props}>{children}</Button>
      <Popover open={open} anchorEl={anchorRef.current} onClose={() => setOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Stack spacing={1} p={2} sx={{ maxWidth: 200 }}>
          <Typography variant="subtitle2">{confirmTitle}</Typography>
          <Typography variant="body2" color="text.secondary">{confirmText}</Typography>
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button size="small" onClick={() => setOpen(false)}>Cancel</Button>
            <Button size="small" variant="contained" color="error" onClick={() => { onConfirm(); setOpen(false); }}>Confirm</Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
};
