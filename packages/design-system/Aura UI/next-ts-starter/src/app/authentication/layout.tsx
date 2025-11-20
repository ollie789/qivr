import { PropsWithChildren } from 'react';
import AuthLayout from 'layouts/auth-layout';
import DefaultAuthLayout from 'layouts/auth-layout/DefaultAuthLayout';

const Layout = ({ children }: PropsWithChildren) => {
  return <AuthLayout>{children}</AuthLayout>;
};

export default Layout;
