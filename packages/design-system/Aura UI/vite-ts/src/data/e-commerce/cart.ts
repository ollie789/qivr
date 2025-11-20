import { initialConfig } from 'config';

export interface CartItem {
  id: number;
  name: string;
  image: string;
  stock: number;
  price: {
    regular: number;
    discounted: number;
  };
}

export const cart: CartItem[] = [
  {
    id: 1,
    name: 'VINGLI 56" Modern Sofa, Small Corduroy Couch Deep Seat for Living Room, Bedroom, Apartment,Office, Dorm, Small Space',
    image: `${initialConfig.assetsDir}/images/ecommerce/products/96x96/1.webp`,
    stock: 5,
    price: {
      regular: 1600,
      discounted: 1000,
    },
  },
  {
    id: 2,
    name: 'VINGLI 56" Modern Sofa, Small Corduroy Couch Deep Seat for Living Room, Bedroom, Apartment,Office, Dorm, Small Space',
    image: `${initialConfig.assetsDir}/images/ecommerce/products/96x96/1.webp`,
    stock: 4,
    price: {
      regular: 1600,
      discounted: 1000,
    },
  },
  {
    id: 3,
    name: 'VINGLI 56" Modern Sofa, Small Corduroy Couch Deep Seat for Living Room, Bedroom, Apartment,Office, Dorm, Small Space',
    image: `${initialConfig.assetsDir}/images/ecommerce/products/96x96/1.webp`,
    stock: 10,
    price: {
      regular: 1600,
      discounted: 1000,
    },
  },
];
