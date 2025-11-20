import { Dispatch, PropsWithChildren, createContext, use, useEffect, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { Config, initialConfig } from 'config';
import { getColor } from 'helpers/echart-utils';
import { getItemFromStore } from 'lib/utils';
import {
  ACTIONTYPE,
  COLLAPSE_NAVBAR,
  EXPAND_NAVBAR,
  SET_CONFIG,
  settingsReducer,
} from 'reducers/SettingsReducer';

interface SettingsContextInterFace {
  config: Config;
  configDispatch: Dispatch<ACTIONTYPE>;
  setConfig: (payload: Partial<Config>) => void;
  handleDrawerToggle: () => void;
  toggleNavbarCollapse: () => void;
  getThemeColor: (color: string) => string;
}

export const SettingsContext = createContext({} as SettingsContextInterFace);

const SettingsProvider = ({ children }: PropsWithChildren) => {
  const configState: Config = {
    ...initialConfig,
    sidenavCollapsed: getItemFromStore('sidenavCollapsed', initialConfig.sidenavCollapsed),
    sidenavType: getItemFromStore('sidenavType', initialConfig.sidenavType),
    topnavType: getItemFromStore('topnavType', initialConfig.topnavType),
    textDirection: getItemFromStore('textDirection', initialConfig.textDirection),
    navigationMenuType: getItemFromStore('navigationMenuType', initialConfig.navigationMenuType),
    navColor: getItemFromStore('navColor', initialConfig.navColor),
    locale: getItemFromStore('locale', initialConfig.locale),
  };
  const [config, configDispatch] = useReducer(settingsReducer, configState);
  const { i18n } = useTranslation();

  const setConfig = (payload: Partial<Config>) => {
    configDispatch({
      type: SET_CONFIG,
      payload,
    });
  };

  const handleDrawerToggle = () => {
    setConfig({
      openNavbarDrawer: !config.openNavbarDrawer,
    });
  };

  const toggleNavbarCollapse = () => {
    if (config.sidenavCollapsed) {
      configDispatch({
        type: EXPAND_NAVBAR,
      });
    } else {
      configDispatch({
        type: COLLAPSE_NAVBAR,
      });
    }
  };

  const getThemeColor = (color: string) => {
    return getColor(color);
  };

  useEffect(() => {
    i18n.changeLanguage(config.locale.split('-').join(''));
  }, [config.locale]);

  return (
    <SettingsContext
      value={{
        config,
        configDispatch,
        setConfig,
        handleDrawerToggle,
        toggleNavbarCollapse,
        getThemeColor,
      }}
    >
      {children}
    </SettingsContext>
  );
};

export const useSettingsContext = () => use(SettingsContext);

export default SettingsProvider;
