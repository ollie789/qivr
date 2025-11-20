import Stack from '@mui/material/Stack';
import type { Job } from 'types/hiring';
import JobCard from './JobCard';

const JobListView = ({ jobs }: { jobs: Job[] }) => {
  return (
    <Stack direction="column" gap={1} mb={3}>
      {jobs.map((job) => (
        <JobCard key={job.id} job={job} />
      ))}
    </Stack>
  );
};

export default JobListView;
