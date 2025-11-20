import { ReactNode } from 'react';
import CalendarProvider from 'providers/CalendarProvider';

const Layout = ({ children }: { children: ReactNode }) => {
  return <CalendarProvider>{children}</CalendarProvider>;
};

export default Layout;
