import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ecomCoupons, products } from 'data/e-commerce/products';
import { useSnackbar } from 'notistack';
import { CartItem, Coupon, ProductDetails } from 'types/ecommerce';

interface EcommerceContextInterface {
  product: CartItem | null;
  setProduct: Dispatch<SetStateAction<CartItem | null>>;
  cartItems: CartItem[];
  setCartItems: Dispatch<SetStateAction<CartItem[]>>;
  addItemToCart: (product: ProductDetails) => void;
  removeItemFromCart: (productId: number) => void;
  updateCartItem: (itemId: number, updatedData: Partial<CartItem>) => void;
  appliedCoupon: Coupon | null;
  setAppliedCoupon: Dispatch<SetStateAction<Coupon | null>>;
  cartSubTotal: number;
  cartTotal: number;
}

export const EcommerceContext = createContext({} as EcommerceContextInterface);

const initialCartItems = products
  .slice(0, 2)
  .map((product) => ({ ...product, quantity: 1, selected: true }));

const EcommerceProvider = ({ children }: PropsWithChildren) => {
  const { enqueueSnackbar } = useSnackbar();

  const [product, setProduct] = useState<CartItem | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(ecomCoupons[0]);

  const addItemToCart = useCallback(
    (product: ProductDetails) => {
      const existingItem = cartItems.find((item) => item.id === product.id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;

      if (existingItem) {
        setCartItems((prev) =>
          prev.map((item) => (item.id === product.id ? { ...item, quantity: newQuantity } : item)),
        );
      } else {
        setCartItems((prev) => [...prev, { ...product, quantity: newQuantity, selected: true }]);
      }
      enqueueSnackbar('Added to the cart successfully!', { variant: 'success' });
    },
    [cartItems],
  );

  const removeItemFromCart = useCallback(
    (productId: number) => {
      setCartItems(cartItems.filter((item) => item.id !== productId));
    },
    [cartItems],
  );

  const updateCartItem = useCallback(
    (itemId: number, updatedData: Partial<CartItem>) => {
      const updatedItems = cartItems.map((item) =>
        item.id === itemId ? { ...item, ...updatedData } : item,
      );
      setCartItems(updatedItems);
    },
    [cartItems],
  );

  const cartSubTotal = useMemo(
    () =>
      cartItems
        .filter((item) => item.selected)
        .reduce((acc, item) => {
          acc += item.price.discounted * item.quantity;

          return acc;
        }, 0),
    [cartItems],
  );

  const cartTotal = useMemo(() => {
    return cartSubTotal - (appliedCoupon?.appliedDiscount || 0);
  }, [cartSubTotal, appliedCoupon]);

  useEffect(() => {
    setAppliedCoupon((prevCoupon) =>
      prevCoupon
        ? {
            ...prevCoupon,
            appliedDiscount:
              (appliedCoupon?.appliedDiscount || 0) > cartSubTotal ? 0 : prevCoupon.discount,
          }
        : prevCoupon,
    );
  }, [cartSubTotal]);

  return (
    <EcommerceContext
      value={{
        product,
        setProduct,
        cartItems,
        setCartItems,
        addItemToCart,
        removeItemFromCart,
        updateCartItem,
        appliedCoupon,
        setAppliedCoupon,
        cartSubTotal,
        cartTotal,
      }}
    >
      {children}
    </EcommerceContext>
  );
};

export const useEcommerce = () => use(EcommerceContext);

export default EcommerceProvider;
