import { ChangeEvent, useEffect, useState } from 'react';
import { Button, Stack, SxProps, inputBaseClasses } from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import StyledTextField from 'components/styled/StyledTextField';

interface QuantityButtonsProps {
  size?: 'large' | 'medium' | 'small';
  sx?: SxProps;
  defaultValue?: number;
  handleChange: (value: number) => void;
}

const QuantityButtons = ({
  size = 'medium',
  sx,
  defaultValue = 1,
  handleChange,
}: QuantityButtonsProps) => {
  const [quantity, setQuantity] = useState(defaultValue);

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleQuantityChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setQuantity(value);
  };

  useEffect(() => {
    handleChange(quantity);
  }, [quantity]);

  return (
    <Stack
      sx={{
        gap: 1,
        alignItems: 'center',
        ...sx,
      }}
    >
      <Button
        color="neutral"
        variant="soft"
        shape="square"
        disabled={quantity <= 1}
        size={size}
        onClick={handleDecrease}
      >
        <IconifyIcon icon="material-symbols:remove-rounded" fontSize={20} />
      </Button>
      <StyledTextField
        variant="filled"
        size={size}
        sx={{
          maxWidth: 84,
          [`& .${inputBaseClasses.input}`]: {
            textAlign: 'center',
          },
        }}
        value={quantity}
        onChange={handleQuantityChange}
      />
      <Button color="neutral" variant="soft" shape="square" size={size} onClick={handleIncrease}>
        <IconifyIcon icon="material-symbols:add-rounded" fontSize={20} />
      </Button>
    </Stack>
  );
};

export default QuantityButtons;
