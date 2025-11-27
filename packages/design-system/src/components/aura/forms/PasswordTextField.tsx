import { useState, forwardRef } from 'react';
import { IconButton, InputAdornment, TextField, TextFieldProps } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export const PasswordTextField = forwardRef<HTMLDivElement, TextFieldProps>(
  (props, ref) => {
    const [visible, setVisible] = useState(false);

    return (
      <TextField
        ref={ref}
        type={visible ? 'text' : 'password'}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setVisible(!visible)} edge="end" size="small">
                  {visible ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        {...props}
      />
    );
  }
);

PasswordTextField.displayName = 'PasswordTextField';
