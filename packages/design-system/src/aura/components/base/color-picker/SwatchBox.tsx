import { useState } from 'react';
import { Box, Button, Stack, Typography } from '@mui/material';
import { HsvaColor, Swatch, hsvaToHex } from '@uiw/react-color';
import { defaultColors } from 'data/colorPicker';
import IconifyIcon from '../IconifyIcon';
import { HexaColor } from './ColorPicker';

interface SwatchBoxProps {
  color: string;
  updateHexaColor: (color: HexaColor) => void;
}

const Checked = (props: { color?: string; checked?: boolean }) => {
  if (!props.checked) return null;

  return (
    <IconifyIcon
      icon="material-symbols:check-rounded"
      sx={{ color: 'common.white', fontSize: 14 }}
    />
  );
};

const SwatchBox = ({ color, updateHexaColor }: SwatchBoxProps) => {
  const [swatchColors, setSwatchColors] = useState(defaultColors);

  const handleSwatchColorChange = (color: HsvaColor) => {
    updateHexaColor({ hex: hsvaToHex(color), alpha: 1 });
  };

  const handleAddNewSwatch = () => {
    const isColorExist = swatchColors.join(',').toLocaleLowerCase().includes(color.toLowerCase());
    if (!isColorExist) {
      setSwatchColors([...swatchColors, color]);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Stack sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          Swatches
        </Typography>
        <Button
          variant="soft"
          shape="square"
          color="neutral"
          size="small"
          onClick={handleAddNewSwatch}
        >
          <IconifyIcon icon="material-symbols:add-2-rounded" sx={{ fontSize: 16 }} />
        </Button>
      </Stack>

      <Swatch
        color={color}
        colors={swatchColors}
        rectProps={{
          children: <Checked />,
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          },
        }}
        onChange={handleSwatchColorChange}
      />
    </Box>
  );
};

export default SwatchBox;
