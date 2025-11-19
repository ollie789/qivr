import { Box, Chip, Stack, Typography, Slider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import { PAIN_QUALITIES, type PainQuality, type DepthIndicator } from '../../types/pain-drawing';

interface PainQualitySelectorProps {
  selectedQuality: PainQuality;
  onQualityChange: (quality: PainQuality) => void;
  intensity: number;
  onIntensityChange: (intensity: number) => void;
  depthIndicator: DepthIndicator;
  onDepthChange: (depth: DepthIndicator) => void;
}

export function PainQualitySelector({
  selectedQuality,
  onQualityChange,
  intensity,
  onIntensityChange,
  depthIndicator,
  onDepthChange,
}: PainQualitySelectorProps) {
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Pain Quality
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {PAIN_QUALITIES.map((quality) => (
            <Chip
              key={quality.quality}
              label={quality.quality}
              onClick={() => onQualityChange(quality)}
              sx={{
                bgcolor: quality.color,
                color: 'white',
                border: selectedQuality.quality === quality.quality ? '3px solid' : 'none',
                borderColor: 'primary.main',
                '&:hover': {
                  bgcolor: quality.color,
                  opacity: 0.8,
                },
              }}
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Pain Intensity: {intensity}/10
        </Typography>
        <Slider
          value={intensity}
          onChange={(_, val) => onIntensityChange(val as number)}
          min={0}
          max={10}
          marks
          valueLabelDisplay="auto"
          sx={{
            '& .MuiSlider-thumb': {
              bgcolor: selectedQuality.color,
            },
            '& .MuiSlider-track': {
              bgcolor: selectedQuality.color,
            },
            '& .MuiSlider-rail': {
              opacity: 0.3,
            },
          }}
        />
      </Box>

      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Pain Depth
        </Typography>
        <ToggleButtonGroup
          value={depthIndicator}
          exclusive
          onChange={(_, val) => val && onDepthChange(val)}
          size="small"
          fullWidth
        >
          <ToggleButton value="superficial">
            Superficial
          </ToggleButton>
          <ToggleButton value="deep">
            Deep
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Stack>
  );
}
