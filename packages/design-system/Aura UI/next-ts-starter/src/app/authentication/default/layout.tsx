'use client';

import { PropsWithChildren } from 'react';
import DefaultAuthLayout from 'layouts/auth-layout/DefaultAuthLayout';

const Layout = ({ children }: PropsWithChildren) => {
  return <DefaultAuthLayout>{children}</DefaultAuthLayout>;
};

export default Layout;
