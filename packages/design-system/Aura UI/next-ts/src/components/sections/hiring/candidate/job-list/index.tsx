'use client';

import { useState } from 'react';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import { useHiringContext } from 'providers/HiringProvider';
import JobPagination from '../../common/JobPagination';
import FilterDrawer from './FilterDrawer';
import Header from './Header';
import JobListView from './JobListView';

const JobList = () => {
  const {
    candidate: { jobs },
  } = useHiringContext();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const toggleDrawer = (newOpen: boolean) => () => setIsDrawerOpen(newOpen);

  return (
    <Paper sx={{ px: { xs: 3, md: 5 }, pb: { xs: 3, md: 5 }, pt: 3 }}>
      <Container maxWidth={false} disableGutters sx={{ maxWidth: 820 }}>
        <Header toggleDrawer={toggleDrawer} />
        <JobListView jobs={jobs} />
        <JobPagination jobs={jobs.length} />
      </Container>
      <FilterDrawer open={isDrawerOpen} handleClose={toggleDrawer(false)} />
    </Paper>
  );
};

export default JobList;
