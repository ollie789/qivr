import { Slider, SliderProps, styled, Box, Typography } from '@mui/material';
import { auraColors } from '../../theme/auraColors';

/**
 * AuraSlider - Styled slider matching Aura design system
 *
 * Features:
 * - Custom colors from Aura palette
 * - Smooth transitions and hover effects
 * - Gradient track option
 * - Optional value label with custom formatting
 * - Size variants
 */

const StyledSlider = styled(Slider)<
  SliderProps & {
    auraVariant?: 'default' | 'gradient' | 'pain';
    auraSize?: 'small' | 'medium' | 'large';
  }
>(({ theme, auraVariant = 'default', auraSize = 'medium' }) => {
  const sizes = {
    small: { track: 4, thumb: 16, valueLabelOffset: -28 },
    medium: { track: 6, thumb: 20, valueLabelOffset: -32 },
    large: { track: 8, thumb: 24, valueLabelOffset: -36 },
  };
  const size = sizes[auraSize];

  const getTrackBackground = () => {
    if (auraVariant === 'pain') {
      // Pain scale gradient: green -> amber -> red
      return `linear-gradient(90deg, ${auraColors.green[400]} 0%, ${auraColors.amber[500]} 50%, ${auraColors.red[500]} 100%)`;
    }
    if (auraVariant === 'gradient') {
      return `linear-gradient(90deg, ${auraColors.blue[300]} 0%, ${auraColors.blue[600]} 100%)`;
    }
    return auraColors.blue[500];
  };

  return {
    color: auraColors.blue[500],
    height: size.track,
    padding: '13px 0',

    '& .MuiSlider-track': {
      border: 'none',
      height: size.track,
      borderRadius: size.track / 2,
      background: getTrackBackground(),
      transition: 'all 0.2s ease-in-out',
    },

    '& .MuiSlider-rail': {
      height: size.track,
      borderRadius: size.track / 2,
      backgroundColor: auraColors.grey[200],
      opacity: 1,
    },

    '& .MuiSlider-thumb': {
      height: size.thumb,
      width: size.thumb,
      backgroundColor: '#fff',
      border: `2px solid ${auraColors.blue[500]}`,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
      transition: 'all 0.2s ease-in-out',

      '&:hover, &.Mui-focusVisible': {
        boxShadow: `0 0 0 6px ${auraColors.blue[100]}`,
        borderColor: auraColors.blue[600],
      },

      '&.Mui-active': {
        boxShadow: `0 0 0 10px ${auraColors.blue[100]}`,
      },

      '&:before': {
        display: 'none',
      },
    },

    '& .MuiSlider-valueLabel': {
      backgroundColor: auraColors.blue[600],
      borderRadius: 8,
      padding: '4px 8px',
      fontSize: '0.8125rem',
      fontWeight: 600,
      top: size.valueLabelOffset,

      '&:before': {
        display: 'none',
      },
    },

    '& .MuiSlider-mark': {
      backgroundColor: auraColors.grey[300],
      height: 8,
      width: 2,
      borderRadius: 1,

      '&.MuiSlider-markActive': {
        backgroundColor: '#fff',
        opacity: 0.8,
      },
    },

    '& .MuiSlider-markLabel': {
      fontSize: '0.75rem',
      color: auraColors.grey[500],
      fontWeight: 500,
    },

    '&.Mui-disabled': {
      color: auraColors.grey[300],

      '& .MuiSlider-thumb': {
        backgroundColor: auraColors.grey[100],
        borderColor: auraColors.grey[300],
      },

      '& .MuiSlider-track': {
        background: auraColors.grey[300],
      },
    },
  };
});

export interface AuraSliderProps extends Omit<SliderProps, 'size'> {
  /** Visual variant */
  auraVariant?: 'default' | 'gradient' | 'pain';
  /** Size variant */
  auraSize?: 'small' | 'medium' | 'large';
  /** Label for the slider */
  label?: string;
  /** Show min/max labels below slider */
  showMinMax?: boolean;
  /** Custom min label text */
  minLabel?: string;
  /** Custom max label text */
  maxLabel?: string;
}

export const AuraSlider = ({
  auraVariant = 'default',
  auraSize = 'medium',
  label,
  showMinMax,
  minLabel,
  maxLabel,
  min = 0,
  max = 100,
  ...props
}: AuraSliderProps) => {
  if (!label && !showMinMax) {
    return <StyledSlider auraVariant={auraVariant} auraSize={auraSize} min={min} max={max} {...props} />;
  }

  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography
          variant="body2"
          sx={{
            color: auraColors.grey[600],
            fontWeight: 500,
            mb: 1,
          }}
        >
          {label}
        </Typography>
      )}
      <StyledSlider auraVariant={auraVariant} auraSize={auraSize} min={min} max={max} {...props} />
      {showMinMax && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: auraColors.grey[500] }}>
            {minLabel ?? min}
          </Typography>
          <Typography variant="caption" sx={{ color: auraColors.grey[500] }}>
            {maxLabel ?? max}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * AuraPainSlider - Pre-configured slider for 0-10 pain scale
 * Uses pain gradient colors (green -> amber -> red)
 */
export interface AuraPainSliderProps extends Omit<AuraSliderProps, 'auraVariant' | 'min' | 'max'> {
  /** Override default "No pain" label */
  minLabel?: string;
  /** Override default "Worst pain" label */
  maxLabel?: string;
}

export const AuraPainSlider = ({
  minLabel = 'No pain',
  maxLabel = 'Worst pain',
  ...props
}: AuraPainSliderProps) => (
  <AuraSlider
    auraVariant="pain"
    min={0}
    max={10}
    step={1}
    marks
    valueLabelDisplay="on"
    showMinMax
    minLabel={minLabel}
    maxLabel={maxLabel}
    {...props}
  />
);

/**
 * AuraRatingSlider - Pre-configured slider for 1-10 rating scale
 */
export interface AuraRatingSliderProps extends Omit<AuraSliderProps, 'min' | 'max'> {
  /** Override default min label */
  minLabel?: string;
  /** Override default max label */
  maxLabel?: string;
}

export const AuraRatingSlider = ({
  minLabel = 'Not effective',
  maxLabel = 'Very effective',
  ...props
}: AuraRatingSliderProps) => (
  <AuraSlider
    auraVariant="gradient"
    min={1}
    max={10}
    step={1}
    marks={[
      { value: 1, label: '1' },
      { value: 5, label: '5' },
      { value: 10, label: '10' },
    ]}
    valueLabelDisplay="on"
    showMinMax
    minLabel={minLabel}
    maxLabel={maxLabel}
    {...props}
  />
);

export default AuraSlider;
