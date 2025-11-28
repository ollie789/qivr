import { TypographyVariantsOptions } from '@mui/material/styles';

const typography: TypographyVariantsOptions = {
  fontFamily: [
    'Inter',
    'Plus Jakarta Sans',
    'sans-serif',
  ].join(','),
  h1: {
    fontWeight: 700,
    fontSize: '2rem', // 32px (was 48px)
    lineHeight: 1.3,
  },
  h2: {
    fontWeight: 700,
    fontSize: '1.75rem', // 28px (was 42px)
    lineHeight: 1.3,
  },
  h3: {
    fontWeight: 700,
    fontSize: '1.5rem', // 24px (was 32px)
    lineHeight: 1.35,
  },
  h4: {
    fontWeight: 600,
    fontSize: '1.25rem', // 20px (was 28px)
    lineHeight: 1.4,
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.125rem', // 18px (was 24px)
    lineHeight: 1.4,
  },
  h6: {
    fontWeight: 600,
    fontSize: '1rem', // 16px (was 21px)
    lineHeight: 1.4,
  },
  subtitle1: {
    fontWeight: 500,
    fontSize: '0.9375rem', // 15px
    lineHeight: 1.5,
  },
  subtitle2: {
    fontWeight: 500,
    fontSize: '0.875rem', // 14px
    lineHeight: 1.5,
  },
  body1: {
    fontWeight: 400,
    fontSize: '0.9375rem', // 15px (was 16px)
    lineHeight: 1.6,
  },
  body2: {
    fontWeight: 400,
    fontSize: '0.8125rem', // 13px (was 14px)
    lineHeight: 1.6,
  },
  button: {
    fontWeight: 600,
    fontSize: '0.8125rem', // 13px (was 14px)
    lineHeight: 1.5,
    textTransform: 'none',
  },
  caption: {
    fontWeight: 400,
    fontSize: '0.75rem', // 12px
    lineHeight: 1.4,
  },
  overline: {
    fontWeight: 500,
    fontSize: '0.6875rem', // 11px
    lineHeight: 1.4,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
};

export default typography;
