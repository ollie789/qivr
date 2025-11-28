/**
 * Design System Configuration Types
 */

export type ThemeMode = 'light' | 'dark' | 'system';
export type TextDirection = 'ltr' | 'rtl';

export interface Config {
  textDirection: TextDirection;
}

export const initialConfig: Config = {
  textDirection: 'ltr',
};
