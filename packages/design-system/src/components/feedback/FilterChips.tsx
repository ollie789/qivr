import { auraTokens } from '../../theme/auraTokens';
import { Box, Chip, Button } from '@mui/material';

export interface Filter {
  key: string;
  label: string;
}

export interface FilterChipsProps {
  filters: Filter[];
  onRemove: (key: string) => void;
  onClearAll?: () => void;
}

export const FilterChips = ({ filters, onRemove, onClearAll }: FilterChipsProps) => {
  if (filters.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
      {filters.map((filter) => (
        <Chip
          key={filter.key}
          label={filter.label}
          onDelete={() => onRemove(filter.key)}
          size="small"
        />
      ))}
      {filters.length > 1 && onClearAll && (
        <Button size="small" onClick={onClearAll}>
          Clear All
        </Button>
      )}
    </Box>
  );
};
