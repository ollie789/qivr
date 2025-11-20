import Paper from '@mui/material/Paper';
import { Screencast } from 'types/time-tracker';
import Activities from './activities/Activities';
import ScreencastsHeader from './header/ScreencastsHeader';

interface ScreencastsProps {
  screencasts: Screencast[];
}

const Screencasts = ({ screencasts }: ScreencastsProps) => {
  return (
    <Paper sx={{ p: { xs: 3, md: 5 }, height: 1 }}>
      <ScreencastsHeader />
      {screencasts.map((screencast, index) => (
        <Activities
          key={screencast.id}
          screencast={screencast}
          isLast={screencasts.length - 1 === index}
        />
      ))}
    </Paper>
  );
};

export default Screencasts;
