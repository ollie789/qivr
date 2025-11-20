import { products } from 'data/e-commerce/products';
import { getItemFromStore, setItemToStore } from 'lib/utils';
import { ProductDetails } from 'types/ecommerce';

export const sendPasswordResetLinkFetcher = () =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve('success');
    }, 1000);
  });

export const productFetcher = (args: any): Promise<ProductDetails | null> => {
  const [_url, { productId }] = args;

  return new Promise((resolve) => {
    setTimeout(() => {
      const product = products.find((product) => product.id === Number(productId));

      resolve(product || null);
    }, 1000);
  });
};
