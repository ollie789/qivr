import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { PipelineList } from 'types/hiring';
import IconifyIcon from 'components/base/IconifyIcon';
import DashboardMenu from 'components/common/DashboardMenu';

interface ListHeaderProps {
  list: PipelineList;
}

const ListHeader = ({ list }: ListHeaderProps) => {
  return (
    <Box sx={{ px: 2, pt: 3, pb: 1 }}>
      <Stack justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={700}>
          {list.title}({list.items.length})
        </Typography>

        <DashboardMenu
          icon={<IconifyIcon icon="material-symbols:more-vert" sx={{ fontSize: 16 }} />}
        />
      </Stack>
      <Box sx={{ width: 30, height: 2, bgcolor: 'primary.main' }} />
    </Box>
  );
};

export default ListHeader;
