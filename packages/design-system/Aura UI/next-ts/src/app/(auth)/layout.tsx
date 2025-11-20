import { PropsWithChildren } from 'react';
import AuthLayout from 'layouts/auth-layout';

const Layout = ({ children }: PropsWithChildren) => {
  return <AuthLayout>{children}</AuthLayout>;
};

export default Layout;
