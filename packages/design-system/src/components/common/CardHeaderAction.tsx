import { PropsWithChildren } from 'react';
import { Box, SxProps } from '@mui/material';

interface CardHeaderActionProps {
  sx?: SxProps;
}

const CardHeaderAction = ({ children, sx }: PropsWithChildren<CardHeaderActionProps>) => {
  return <Box sx={{ mx: '-10px', ...sx }}>{children}</Box>;
};

export default CardHeaderAction;
