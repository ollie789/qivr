import { createContext, useContext, ReactNode } from 'react';

const KanbanContext = createContext<any>(null);

export const KanbanProvider = ({ children }: { children: ReactNode }) => {
  return <KanbanContext.Provider value={{}}>{children}</KanbanContext.Provider>;
};

export const useKanban = () => useContext(KanbanContext);
export default KanbanProvider;
