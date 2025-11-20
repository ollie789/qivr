import { PropsWithChildren } from 'react';
import MainLayout from 'layouts/main-layout';

const Layout = ({ children }: PropsWithChildren) => {
  return <MainLayout>{children}</MainLayout>;
};

export default Layout;
