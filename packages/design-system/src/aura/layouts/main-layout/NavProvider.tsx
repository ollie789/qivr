import { createContext, useContext, ReactNode } from 'react';

const NavContext = createContext<any>(null);

export const NavProvider = ({ children }: { children: ReactNode }) => {
  return <NavContext.Provider value={{}}>{children}</NavContext.Provider>;
};

export const useNav = () => useContext(NavContext);
export const useNavContext = () => useContext(NavContext);
