import { PropsWithChildren } from 'react';
import LandingLayout from 'layouts/landing-layout';

const Layout = ({ children }: PropsWithChildren) => {
  return <LandingLayout>{children}</LandingLayout>;
};

export default Layout;
