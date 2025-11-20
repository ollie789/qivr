import { ReactNode } from 'react';
import KanbanProvider from 'providers/KanbanProvider';

const Layout = ({ children }: { children: ReactNode }) => {
  return <KanbanProvider>{children}</KanbanProvider>;
};

export default Layout;
