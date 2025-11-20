import {
  Dispatch,
  MutableRefObject,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

export type ScrollSpyOffSet =
  | {
      top?: number;
      bottom?: number;
    }
  | number;

type SectionRef = {
  [key: string]: { element: HTMLElement | null; offset?: ScrollSpyOffSet };
};

interface ScrollSpyProps {
  offset?: ScrollSpyOffSet;
}

interface ScrollSpyContextInterface {
  activeElemId: string;
  setActiveElemId: Dispatch<SetStateAction<string>>;
  sectionRefs: MutableRefObject<SectionRef>;
}

export const ScrollSpyContext = createContext({} as ScrollSpyContextInterface);

const ScrollSpy = ({ children, offset: globalOffset }: PropsWithChildren<ScrollSpyProps>) => {
  const [activeElemId, setActiveElemId] = useState('');
  const sectionRefs = useRef<SectionRef>({});
  const lastScrollTopRef = useRef(0);

  const isInView = ({
    element,
    offset,
  }: {
    element: HTMLElement | null;
    offset?: ScrollSpyOffSet;
  }) => {
    if (!element) {
      return false;
    }
    let topOffset = 0;
    let bottomOffset = 0;

    if (!offset) {
      offset = globalOffset;
    }

    if (offset) {
      if (typeof offset === 'number') {
        topOffset = offset;
        bottomOffset = offset;
      } else {
        topOffset = offset.top ?? 0;
        bottomOffset = offset.bottom ?? 0;
      }
    }

    const rect = element.getBoundingClientRect();

    return (
      (rect.top >= 0 && rect.top <= window.innerHeight - topOffset) ||
      (rect.bottom >= bottomOffset && rect.bottom <= window.innerHeight - topOffset)
    );
  };

  const spy = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;

    let toUp = false;
    if (scrollTop > lastScrollTopRef.current) {
      toUp = false;
    } else {
      toUp = true;
    }
    lastScrollTopRef.current = scrollTop <= 0 ? 0 : scrollTop;

    const items: string[] = [];
    Object.values(sectionRefs.current).forEach((item) => {
      if (item.element && isInView(item)) {
        items.push(item.element.id);
      }
    });

    if (!items.length) {
      return;
    }

    if (toUp) {
      setActiveElemId(items[0]);
    } else {
      setActiveElemId(items[items.length - 1]);
    }
  }, [globalOffset]);

  useEffect(() => {
    spy();
    window.addEventListener('scroll', spy);
    return () => {
      window.removeEventListener('scroll', spy);
    };
  }, [spy]);

  return (
    <ScrollSpyContext
      value={{
        activeElemId,
        setActiveElemId,
        sectionRefs,
      }}
    >
      {children}
    </ScrollSpyContext>
  );
};

export const useScrollSpyContext = () => use(ScrollSpyContext);

export default ScrollSpy;
