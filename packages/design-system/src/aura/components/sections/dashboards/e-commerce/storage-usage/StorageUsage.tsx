import Paper from '@mui/material/Paper';
import { storages } from 'data/e-commerce/dashboard';
import DashboardMenu from '../../../../common/DashboardMenu';
import SectionHeader from '../../../../common/SectionHeader';
import StorageBar from './StorageBar';

const StorageUsage = () => {
  return (
    <Paper sx={{ p: { xs: 3, md: 5 } }}>
      <SectionHeader
        title="Storage Usage"
        subTitle=" Product categories occupying warehouse space"
        actionComponent={<DashboardMenu />}
      />
      <StorageBar storages={storages} />
    </Paper>
  );
};

export default StorageUsage;
