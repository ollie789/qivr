import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import {
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { useSettingsContext } from 'providers/SettingsProvider';
import Image from 'components/base/Image';
import { AccessibilityFormValues } from './AccessibilityTabPanel';
import ColorOptions from './ColorOptions';

const ColorFilter = () => {
  const {
    config: { assetsDir },
  } = useSettingsContext();
  const [enableColorFilter, setEnableColorFilter] = useState(false);
  const { control } = useFormContext<AccessibilityFormValues>();

  return (
    <Stack direction="column" spacing={3}>
      <Stack direction="column" spacing={2}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Color filter preview
        </Typography>

        <Stack direction="column" sx={{ mb: 1.25 }}>
          <Stack
            sx={{
              width: 1,
              mb: 1,
              gap: 2,
              alignItems: 'center',
            }}
          >
            <div>
              <Image
                src={`${assetsDir}/images/account/3.webp`}
                alt=""
                width={800}
                height={600}
                sx={{ width: 1, height: 'auto', objectFit: 'contain' }}
              />
            </div>

            <Box sx={{ mx: 'auto' }}>
              <Image
                src={`${assetsDir}/images/account/4.webp`}
                alt=""
                width={800}
                height={600}
                sx={{ width: 1, maxHeight: 178, objectFit: 'contain' }}
              />
            </Box>
          </Stack>
          <ColorOptions />
        </Stack>
      </Stack>
      <Stack direction="column" spacing={3}>
        <Stack alignItems="center" spacing={2}>
          <Switch
            checked={enableColorFilter}
            onChange={(e) => {
              setEnableColorFilter(e.target.checked);
            }}
          />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Enable filter
          </Typography>
        </Stack>
        <FormControl>
          <Controller
            control={control}
            name="colorFilter"
            render={({ field }) => (
              <RadioGroup
                aria-labelledby="color-filter-group-label"
                sx={{ alignItems: 'flex-start' }}
                {...field}
              >
                <FormControlLabel
                  value="deuteranopia"
                  control={<Radio />}
                  label="Red-green (green weak, deuteranopia)"
                  disabled={!enableColorFilter}
                />
                <FormControlLabel
                  value="protanopia"
                  control={<Radio />}
                  label="Red-green (red weak, protanopia)"
                  disabled={!enableColorFilter}
                />
                <FormControlLabel
                  value="trianopia"
                  control={<Radio />}
                  label="Blue-yellow (trianopia)"
                  disabled={!enableColorFilter}
                />
                <FormControlLabel
                  value="grayscale"
                  control={<Radio />}
                  label="Grayscale"
                  disabled={!enableColorFilter}
                />
              </RadioGroup>
            )}
          />
        </FormControl>
      </Stack>
    </Stack>
  );
};

export default ColorFilter;
