import { createContext, useContext, ReactNode } from 'react';

const BulkSelectContext = createContext<any>(null);

export const BulkSelectProvider = ({ children }: { children: ReactNode }) => {
  return <BulkSelectContext.Provider value={{}}>{children}</BulkSelectContext.Provider>;
};

export const useBulkSelect = () => useContext(BulkSelectContext);
export default BulkSelectProvider;
