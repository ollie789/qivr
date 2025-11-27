import { Chip, Stack, StackProps } from '@mui/material';
import { Add } from '@mui/icons-material';

export interface TagGroupProps extends Omit<StackProps, 'onChange'> {
  tags: string[];
  onRemove?: (tag: string) => void;
  onAdd?: () => void;
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium';
}

export const TagGroup = ({ tags, onRemove, onAdd, color = 'default', size = 'small', ...props }: TagGroupProps) => (
  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap {...props}>
    {tags.map((tag) => (
      <Chip
        key={tag}
        label={tag}
        size={size}
        color={color}
        onDelete={onRemove ? () => onRemove(tag) : undefined}
      />
    ))}
    {onAdd && (
      <Chip
        icon={<Add />}
        label="Add"
        size={size}
        variant="outlined"
        onClick={onAdd}
        sx={{ cursor: 'pointer' }}
      />
    )}
  </Stack>
);
