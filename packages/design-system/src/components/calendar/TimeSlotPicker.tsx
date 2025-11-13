import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { AccessTime as TimeIcon } from '@mui/icons-material';

export interface TimeSlotPickerProps {
  slots: string[];
  selectedSlot: string | null;
  onSelectSlot: (slot: string) => void;
  disabled?: boolean;
  label?: string;
}

/**
 * A time slot picker for appointment scheduling
 */
export const TimeSlotPicker: React.FC<TimeSlotPickerProps> = ({
  slots,
  selectedSlot,
  onSelectSlot,
  disabled = false,
  label = 'Available Times',
}) => {
  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <TimeIcon fontSize="small" />
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {slots.map((slot) => (
          <Chip
            key={slot}
            label={slot}
            onClick={() => !disabled && onSelectSlot(slot)}
            color={selectedSlot === slot ? 'primary' : 'default'}
            variant={selectedSlot === slot ? 'filled' : 'outlined'}
            disabled={disabled}
            sx={{ cursor: disabled ? 'default' : 'pointer' }}
          />
        ))}
      </Box>
    </Box>
  );
};
