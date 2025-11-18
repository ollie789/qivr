import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeProvider');
  }
  return context;
};

export const ThemeModeProvider: React.FC<{ value: ThemeContextType; children: React.ReactNode }> = ({ value, children }) => (
  <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
);
