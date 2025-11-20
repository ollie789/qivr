import { useState } from 'react';
import { Paper } from '@mui/material';
import { months } from 'data/common/months';
import { Project } from 'types/project';
import DashboardSelectMenu from 'components/common/DashboardSelectMenu';
import SectionHeader from 'components/common/SectionHeader';
import ProjectTimelineChart from 'components/sections/dashboards/project/project-timeline/ProjectTimelineChart';

interface ProjectTimelineProps {
  projectTimelineData: Project[];
}
const ProjectTimeline = ({ projectTimelineData }: ProjectTimelineProps) => {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    new Date().toLocaleString('default', { month: 'long' }),
  );

  return (
    <Paper sx={{ height: 1, p: { xs: 3, md: 5 } }}>
      <SectionHeader
        title="Project timeline"
        subTitle="Status of completion for all projects"
        actionComponent={
          <DashboardSelectMenu
            options={months.map((month) => ({
              label: month,
              value: month,
            }))}
            onChange={(value) => setSelectedMonth(value as string)}
            defaultValue={selectedMonth}
          />
        }
        sx={{ mb: 4 }}
      />
      <ProjectTimelineChart projectTimelineData={projectTimelineData} />
    </Paper>
  );
};

export default ProjectTimeline;
