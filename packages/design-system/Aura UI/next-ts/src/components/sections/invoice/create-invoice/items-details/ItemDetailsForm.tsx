import { useEffect, useMemo, useState } from 'react';
import {
  Controller,
  FieldArrayWithId,
  useFieldArray,
  useFormContext,
  useWatch,
} from 'react-hook-form';
import { DragEndEvent } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Button,
  Divider,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import useNumberFormat from 'hooks/useNumberFormat';
import { currencyFormat } from 'lib/utils';
import IconifyIcon from 'components/base/IconifyIcon';
import SortableDnd from 'components/base/SortableDnd';
import StyledTextField from 'components/styled/StyledTextField';
import { CreateInvoiceFormSchemaValues } from '../useCreateInvoiceForm';

const getTotalPrice = (subtotal: number, vat: number, discount: number, shippingCost: number) => {
  const taxableAmount = subtotal - discount;
  const taxAmount = taxableAmount * (vat / 100);

  return taxableAmount + taxAmount + shippingCost;
};

const ItemDetailsTableForm = () => {
  const { control, watch } = useFormContext<CreateInvoiceFormSchemaValues>();
  const { fields, move, remove, append } = useFieldArray({
    control,
    name: 'itemDetails',
  });

  const itemDetails = useWatch({
    control,
    name: 'itemDetails',
  });
  const adjustments = watch('adjustment');
  const orderCharges = watch('orderCharges');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((column) => column.id === active.id);
      const newIndex = fields.findIndex((column) => column.id === over?.id);
      move(oldIndex, newIndex);
    }
  };
  const subTotal = useMemo(
    () =>
      itemDetails.reduce((acc, item) => {
        const itemPriceCents = Math.round((item.price || 0) * 100);
        const itemTotal = (itemPriceCents * (item.quantity || 0)) / 100;

        return acc + itemTotal;
      }, 0),
    [itemDetails],
  );

  return (
    <Stack direction="column">
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700 }}>
        Item details
      </Typography>
      <SortableDnd items={fields} onDragEnd={handleDragEnd}>
        <TableContainer sx={{ mb: 2 }}>
          <Table sx={{ minWidth: 700 }} aria-label="item details table">
            <TableHead>
              <TableRow
                sx={{
                  '& th': {
                    whiteSpace: 'nowrap',
                  },
                  '& th:first-of-type': {
                    paddingLeft: '4px',
                  },
                }}
              >
                <TableCell></TableCell>
                <TableCell>Item type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Unit price</TableCell>
                <TableCell align="center">Total</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody
              sx={{
                '& tr td': {
                  padding: '20px 16px 20px 0px',
                },
                '& tr td:first-of-type': {
                  paddingLeft: 0,
                },
                '& tr td:last-of-type': {
                  paddingRight: 0,
                },
              }}
            >
              {fields.map((field, index) => (
                <TableRowForm key={field.id} index={index} field={fields[index]} remove={remove} />
              ))}
              <TableRow>
                <TableCell colSpan={7} sx={{ py: '9px !important' }}>
                  <Button
                    variant="text"
                    color="primary"
                    startIcon={<IconifyIcon icon={'material-symbols:add-circle-rounded'} />}
                    onClick={() => {
                      append({
                        type: 'service',
                        description: '',
                        quantity: 0,
                        price: 0,
                      });
                    }}
                    sx={{
                      paddingLeft: '5px',
                    }}
                  >
                    <Typography variant="button">Add Item</Typography>
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
        <Stack sx={{ py: '13px', textAlign: 'end', alignItems: 'center' }}>
          <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
            Subtotal
          </Typography>
          <Typography
            color="text.secondary"
            variant="subtitle2"
            sx={{ fontWeight: 400, width: 130 }}
          >
            {currencyFormat(subTotal)}
          </Typography>
        </Stack>
        <Stack sx={{ py: '13px', textAlign: 'end', alignItems: 'center' }}>
          <Typography color="error.main" variant="body2" sx={{ flexGrow: 1 }}>
            Discount
          </Typography>
          <Typography color="error.main" variant="subtitle2" sx={{ fontWeight: 400, width: 130 }}>
            -{currencyFormat((adjustments.discount && adjustments.discount) || 0)}
          </Typography>
        </Stack>
        <Stack sx={{ py: '13px', textAlign: 'end', alignItems: 'center' }}>
          <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
            Tax
          </Typography>
          <Typography
            color="text.secondary"
            variant="subtitle2"
            sx={{ fontWeight: 400, width: 130 }}
          >
            {currencyFormat((adjustments.tax && adjustments.tax) || 0)}
          </Typography>
        </Stack>
        <Stack sx={{ py: '13px', textAlign: 'end', alignItems: 'center' }}>
          <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
            Shipping cost
          </Typography>
          <Typography
            color="text.secondary"
            variant="subtitle2"
            sx={{ fontWeight: 400, width: 130 }}
          >
            {currencyFormat((orderCharges.shippingCost && orderCharges.shippingCost) || 0)}
          </Typography>
        </Stack>
        <Divider />
        <Stack sx={{ py: '17px', textAlign: 'end', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ flexGrow: 1 }}>
            Total
          </Typography>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, width: 130 }}>
            {currencyFormat(
              getTotalPrice(
                subTotal,
                Number(adjustments.tax),
                Number(adjustments.discount),
                Number(orderCharges.shippingCost),
              ),
            )}
          </Typography>
        </Stack>
        <Divider />
      </SortableDnd>
    </Stack>
  );
};

interface TableRowFormProps {
  index: number;
  field: FieldArrayWithId<CreateInvoiceFormSchemaValues, 'itemDetails', 'id'>;
  remove: (index: number) => void;
}

const TableRowForm = ({ index, field, remove }: TableRowFormProps) => {
  const { currencyFormat, currencySymbol } = useNumberFormat();
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<CreateInvoiceFormSchemaValues>();

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: field.id,
  });

  const itemDetails = watch(`itemDetails.${index}`);
  const quantity = itemDetails.quantity || 0;
  const price = itemDetails.price || 0;

  return (
    <TableRow
      ref={setNodeRef}
      sx={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
    >
      <TableCell sx={{ width: 24, paddingRight: '12px !important' }}>
        <IconButton {...listeners} sx={{ p: 0 }}>
          <IconifyIcon sx={{ cursor: 'grab' }} icon="material-symbols:drag-indicator" />
        </IconButton>
      </TableCell>
      <TableCell sx={{ width: 140 }}>
        <Controller
          name={`itemDetails.${index}.type`}
          control={control}
          render={({ field }) => (
            <StyledTextField
              variant="filled"
              select
              size="large"
              {...field}
              fullWidth
              error={!!errors.itemDetails?.[index]?.type}
              slotProps={{
                input: {
                  sx: {
                    '& .MuiInputBase-input': {
                      color: 'text.secondary',
                      padding: '9px 16px !important',
                    },
                  },
                },
              }}
            >
              <MenuItem value="service">Service</MenuItem>
              <MenuItem value="product">Product</MenuItem>
            </StyledTextField>
          )}
        />
      </TableCell>
      <TableCell sx={{ width: 316 }}>
        <StyledTextField
          variant="filled"
          type="text"
          size="large"
          {...register(`itemDetails.${index}.description`)}
          error={!!errors.itemDetails?.[index]?.description}
          fullWidth
          slotProps={{
            input: {
              sx: {
                '& .MuiInputBase-input': {
                  color: 'text.secondary',
                  padding: '9px 16px !important',
                },
              },
            },
          }}
        />
      </TableCell>
      <TableCell sx={{ width: 104 }}>
        <Controller
          name={`itemDetails.${index}.quantity`}
          control={control}
          render={({ field }) => (
            <StyledTextField
              type="number"
              variant="filled"
              size="large"
              value={
                field.value !== undefined && field.value !== null
                  ? String(field.value).padStart(2, '0')
                  : ''
              }
              onChange={(e) => {
                const numericValue = parseInt(e.target.value, 10) || 0;
                field.onChange(numericValue);
              }}
              error={!!errors.itemDetails?.[index]?.quantity}
              slotProps={{
                input: {
                  sx: {
                    '& .MuiInputBase-input': {
                      textAlign: 'end',
                      color: 'text.secondary',
                      padding: '9px 16px !important',
                    },
                  },
                },
              }}
            />
          )}
        />
      </TableCell>
      <TableCell sx={{ width: 130 }}>
        <Controller
          name={`itemDetails.${index}.price`}
          control={control}
          render={({ field: controllerField }) => {
            const [displayValue, setDisplayValue] = useState<string>(
              controllerField.value !== undefined && controllerField.value !== null
                ? currencyFormat(controllerField.value, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                : '',
            );
            const [isFocused, setIsFocused] = useState(false);

            useEffect(() => {
              if (!isFocused) {
                if (controllerField.value !== undefined && controllerField.value !== null) {
                  setDisplayValue(
                    currencyFormat(controllerField.value, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  );
                } else {
                  setDisplayValue('');
                }
              }
            }, [controllerField.value, currencyFormat, isFocused]);

            const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
              const rawValue = e.target.value.replace(/[^0-9.]/g, '');
              setDisplayValue(rawValue);
              controllerField.onChange(rawValue ? Number(rawValue) : '');
            };

            const handleBlur = () => {
              setIsFocused(false);
              if (
                controllerField.value !== undefined &&
                controllerField.value !== null &&
                controllerField.value !== 0
              ) {
                const numValue = Number(controllerField.value);
                const roundedValue = Number(numValue.toFixed(2));
                controllerField.onChange(roundedValue);
                setDisplayValue(
                  currencyFormat(roundedValue, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                );
              } else {
                controllerField.onChange('');
                setDisplayValue('');
              }
            };

            const handleFocus = () => {
              setIsFocused(true);
              if (
                controllerField.value !== undefined &&
                controllerField.value !== null &&
                controllerField.value !== 0
              ) {
                setDisplayValue(String(controllerField.value));
              } else {
                setDisplayValue('');
              }
            };

            return (
              <StyledTextField
                variant="filled"
                size="large"
                fullWidth
                value={displayValue}
                error={!!errors.itemDetails?.[index]?.price}
                onChange={handlePriceChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                InputProps={{
                  startAdornment: (
                    <Typography sx={{ color: 'text.secondary' }}>{currencySymbol}</Typography>
                  ),
                }}
                slotProps={{
                  input: {
                    sx: {
                      '& .MuiInputBase-input': {
                        textAlign: 'end',
                        color: 'text.secondary',
                        padding: '9px 16px !important',
                      },
                    },
                  },
                }}
              />
            );
          }}
        />
      </TableCell>
      <TableCell align="right" sx={{ width: 80 }}>
        {currencyFormat((Math.round((price || 0) * 100) * (quantity || 0)) / 100)}
      </TableCell>
      <TableCell sx={{ width: 36 }}>
        <IconButton color="error" onClick={() => remove(index)}>
          <IconifyIcon
            icon="mdi:trash-can-outline"
            sx={{
              fontSize: '20px',
            }}
          />
        </IconButton>
      </TableCell>
    </TableRow>
  );
};

export default ItemDetailsTableForm;
