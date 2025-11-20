import { createContext, useContext, ReactNode } from 'react';

type SettingsContextType = {
  config: {
    assetsDir: string;
    [key: string]: any;
  };
};

const SettingsContext = createContext<SettingsContextType>({
  config: {
    assetsDir: '/assets',
  },
});

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const value = {
    config: {
      assetsDir: '/assets',
    },
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettingsContext = () => {
  return useContext(SettingsContext);
};
