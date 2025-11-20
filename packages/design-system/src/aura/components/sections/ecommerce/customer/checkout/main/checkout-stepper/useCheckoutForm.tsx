import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CustomerInfoFormValues, customerInfoFormSchema } from './steps/CustomerInfo';
import { deliveryOptionFormSchema, deliveryOptionFormValues } from './steps/DeliveryOptions';
import { ShippingAddressFormValues, shippingAddressFormSchema } from './steps/ShippingAddress';

export interface CheckoutFormValues
  extends CustomerInfoFormValues,
    ShippingAddressFormValues,
    deliveryOptionFormValues {}

const checkoutFormSchema = [
  customerInfoFormSchema,
  shippingAddressFormSchema,
  deliveryOptionFormSchema,
  null,
] as yup.ObjectSchema<CheckoutFormValues>[];

const useCheckoutForm = (activeStep: number) => {
  const methods = useForm<CheckoutFormValues>({
    resolver: checkoutFormSchema[activeStep]
      ? yupResolver(checkoutFormSchema[activeStep])
      : undefined,
    defaultValues: {
      customer: {
        email: 'anyname@email.com',
        firstName: 'Captain',
        lastName: 'Haddock',
        phoneNumber: '+12514463453',
      },
      shippingAddress: {
        street: 'Apt: 6/B, 192 Edsel Road',
        townCity: 'Van Nuys',
        postcode: '96580',
        country: 'USA',
        state: 'California',
      },
    },
  });

  return methods;
};

export default useCheckoutForm;
