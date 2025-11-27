import { Stack, TextField, Typography } from '@mui/material';
import { auraTokens } from '../../../theme/auraTokens';

export interface DateRangeInputProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  startLabel?: string;
  endLabel?: string;
  minDate?: string;
  maxDate?: string;
  size?: 'small' | 'medium';
}

export const DateRangeInput = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  startLabel = 'Start Date',
  endLabel = 'End Date',
  minDate,
  maxDate,
  size = 'small',
}: DateRangeInputProps) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <TextField
      type="date"
      label={startLabel}
      value={startDate}
      onChange={(e) => onStartDateChange(e.target.value)}
      size={size}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { min: minDate, max: endDate || maxDate },
      }}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: auraTokens.borderRadius.md } }}
    />
    <Typography color="text.secondary">to</Typography>
    <TextField
      type="date"
      label={endLabel}
      value={endDate}
      onChange={(e) => onEndDateChange(e.target.value)}
      size={size}
      slotProps={{
        inputLabel: { shrink: true },
        htmlInput: { min: startDate || minDate, max: maxDate },
      }}
      sx={{ '& .MuiOutlinedInput-root': { borderRadius: auraTokens.borderRadius.md } }}
    />
  </Stack>
);
