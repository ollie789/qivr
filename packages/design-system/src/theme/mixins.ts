import type { MixinsOptions, Breakpoint } from '@mui/material';

/**
 * Layout type for different navigation configurations
 */
export type LayoutType = 'default' | 'slim' | 'compact';

declare module '@mui/material/styles' {
  interface Mixins {
    /** Topbar heights for different layout types */
    topbar: Record<LayoutType, Partial<Record<Breakpoint, number>>>;
    /** Sidebar widths for expanded/collapsed states */
    sidebar: {
      expanded: number;
      collapsed: number;
    };
    /** Footer heights by breakpoint */
    footer: Partial<Record<Breakpoint, number>>;
    /** Calculate top offset from topbar height */
    topOffset: (
      topbarHeight: Partial<Record<Breakpoint, number>>,
      offset?: number,
      important?: boolean,
    ) => Record<string, string>;
    /** Calculate content height minus topbar */
    contentHeight: (
      topbarHeight: Partial<Record<Breakpoint, number>>,
      offset?: number,
      important?: boolean,
    ) => Record<string, string>;
    /** Calculate content height minus topbar and footer */
    mainContentHeight: (
      topbarHeight: Partial<Record<Breakpoint, number>>,
      footerHeight: Partial<Record<Breakpoint, number>>,
      offset?: number,
    ) => Record<string, string>;
  }
}

/**
 * Layout mixins for consistent spacing and sizing across the application
 *
 * @example
 * // In a component's sx prop:
 * sx={{
 *   mt: theme => theme.mixins.topOffset(theme.mixins.topbar.default),
 *   height: theme => theme.mixins.contentHeight(theme.mixins.topbar.default),
 * }}
 */
const mixins: MixinsOptions = {
  // Topbar heights for different layout configurations
  topbar: {
    default: {
      xs: 64,
      md: 72,
    },
    slim: {
      xs: 48,
      md: 56,
    },
    compact: {
      xs: 56,
      md: 64,
    },
  },

  // Sidebar widths
  sidebar: {
    expanded: 280,
    collapsed: 72,
  },

  // Footer heights
  footer: {
    xs: 72,
    sm: 56,
  },

  /**
   * Generate top offset values based on topbar height
   * Useful for positioning sticky elements below the topbar
   */
  topOffset: (
    topbarHeight: Partial<Record<Breakpoint, number>>,
    offset: number = 0,
    important = false,
  ): Record<string, string> => {
    if (!topbarHeight) return {};

    return Object.entries(topbarHeight).reduce(
      (acc: Record<string, string>, [key, value]) => {
        acc[key] = `${(value as number) + offset}px${important ? ' !important' : ''}`;
        return acc;
      },
      {},
    );
  },

  /**
   * Generate content height values (100vh minus topbar)
   * Useful for full-height scrollable content areas
   */
  contentHeight: (
    topbarHeight: Partial<Record<Breakpoint, number>>,
    offset: number = 0,
    important = false,
  ): Record<string, string> => {
    if (!topbarHeight) return {};

    return Object.entries(topbarHeight).reduce(
      (acc: Record<string, string>, [key, value]) => {
        acc[key] = `calc(100vh - ${(value as number) + offset}px)${important ? ' !important' : ''}`;
        return acc;
      },
      {},
    );
  },

  /**
   * Generate main content height (100vh minus topbar and footer)
   * Useful for main content area between header and footer
   */
  mainContentHeight: (
    topbarHeight: Partial<Record<Breakpoint, number>>,
    footerHeight: Partial<Record<Breakpoint, number>>,
    offset: number = 0,
  ): Record<string, string> => {
    if (!topbarHeight) return {};

    // Merge breakpoints from both topbar and footer
    const breakpoints = new Set([
      ...Object.keys(topbarHeight),
      ...Object.keys(footerHeight),
    ]);

    return Array.from(breakpoints).reduce(
      (acc: Record<string, string>, key) => {
        const topValue = topbarHeight[key as Breakpoint] ?? topbarHeight.xs ?? 0;
        const footerValue = footerHeight[key as Breakpoint] ?? footerHeight.xs ?? 0;
        acc[key] = `calc(100vh - ${topValue + footerValue + offset}px)`;
        return acc;
      },
      {},
    );
  },
};

export default mixins;
