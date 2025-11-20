import { ReactNode } from 'react';
import { useScrollSpyContext } from '.';

interface ScrollSpyNavItemProps {
  children: ReactNode | ((props: { activeElemId: string }) => ReactNode);
}

const ScrollSpyNavItem = ({ children }: ScrollSpyNavItemProps) => {
  const { activeElemId } = useScrollSpyContext();

  if (typeof children === 'function') {
    return children({ activeElemId });
  }

  return children;
};

export default ScrollSpyNavItem;
