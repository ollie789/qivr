import { TabPanel } from '@mui/lab';
import { Typography } from '@mui/material';

interface CurrentTeamTabPanelProps {
  value: string;
}
const CurrentTeamTabPanel = ({ value }: CurrentTeamTabPanelProps) => {
  return (
    <TabPanel value={value} sx={{ px: 0 }}>
      <>
        <Typography variant="h5" color="text.disabled" fontWeight={400}>
          You currently have no team.
        </Typography>
      </>
    </TabPanel>
  );
};

export default CurrentTeamTabPanel;
