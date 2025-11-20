import { Theme } from '@mui/material';

const transitions = (theme: Theme) => ({
  layout: {
    transition: theme.transitions.create(['width'], {
      duration: theme.transitions.duration.standard,
    }),
  },
});
export default transitions;
