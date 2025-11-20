import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconifyIcon from 'components/base/IconifyIcon';
import { FilterCategory, FilterData, color } from './FilterMenu';

interface StatusProps {
  status: FilterCategory;
  handleSelect: <T extends keyof FilterData>(type: T, item: FilterData[T]) => void;
}

const Status = ({ status, handleSelect }: StatusProps) => {
  const handleClick = (id: number) => {
    const options = status.options.map((item) =>
      item.id === id ? { ...item, isSelected: !item.isSelected } : item,
    );
    handleSelect('status', { ...status, options });
  };

  return (
    <div>
      <Typography variant="subtitle2" sx={{ mb: 2, px: 3, fontWeight: 600 }}>
        {status.title}
      </Typography>

      <Stack direction="column" spacing={1} sx={{ px: 3 }}>
        {status.options.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            size="medium"
            color={item.color as color}
            sx={{ width: 1, cursor: 'pointer' }}
            icon={
              <IconifyIcon
                icon="material-symbols:done"
                sx={{ fontSize: 22, display: item.isSelected ? 'flex' : 'none' }}
              />
            }
            onClick={() => handleClick(item.id)}
          />
        ))}
      </Stack>
    </div>
  );
};

export default Status;
