import {
  PropsWithChildren,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { ProductDetails } from 'types/ecommerce';

interface ProductsContextInterface {
  filterItems: { value: string; filter: string }[];
  visibleProducts: ProductDetails[];
  handleDeleteFilterItem: (item: { value: string; filter: string }) => void;
  handleResetFilters: () => void;
  handleProductsSort: (sortBy: string) => void;
}

export const ProductsContext = createContext({} as ProductsContextInterface);

const ProductsProvider = ({
  children,
  products,
}: PropsWithChildren<{ products: ProductDetails[] }>) => {
  const [visibleProducts, setVisibleProducts] = useState<ProductDetails[]>(products);
  const methods = useForm();
  const { setValue, getValues, reset, watch, handleSubmit } = methods;
  const formValues = getValues();

  const filterItems = useMemo(() => {
    return Object.keys(formValues).reduce(
      (acc: { value: string; filter: string }[], key) => {
        if (key !== 'priceRange') {
          formValues[key].forEach((element: string) => {
            acc.push({
              value: element,
              filter: key,
            });
          });
        }

        return acc;
      },
      [] as { value: string; filter: string }[],
    );
  }, [formValues]);

  const handleDeleteFilterItem = useCallback(
    (item: { value: string; filter: string }) => {
      setValue(
        item.filter,
        formValues[item.filter].filter((value: string) => value !== item.value),
      );
    },
    [formValues],
  );

  const handleProductsSort = useCallback(
    (sortBy: string) => {
      switch (sortBy) {
        case 'recommended':
          onSubmit(formValues);
          break;
        case 'lowToHight':
          setVisibleProducts((prev) =>
            [...prev].sort((a, b) => a.price.discounted - b.price.discounted),
          );
          break;
        case 'highToLow':
          setVisibleProducts((prev) =>
            [...prev].sort((a, b) => b.price.discounted - a.price.discounted),
          );
          break;
        case 'highestRated':
          setVisibleProducts((prev) => [...prev].sort((a, b) => b.ratings - a.ratings));
          break;
        default:
          onSubmit(formValues);
      }
    },
    [formValues],
  );

  const handleResetFilters = useCallback(() => {
    reset();
  }, []);

  const onSubmit = (data: FieldValues) => {
    const filteredProducts = products.filter((product) => {
      return Object.keys(data).every((key) => {
        if (data[key].length === 0) {
          return true;
        }
        if (key === 'priceRange') {
          const [min, max] = data[key];

          return product.price.discounted >= min && product.price.discounted <= max;
        } else {
          const productValues = product[key as keyof ProductDetails] as string[];

          return productValues.some((value: string) => data[key].includes(value));
        }
      });
    });

    setVisibleProducts(filteredProducts);
  };

  useEffect(() => {
    const subscription = watch(() => handleSubmit(onSubmit));

    return () => subscription.unsubscribe();
  }, [handleSubmit, watch]);

  return (
    <ProductsContext
      value={{
        filterItems,
        visibleProducts,
        handleDeleteFilterItem,
        handleResetFilters,
        handleProductsSort,
      }}
    >
      <FormProvider {...methods}>{children}</FormProvider>
    </ProductsContext>
  );
};

export const useProducts = () => use(ProductsContext);

export default ProductsProvider;
