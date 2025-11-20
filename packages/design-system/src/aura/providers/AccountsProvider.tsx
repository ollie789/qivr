import { createContext, useContext, ReactNode } from 'react';

const AccountsContext = createContext<any>(null);

export const AccountsProvider = ({ children }: { children: ReactNode }) => {
  return <AccountsContext.Provider value={{}}>{children}</AccountsContext.Provider>;
};

export const useAccounts = () => useContext(AccountsContext);
export default AccountsProvider;
