import { createContext, useContext, ReactNode } from 'react';

const HiringContext = createContext<any>(null);

export const HiringProvider = ({ children }: { children: ReactNode }) => {
  return <HiringContext.Provider value={{}}>{children}</HiringContext.Provider>;
};

export const useHiring = () => useContext(HiringContext);
export default HiringProvider;
