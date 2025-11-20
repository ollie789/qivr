import { apiEndpoints } from 'routes/paths';
import useSWR, { SWRConfiguration } from 'swr';
import { ProductDetails } from 'types/ecommerce';
import { productFetcher } from '../dummyFetcher';

// import axiosFetcher from 'services/axios/axiosFetcher';

export const useGetProduct = (
  productId: string,
  config?: SWRConfiguration<ProductDetails | null>,
) => {
  const swr = useSWR<ProductDetails | null>(
    [apiEndpoints.getProduct(productId), { productId }],
    //In your real project use axiosFetcher instead of dummy productFetcher
    productFetcher,
    {
      suspense: true,
      ...config,
    },
  );

  return swr;
};
