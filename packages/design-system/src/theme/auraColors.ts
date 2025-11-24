// Aura UI Color Palette - Refined colors with gradients

export const auraColors = {
  // Primary Blues
  blue: {
    50: '#EAF3FD',
    100: '#C6DDFB',
    200: '#A1C7F8',
    300: '#7DB1F5',
    400: '#589BF3',
    500: '#3385F0',
    600: '#2B71CC',
    700: '#245DA8',
    800: '#1C4984',
    900: '#143560',
    lighter: '#EAF3FD',
    light: '#7DB1F5',
    main: '#3385F0',
    dark: '#245DA8',
    darker: '#143560',
  },

  // Purple/Violet
  purple: {
    50: '#F2E4FE',
    100: '#E6CAFE',
    200: '#D6A8FD',
    300: '#C686FC',
    400: '#B663FB',
    500: '#A641FA',
    600: '#8D37D5',
    700: '#742DAF',
    800: '#5B2489',
    900: '#421A64',
    lighter: '#F2E4FE',
    light: '#C686FC',
    main: '#A641FA',
    dark: '#742DAF',
    darker: '#421A64',
  },

  // Success Green
  green: {
    50: '#E6F9F0',
    100: '#C2F1DA',
    200: '#9BE8C4',
    300: '#74DFAE',
    400: '#4DD698',
    500: '#26CD82',
    600: '#20AE6F',
    700: '#1A8F5C',
    800: '#147049',
    900: '#0E5136',
    lighter: '#E6F9F0',
    light: '#74DFAE',
    main: '#26CD82',
    dark: '#1A8F5C',
    darker: '#0E5136',
  },

  // Warning Orange
  orange: {
    50: '#FEEFE1',
    100: '#FCDFC4',
    200: '#FBCB9D',
    300: '#F9B677',
    400: '#F8A250',
    500: '#F68D2A',
    600: '#D17823',
    700: '#AC631D',
    800: '#874E17',
    900: '#623911',
    lighter: '#FEEFE1',
    light: '#F9B677',
    main: '#F68D2A',
    dark: '#AC631D',
    darker: '#623911',
  },

  // Error Red
  red: {
    50: '#F9E2E6',
    100: '#F2C1CA',
    200: '#E99AA8',
    300: '#E17286',
    400: '#D84A63',
    500: '#D02241',
    600: '#B11D37',
    700: '#91182D',
    800: '#721324',
    900: '#530E1A',
    lighter: '#F9E2E6',
    light: '#E17286',
    main: '#D02241',
    dark: '#91182D',
    darker: '#530E1A',
  },

  // Info Cyan
  cyan: {
    50: '#E0F7FA',
    100: '#B2EBF2',
    200: '#80DEEA',
    300: '#4DD0E1',
    400: '#26C6DA',
    500: '#00BCD4',
    600: '#00ACC1',
    700: '#0097A7',
    800: '#00838F',
    900: '#006064',
    lighter: '#E0F7FA',
    light: '#4DD0E1',
    main: '#00BCD4',
    dark: '#0097A7',
    darker: '#006064',
  },

  // Neutral Greys
  grey: {
    50: '#F7FAFC',
    100: '#EBF2F5',
    200: '#DBE6EB',
    300: '#C3D3DB',
    400: '#9CAEB8',
    500: '#77878F',
    600: '#4D595E',
    700: '#262D30',
    800: '#1B2124',
    900: '#111417',
    950: '#06080A',
  },
};

// Gradient Presets
export const auraGradients = {
  primary: {
    from: '#3385F0',
    to: '#245DA8',
  },
  success: {
    from: '#26CD82',
    to: '#1A8F5C',
  },
  warning: {
    from: '#F68D2A',
    to: '#AC631D',
  },
  error: {
    from: '#D02241',
    to: '#91182D',
  },
  purple: {
    from: '#A641FA',
    to: '#742DAF',
  },
  info: {
    from: '#00BCD4',
    to: '#0097A7',
  },
  ocean: {
    from: '#3385F0',
    to: '#00BCD4',
  },
  sunset: {
    from: '#F68D2A',
    to: '#D02241',
  },
  forest: {
    from: '#26CD82',
    to: '#0097A7',
  },
  royal: {
    from: '#A641FA',
    to: '#3385F0',
  },
};

// Icon Color Mappings
export const iconColors = {
  primary: auraColors.blue.main,
  success: auraColors.green.main,
  warning: auraColors.orange.main,
  error: auraColors.red.main,
  info: auraColors.cyan.main,
  purple: auraColors.purple.main,
};
