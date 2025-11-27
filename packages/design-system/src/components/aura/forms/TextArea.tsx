import { TextField, TextFieldProps, Typography, Box } from '@mui/material';
import { forwardRef } from 'react';

export interface TextAreaProps extends Omit<TextFieldProps, 'multiline'> {
  maxLength?: number;
  showCount?: boolean;
}

export const TextArea = forwardRef<HTMLDivElement, TextAreaProps>(
  ({ maxLength, showCount = false, value = '', ...props }, ref) => {
    const length = String(value).length;

    return (
      <Box>
        <TextField
          ref={ref}
          multiline
          minRows={3}
          value={value}
          slotProps={{ htmlInput: { maxLength } }}
          {...props}
        />
        {showCount && maxLength && (
          <Typography variant="caption" color="text.secondary" sx={{ float: 'right', mt: 0.5 }}>
            {length}/{maxLength}
          </Typography>
        )}
      </Box>
    );
  }
);

TextArea.displayName = 'TextArea';
