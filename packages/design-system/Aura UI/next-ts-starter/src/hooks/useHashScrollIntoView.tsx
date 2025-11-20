import { useEffect } from 'react';
import { useHash } from 'hooks/useHash';

const useHashScrollIntoView = (
  scrollOptions: ScrollIntoViewOptions = {
    block: 'center',
    behavior: 'smooth',
  },
  delay: number = 100,
) => {
  const hash = useHash();

  useEffect(() => {
    setTimeout(() => {
      if (hash) {
        const id = hash.replace('#', '');
        const element = document.getElementById(id);

        if (element) {
          element.scrollIntoView(scrollOptions);
        }
      }
    }, delay);
  }, []);
};

export default useHashScrollIntoView;
