import Grid from '@mui/material/Grid';
import type { SxProps, Theme } from '@mui/material/styles';
import { JobOpening } from 'types/hiring';
import JobOpeningCard from './JobOpeningCard';

interface JobBoardProps {
  jobs: JobOpening[];
  sx?: SxProps<Theme>;
}

const JobBoard = ({ jobs, sx }: JobBoardProps) => {
  return (
    <Grid container rowSpacing={2} columnSpacing={2} sx={{ ...sx }}>
      {jobs.map((job) => (
        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={job.id}>
          <JobOpeningCard job={job} />
        </Grid>
      ))}
    </Grid>
  );
};

export default JobBoard;
