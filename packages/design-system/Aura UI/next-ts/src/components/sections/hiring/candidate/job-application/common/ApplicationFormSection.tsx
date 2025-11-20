import { PropsWithChildren } from 'react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const ApplicationFormSection = ({ name, children }: PropsWithChildren<{ name: string }>) => {
  return (
    <Stack direction="column" gap={2}>
      <Typography variant="subtitle1" fontWeight={700}>
        {name}
      </Typography>
      {children}
    </Stack>
  );
};

export default ApplicationFormSection;
