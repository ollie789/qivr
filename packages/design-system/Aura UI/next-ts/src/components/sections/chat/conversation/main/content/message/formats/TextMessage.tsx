import { PropsWithChildren } from 'react';
import { Box, Typography } from '@mui/material';

interface TextMessageProps {
  messageType: string;
}

const TextMessage = ({ messageType, children }: PropsWithChildren<TextMessageProps>) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="body2"
        sx={{
          color: messageType === 'sent' ? 'primary.contrastText' : 'text.secondary',
        }}
      >
        {children}
      </Typography>
    </Box>
  );
};

export default TextMessage;
