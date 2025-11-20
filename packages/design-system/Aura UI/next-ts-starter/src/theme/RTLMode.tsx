'use client';

import { CacheProvider } from '@emotion/react';
import { PropsWithChildren, useEffect, useMemo } from 'react';
import createCache from '@emotion/cache';
import { useSettingsContext } from 'providers/SettingsProvider';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';

const createLtrCache = () =>
  createCache({
    key: 'aurora',
  });

const createRtlCache = () => {
  const cache = createCache({
    key: 'aurorartl',
    stylisPlugins: [prefixer, rtlPlugin],
  });
  cache.compat = true;
  return cache;
};

const RTLMode = ({ children }: PropsWithChildren) => {
  const {
    config: { textDirection },
  } = useSettingsContext();

  const cache = useMemo(
    () => (textDirection === 'rtl' ? createRtlCache() : createLtrCache()),
    [textDirection],
  );

  useEffect(() => {
    document.dir = textDirection;
  }, [textDirection]);

  return <CacheProvider value={cache}>{children}</CacheProvider>;
};

export default RTLMode;
