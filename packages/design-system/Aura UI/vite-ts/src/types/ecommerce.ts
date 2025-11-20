import { JSX } from 'react';
import { User } from './users';

export interface ProductSummary {
  id: number;
  product: {
    name: string;
    image: string;
  };
  vendors: User[];
  margin: number;
  sold: number;
  stock: string;
}

interface Image {
  color?: string;
  src: string;
}

export interface ProductDetails {
  id: number;
  name: string;
  images: Image[];
  variants?: {
    label: string;
    value: string;
  }[];
  vendors?: User[];
  tags: string[];
  ratings: number;
  reviews: number;
  price: {
    regular: number;
    discounted: number;
    offer?: string;
  };
  margin?: number;
  vat: number;
  sold: number;
  stock: number;
  availability: string[];
  sale?: string[];
  material?: string[];
  category?: string[];
  features?: string[];
}
export interface ProductListAdmin {
  id: number;
  name: string;
  image: Image;
  category: string;
  status: 'active' | 'inactive' | 'draft' | 'archive';
  price: {
    regular: number;
    discounted: number;
  };
  vendor: string;
  stock: number;
  publishedAt: string;
}

export interface CartItem extends ProductDetails {
  quantity: number;
  selected: boolean;
}

export type OrderStatus = 'Delivered' | 'Shipped' | 'Processing' | 'Pending';

export interface OrderItem extends ProductDetails {
  status: OrderStatus;
  quantity: number;
  variants: {
    label: string;
    value: string;
  }[];
  shopSku: string;
  sellerSku: string;
  vendor: string;
  shippingAddress: string;
  billingAddressSameAsShipping: boolean;
  billlingAddress: string;
  priorRefunds?: {
    product: number;
    shipping: number;
    concession: number;
  };
}

export interface OrderPayment {
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  status: string;
}

export interface OrderDetails {
  id: string;
  items: OrderItem[];
  status: string;
  payment: OrderPayment;
  activities: OrderActivities[];
  customer?: CustomerInfo;
  createdAt: Date | string;
}

export interface Invoice {
  id: string;
  order: OrderDetails;
}

export interface Variant {
  id: string;
  name: string;
  color: string;
  images: string[];
}

export interface Feature {
  label: string;
  icon: string;
}

export interface Category {
  id: string;
  label?: string;
  title?: string;
  url?: string;
  items?: Category[];
}

export interface PopularCategory {
  label: string;
  image: string;
  url: string;
}

export interface CategoryBanner {
  id: number;
  title: JSX.Element;
  image: string;
  url: string;
}
export interface ReviewTag {
  label: string;
  count?: number;
}
export interface ProductReview {
  id: number;
  user: {
    name: string;
    image: string;
  };
  rating: number;
  date: string;
  content: {
    title: string;
    body: string;
  };
  helpfulCount: number;
}
export interface Coupon {
  code: string;
  discount: number;
  appliedDiscount: number;
}

export interface TrackOrdersList {
  id: number;
  image: string;
  status: string;
  url: string;
}

export interface CustomerStat {
  wishlist: number;
  favourites: number;
  vouchers: number;
  toPay: number;
  toShip: number;
  toReceive: number;
  toReview: number;
}

export interface CustomerOrderTrack {
  product: ProductDetails;
  status: string;
}

export interface CustomerInfo {
  name: string;
  avatar: string;
  isStarMember: boolean;
  contactInfo: {
    email: string;
    phone: string;
    address: {
      shipping: string;
      billing: string;
      billingAddressSameAsShipping: boolean;
    };
  };
  conversations?: {
    id: number;
    icon: string;
    message: string;
  }[];
  fraudAnalysis?: {
    cvvInfo?: string;
  };
  tags?: string[];
  orderTracks: CustomerOrderTrack[];
  stats: CustomerStat;
}

export interface SummaryListItem {
  id: number;
  label: string;
  icon: string;
  url: string;
}

export interface CustomerServicesListItem {
  id: number;
  label: string;
  icon: string;
  url: string;
}

export interface OrderStatusListItem {
  id: number;
  label: string;
  icon: string;
  count: number;
  url: string;
}

export interface OrderListAdmin {
  id: string;
  date: string;
  customer: User;
  paymentStatus: 'paid' | 'due' | 'refunded' | 'cancelled';
  fulfillmentStatus: 'fulfilled' | 'partially fulfilled' | 'unfulfilled';
  shippingMethod: 'standard' | 'economy' | 'express';
  items: {
    product: ProductDetails;
    quantity: number;
  }[];
}

export interface OrderActivities {
  id: number;
  content: string;
  createdAt: Date;
}

export interface InvoiceListAdmin extends OrderListAdmin {
  invoiceId: string;
}

export interface FilterOption {
  label: string;
  value: string;
}
export interface ProductFilterOptions {
  availability?: FilterOption[];
  sale?: FilterOption[];
  material?: FilterOption[];
  category?: FilterOption[];
  features?: FilterOption[];
  price?: [number, number];
}

export interface OrderTrackDetails {
  id: string;
  number: string;
  orderDate: string | number;
  shipDate: string | number;
  shippingAddress: string;
  carrier: string;
  carrierTrackingNumber: string;
  tracks: {
    id: number;
    date: string;
    time: string;
    description: string;
    place: string;
  }[];
  trackSteps: {
    title: string;
    subtitle: string;
  }[];
}
