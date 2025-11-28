import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook for scrolling to element based on URL hash
 * Useful for anchor links and table of contents navigation
 * @param scrollOptions - Options passed to scrollIntoView
 * @param delay - Delay in ms before scrolling (allows DOM to settle)
 */
const useHashScrollIntoView = (
  scrollOptions: ScrollIntoViewOptions = {
    block: 'center',
    behavior: 'smooth',
  },
  delay: number = 100,
) => {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;

    const timeoutId = setTimeout(() => {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);

      if (element) {
        element.scrollIntoView(scrollOptions);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [hash, delay, scrollOptions]);
};

export default useHashScrollIntoView;
