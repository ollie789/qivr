import { useMemo } from 'react';
import { currencyFormat, getCurrencySymbol, numberFormat } from 'lib/utils';
import { languages } from 'locales/languages';
import { useSettingsContext } from 'providers/SettingsProvider';

const useNumberFormat = () => {
  const {
    config: { locale },
  } = useSettingsContext();

  const language = useMemo(() => {
    return languages.find((lang) => lang.locale === locale) || languages[0];
  }, [locale]);

  return {
    currencyFormat: (amount: number, options?: Intl.NumberFormatOptions) =>
      currencyFormat(amount, locale, {
        currency: language.currency,
        ...options,
      }),
    numberFormat: (number: number, options?: Intl.NumberFormatOptions) =>
      numberFormat(number, locale, options),
    currencySymbol: getCurrencySymbol(language.currency, locale),
  };
};

export default useNumberFormat;
