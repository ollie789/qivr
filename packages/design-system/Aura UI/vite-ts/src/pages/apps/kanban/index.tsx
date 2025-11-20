import { PropsWithChildren } from 'react';
import KanbanProvider from 'providers/KanbanProvider';

const index = ({ children }: PropsWithChildren) => {
  return <KanbanProvider>{children}</KanbanProvider>;
};

export default index;
