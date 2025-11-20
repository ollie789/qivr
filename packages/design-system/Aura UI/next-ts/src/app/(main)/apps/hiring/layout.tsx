import { ReactNode } from 'react';
import HiringProvider from 'providers/HiringProvider';

const Layout = ({ children }: { children: ReactNode }) => {
  return <HiringProvider>{children}</HiringProvider>;
};

export default Layout;
