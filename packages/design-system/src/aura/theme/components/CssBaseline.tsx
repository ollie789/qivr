import { Theme } from '@mui/material';
import { Components } from '@mui/material/styles';
import colorPicker from '../styles/colorPicker';
import echart from '../styles/echart';
import emojiMart from '../styles/emojiMart';
import keyFrames from '../styles/keyFrames';
import notistack from '../styles/notistack';
import popper from '../styles/popper';
import prism from '../styles/prism';
import projectTimelineChart from '../styles/projectTimelineChart';
import reactFc from '../styles/react-fc';
import reactDatepicker from '../styles/reactDatepicker';
import simplebar from '../styles/simplebar';
import svelteGanttChart from '../styles/svelteGanttChart';
import swiper from '../styles/swiper';
import taskTrackChart from '../styles/taskTrackChart';
import vibrantNav from '../styles/vibrantNav';
import yarl from '../styles/yarl';

const CssBaseline: Components<Omit<Theme, 'components'>>['MuiCssBaseline'] = {
  defaultProps: {},
  styleOverrides: (theme) => ({
    '*': {
      scrollbarWidth: 'thin',
    },
    'input:-webkit-autofill': {
      WebkitBoxShadow: `0 0 0px 40rem ${theme.vars.palette.background.elevation2} inset !important`,
      transition: 'background-color 5000s ease-in-out 0s',
    },
    'input:-webkit-autofill:hover': {
      WebkitBoxShadow: `0 0 0px 40rem ${theme.vars.palette.background.elevation3} inset !important`,
    },
    body: {
      scrollbarColor: `${theme.vars.palette.background.elevation4} transparent`,
      [`h1, h2, h3, h4, h5, h6, p`]: {
        margin: 0,
      },
      fontVariantLigatures: 'none',
      [`[id]`]: {
        scrollMarginTop: 82,
      },
    },
    ...simplebar(theme),
    ...swiper(theme),
    ...notistack(theme),
    ...keyFrames(),
    ...prism(),
    ...echart(),
    ...popper(theme),
    ...colorPicker(theme),
    ...reactDatepicker(theme),
    ...vibrantNav(theme),
    ...svelteGanttChart(theme),
    ...projectTimelineChart(theme),
    ...taskTrackChart(theme),
    ...reactFc(theme),
    ...emojiMart(theme),
    ...yarl(theme),
  }),
};

export default CssBaseline;
