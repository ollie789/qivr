'use client';

import { ReactNode, useEffect, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useThemeMode } from 'hooks/useThemeMode';
import SettingsPanelProvider from 'providers/SettingsPanelProvider';
import { useSettingsContext } from 'providers/SettingsProvider';
import { REFRESH } from 'reducers/SettingsReducer';
import SettingsPanel from 'components/settings-panel/SettingsPanel';

const SettingPanelToggler = dynamic(() => import('components/settings-panel/SettingPanelToggler'), {
  ssr: false,
});

const App = ({
  children,
}: Readonly<{
  children: ReactNode;
}>) => {
  const pathname = usePathname();
  const { mode } = useThemeMode();
  const { configDispatch } = useSettingsContext();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useLayoutEffect(() => {
    configDispatch({ type: REFRESH });
  }, [mode]);

  return (
    <SettingsPanelProvider>
      {children}
      <SettingsPanel />
      <SettingPanelToggler />
    </SettingsPanelProvider>
  );
};

export default App;
