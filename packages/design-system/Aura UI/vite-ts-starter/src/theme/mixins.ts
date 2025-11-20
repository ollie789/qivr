import { MixinsOptions } from '@mui/material';
import { Breakpoint } from '@mui/material';
import { TopnavType } from 'config';

declare module '@mui/material/styles' {
  interface Mixins {
    topbar: Record<TopnavType, Partial<Record<Breakpoint, number>>>;
    ecommerceTopbar: Partial<Record<Breakpoint, number>>;
    footer: Required<Pick<Record<Breakpoint, number>, 'xs' | 'sm'>>;
    topOffset: (
      topbarHeight: Partial<Record<Breakpoint, number>>,
      offset?: number,
      important?: boolean,
    ) => Partial<Record<Breakpoint, number>>;
    contentHeight: (
      topnavType: Partial<Record<Breakpoint, number>>,
      offset?: number,
      important?: boolean,
    ) => {
      [key: string]: string;
    };
  }
}

const mixins: MixinsOptions = {
  ecommerceTopbar: {
    xs: 188,
    sm: 190,
    md: 162,
  },
  topbar: {
    default: {
      xs: 64,
      md: 82,
    },
    slim: {
      xs: 38,
    },
    stacked: {
      xs: 129,
      md: 103,
    },
  },
  footer: { xs: 72, sm: 56 },
  topOffset: (topbarHeight, offset: number = 0, important) =>
    Object.entries(topbarHeight).reduce((acc: { [key: string]: string }, [key, value]) => {
      acc[key] = `${value + offset}px${important ? ' !important' : ''}`;
      return acc;
    }, {}),
  contentHeight: (topbarHeight, offset = 0, important) =>
    Object.entries(topbarHeight).reduce((acc: { [key: string]: string }, [key, value]) => {
      acc[key] = `calc(100vh - ${value + offset}px)${important ? ' !important' : ''}`;
      return acc;
    }, {}),
};

export default mixins;
