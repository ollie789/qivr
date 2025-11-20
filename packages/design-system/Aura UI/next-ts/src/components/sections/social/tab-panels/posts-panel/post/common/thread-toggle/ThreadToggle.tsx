import { PropsWithChildren } from 'react';
import { Button } from '@mui/material';

interface ThreadToggleProps {
  handleToggle: () => void;
}

const ThreadToggle = ({ handleToggle, children }: PropsWithChildren<ThreadToggleProps>) => {
  return (
    <Button
      onClick={handleToggle}
      sx={{
        alignSelf: 'flex-start',
        textWrap: 'nowrap',
        position: 'relative',
      }}
    >
      {children}
    </Button>
  );
};

export default ThreadToggle;
