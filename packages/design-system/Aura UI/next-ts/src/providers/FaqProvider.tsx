import { PropsWithChildren, createContext, use, useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { FaqCategory, faqCategories } from 'data/faqs';
import useHashScrollIntoView from 'hooks/useHashScrollIntoView';
import { kebabCase } from 'lib/utils';
import paths from 'routes/paths';
import { useScrollSpyContext } from 'components/scroll-spy';

interface FaqContextInterface {
  activeCategory: FaqCategory | null;
  drawerOpen: boolean;
  activeFaqItem: string;
  handleDrawerOpen: () => void;
  handleDrawerClose: () => void;
  handleActiveItemChange: (id: string) => void;
}

export const FaqContext = createContext({} as FaqContextInterface);

const FaqProvider = ({ children }: PropsWithChildren) => {
  const [activeCategory, setActiveCategory] = useState<FaqCategory | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFaqItem, setActiveFaqItem] = useState('');
  const { category } = useParams();
  const router = useRouter();
  const { setActiveElemId } = useScrollSpyContext();

  useHashScrollIntoView({
    behavior: 'smooth',
  });

  useEffect(() => {
    const faqCategory = faqCategories.find((item) => item.slug === category);
    if (!faqCategory) {
      router.push(paths[404]);
    } else {
      setActiveCategory(faqCategory);
      setActiveFaqItem(faqCategory.items[0].question);
      setActiveElemId(kebabCase(faqCategory.items[0].question));
    }
  }, [router, category]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const handleActiveItemChange = (id: string) => {
    setActiveFaqItem(id);
  };

  return (
    <FaqContext
      value={{
        activeCategory,
        drawerOpen,
        activeFaqItem,
        handleDrawerOpen,
        handleDrawerClose,
        handleActiveItemChange,
      }}
    >
      {children}
    </FaqContext>
  );
};

export const useFaqContext = () => use(FaqContext);

export default FaqProvider;
