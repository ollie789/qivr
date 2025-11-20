'use client';

import { PropsWithChildren } from 'react';
import { Stack } from '@mui/material';
import { useNavContext } from 'layouts/main-layout/NavProvider';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import EmailProvider from 'providers/EmailProvider';

export interface EmailOutletContextValue {
  isDrawerOpen: boolean;
  toggleDrawer: () => void;
}

const EmailLayout = ({ children }: PropsWithChildren) => {
  const { topbarHeight } = useNavContext();
  const { up } = useBreakpoints();
  const upSm = up('sm');

  return (
    <EmailProvider>
      <Stack
        sx={({ mixins }) => ({
          height: mixins.contentHeight(
            topbarHeight,
            (upSm ? mixins.footer.sm : mixins.footer.xs) + 1,
          ),
        })}
      >
        {children}
      </Stack>
    </EmailProvider>
  );
};

export default EmailLayout;
