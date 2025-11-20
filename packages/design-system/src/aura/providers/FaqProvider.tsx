import { createContext, useContext, ReactNode } from 'react';

const FaqContext = createContext<any>(null);

export const FaqProvider = ({ children }: { children: ReactNode }) => {
  return <FaqContext.Provider value={{}}>{children}</FaqContext.Provider>;
};

export const useFaq = () => useContext(FaqContext);
export default FaqProvider;
