import { Dispatch, PropsWithChildren, createContext, use, useState } from 'react';
import { OrderDetails } from 'types/ecommerce';

interface OrderDetailsContextInterface {
  order: OrderDetails | null;
  setSetselectedOrder: Dispatch<React.SetStateAction<OrderDetails | null>>;
}

export const OrderDetailsContext = createContext({} as OrderDetailsContextInterface);

const OrderDetailsProvider = ({ children }: PropsWithChildren) => {
  const [selectedOrder, setSetselectedOrder] = useState(null);

  return (
    <OrderDetailsContext
      value={{
        order: selectedOrder,
        setSetselectedOrder,
      }}
    >
      {children}
    </OrderDetailsContext>
  );
};

export const useOrderDetails = () => use(OrderDetailsContext);

export default OrderDetailsProvider;
