import { createContext, useContext, ReactNode } from 'react';

const EmailContext = createContext<any>(null);

export const EmailProvider = ({ children }: { children: ReactNode }) => {
  return <EmailContext.Provider value={{}}>{children}</EmailContext.Provider>;
};

export const useEmail = () => useContext(EmailContext);
export default EmailProvider;
