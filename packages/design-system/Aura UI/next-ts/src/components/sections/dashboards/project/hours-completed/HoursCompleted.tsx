import { Paper } from '@mui/material';
import { ProjectHours } from 'types/project';
import SectionHeader from 'components/common/SectionHeader';
import HoursCompletedChart from './HoursCompletedChart';

interface HoursCompletedProps {
  projectHours: ProjectHours;
}

const HoursCompleted = ({ projectHours }: HoursCompletedProps) => {
  return (
    <Paper sx={{ p: { xs: 3, md: 5 }, height: 1 }}>
      <SectionHeader
        title="Hours completed by projects"
        subTitle="Status of completion for all tasks"
      />
      <HoursCompletedChart data={projectHours} sx={{ flex: 1, width: 1, minHeight: 360 }} />
    </Paper>
  );
};

export default HoursCompleted;
