import { ReactNode } from 'react';
import Stack from '@mui/material/Stack';
import FileManagerProvider from 'providers/FileManagerProvider';
import MainContent from 'components/sections/file-manager/main/MainContent';
import FileManagerSidebar from 'components/sections/file-manager/sidebar/FileManagerSidebar';

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <FileManagerProvider>
      <Stack sx={{ flexDirection: 'row', height: 1 }}>
        <FileManagerSidebar />
        <MainContent>{children}</MainContent>
      </Stack>
    </FileManagerProvider>
  );
};

export default Layout;
