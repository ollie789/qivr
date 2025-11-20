import { useEffect } from 'react';
import { loadIcons } from '@iconify/react/dist/iconify.js';
import { icons } from 'lib/iconifyIcons';

const loadPreIcons = (icons: string[]) => {
  return new Promise((fulfill, reject) => {
    loadIcons(icons, (loaded, missing, pending) => {
      if (pending.length) {
        return;
      }
      if (missing.length) {
        reject({
          loaded,
          missing,
        });
      } else {
        fulfill({
          loaded,
        });
      }
    });
  });
};

const useIcons = () => {
  const preloadIcons = async () => {
    try {
      await loadPreIcons(icons);
    } catch (err) {
      console.error('Error loading icons:', err.missing);
    }
  };

  useEffect(() => {
    preloadIcons();
  }, []);
};

export default useIcons;
