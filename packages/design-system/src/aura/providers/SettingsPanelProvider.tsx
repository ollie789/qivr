import { createContext, useContext, ReactNode } from 'react';

const SettingsPanelContext = createContext<any>(null);

export const SettingsPanelProvider = ({ children }: { children: ReactNode }) => {
  return <SettingsPanelContext.Provider value={{}}>{children}</SettingsPanelContext.Provider>;
};

export const useSettingsPanel = () => useContext(SettingsPanelContext);
export default SettingsPanelProvider;
