// Legacy exports (backward compatibility)
export * from './theme';
export * from './auraColors';
export * from './auraTokens';
export * from './darkTheme';

// New Aurora-inspired theme system with CSS variables
export * from './createQivrTheme';
export * from './ThemeProvider';
export * from './palette';
export * from './shadows';
export * from './utils';

// Layout utilities
export { default as mixins } from './mixins';
export type { LayoutType } from './mixins';
export { default as sxConfig } from './sxConfig';

// Glass effect system (unified tokens)
export { glassTokens, glassEffect } from './auraTokens';
