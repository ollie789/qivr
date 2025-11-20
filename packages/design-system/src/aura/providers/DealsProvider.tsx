import { createContext, useContext, ReactNode } from 'react';

const DealsContext = createContext<any>(null);

export const DealsProvider = ({ children }: { children: ReactNode }) => {
  return <DealsContext.Provider value={{}}>{children}</DealsContext.Provider>;
};

export const useDeals = () => useContext(DealsContext);
export default DealsProvider;
