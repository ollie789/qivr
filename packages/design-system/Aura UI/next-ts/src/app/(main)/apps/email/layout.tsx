import { PropsWithChildren } from 'react';
import EmailLayout from 'layouts/email-layout';

const Layout = ({ children }: PropsWithChildren) => {
  return <EmailLayout>{children}</EmailLayout>;
};

export default Layout;
