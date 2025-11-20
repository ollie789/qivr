import { createContext, useContext, ReactNode } from 'react';

const EcommerceContext = createContext<any>(null);

export const EcommerceProvider = ({ children }: { children: ReactNode }) => {
  return <EcommerceContext.Provider value={{}}>{children}</EcommerceContext.Provider>;
};

export const useEcommerce = () => useContext(EcommerceContext);
export default EcommerceProvider;
