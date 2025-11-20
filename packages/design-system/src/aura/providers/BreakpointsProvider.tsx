import { useTheme, useMediaQuery, Breakpoint } from '@mui/material';
import { createContext, useContext, ReactNode } from 'react';

type BreakpointsContextType = {
  up: (key: Breakpoint) => boolean;
  down: (key: Breakpoint) => boolean;
  only: (key: Breakpoint) => boolean;
  between: (start: Breakpoint, end: Breakpoint) => boolean;
  currentBreakpoint: Breakpoint;
};

const BreakpointsContext = createContext<BreakpointsContextType | null>(null);

const getCurrentBreakpoint = (theme: any): Breakpoint => {
  const keys: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  for (let i = keys.length - 1; i >= 0; i--) {
    if (window.matchMedia(theme.breakpoints.up(keys[i]).replace('@media ', '')).matches) {
      return keys[i];
    }
  }
  return 'xs';
};

export const BreakpointsProvider = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();
  
  const value = {
    up: (key: Breakpoint) => useMediaQuery(theme.breakpoints.up(key)),
    down: (key: Breakpoint) => useMediaQuery(theme.breakpoints.down(key)),
    only: (key: Breakpoint) => useMediaQuery(theme.breakpoints.only(key)),
    between: (start: Breakpoint, end: Breakpoint) => useMediaQuery(theme.breakpoints.between(start, end)),
    currentBreakpoint: getCurrentBreakpoint(theme),
  };

  return (
    <BreakpointsContext.Provider value={value}>
      {children}
    </BreakpointsContext.Provider>
  );
};

export const useBreakpoints = () => {
  const context = useContext(BreakpointsContext);
  if (!context) {
    throw new Error('useBreakpoints must be used within BreakpointsProvider');
  }
  return context;
};
