import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { InventoryFormValues, productInventoryFormSchema } from './steps/Inventory';
import { mediaFilesFormSchema } from './steps/MediaFiles';
import { NameDescriptionFormValues, nameDescriptionFormSchema } from './steps/NameDescription';
import { productPricingSchema } from './steps/PricingQuantity';
import { ShippingFormSchema, ShippingFormValues } from './steps/Shipping';
import {
  ProductInfoFormValues,
  productInfoFormSchema,
} from './steps/product-information/ProductInfo';
import {
  ProductVariant,
  ProductVariantFormValues,
  productVariantSchema,
} from './steps/variations/ProductVariants';
import { VitalInfoFormValues, vitalInfoFormSchema } from './steps/vital-info/VitalInfo';

export interface ProductListingFormValues
  extends VitalInfoFormValues,
    NameDescriptionFormValues,
    ProductInfoFormValues,
    InventoryFormValues,
    ShippingFormValues,
    ProductVariantFormValues {
  images: File[];
  tags: string[];
  combinedVariants: string[];
}

const productListingFormSchema = [
  vitalInfoFormSchema,
  nameDescriptionFormSchema,
  productInfoFormSchema,
  mediaFilesFormSchema,
  productVariantSchema,
  productPricingSchema,
  productInventoryFormSchema,
  ShippingFormSchema,
  null,
] as yup.ObjectSchema<ProductListingFormValues>[];

const getCombineVariants = (variants: ProductVariant[]): string[] => {
  const items = variants.map((variant) => variant.items);
  const combinedItems = items.flatMap((arr, index) => {
    return arr.flatMap((item) =>
      items.length > 1
        ? items
            .slice(index + 1)
            .flatMap((nextArr) => nextArr.map((nextItem) => `${item.value}/${nextItem.value}`))
        : item.value,
    );
  });

  return combinedItems;
};

const useProductListingForm = (activeStep: number) => {
  const methods = useForm<ProductListingFormValues>({
    resolver: productListingFormSchema[activeStep]
      ? yupResolver(productListingFormSchema[activeStep])
      : undefined,
    defaultValues: {
      images: [],
      variants: [],
    },
  });

  const { control, setValue } = methods;

  const [variants, name] = useWatch({
    control,
    name: ['variants', 'name'],
  });

  useEffect(() => {
    if (variants && variants.length > 0) {
      const combinedVariants = getCombineVariants(variants);
      setValue('combinedVariants', combinedVariants);
    } else {
      if (name) {
        setValue('combinedVariants', [name]);
      } else {
        setValue('combinedVariants', ['N/A']);
      }
    }
  }, [variants, name]);

  return methods;
};

export default useProductListingForm;
