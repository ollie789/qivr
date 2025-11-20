'use client';

import { PropsWithChildren } from 'react';
import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

interface LocalizationProviderProps extends PropsWithChildren {}

const LocalizationProvider = ({ children }: LocalizationProviderProps) => {
  return <MuiLocalizationProvider dateAdapter={AdapterDayjs}>{children}</MuiLocalizationProvider>;
};

export default LocalizationProvider;
