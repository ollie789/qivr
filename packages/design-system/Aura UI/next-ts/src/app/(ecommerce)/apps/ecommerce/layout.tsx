import { PropsWithChildren } from 'react';
import EcommerceLayout from 'layouts/ecommerce-layout';

const Layout = ({ children }: PropsWithChildren) => {
  return <EcommerceLayout>{children}</EcommerceLayout>;
};

export default Layout;
