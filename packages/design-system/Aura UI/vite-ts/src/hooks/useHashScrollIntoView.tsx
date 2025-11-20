import { useEffect } from 'react';
import { useLocation } from 'react-router';

const useHashScrollIntoView = (
  scrollOptions: ScrollIntoViewOptions = {
    block: 'center',
    behavior: 'smooth',
  },
  delay: number = 100,
) => {
  const { hash } = useLocation();

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
