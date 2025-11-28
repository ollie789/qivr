/**
 * Theme Utility Functions
 * Aurora UI-inspired helpers for CSS variables and channel colors
 */

/**
 * Convert hex color to RGB channel format (space-separated)
 * Used for CSS variable rgba() support
 * Example: #3B82F6 → "59 130 246"
 */
const hexToRgbChannel = (hexColor: string): string => {
  const r = parseInt(hexColor.substring(1, 3), 16);
  const g = parseInt(hexColor.substring(3, 5), 16);
  const b = parseInt(hexColor.substring(5, 7), 16);

  return `${r} ${g} ${b}`;
};

type ColorPalette = Record<string, string | undefined>;

type PaletteWithChannels<T extends ColorPalette> = T & {
  [K in keyof T as `${string & K}Channel`]: string;
} & {
  [K in keyof T as K extends number ? `${K}Channel` : never]: string;
};

/**
 * Generate palette with channel variants for opacity support
 * Example: { main: '#3B82F6' } → { main: '#3B82F6', mainChannel: '59 130 246' }
 */
export const generatePaletteChannel = <T extends ColorPalette>(
  palette: T,
): PaletteWithChannels<T> => {
  const channels: Record<string, string | undefined> = {};

  Object.entries(palette).forEach(([colorName, colorValue]) => {
    if (colorValue) {
      channels[`${colorName}Channel`] = hexToRgbChannel(colorValue);
    }
  });

  return { ...palette, ...channels } as PaletteWithChannels<T>;
};

/**
 * Create rgba color from CSS variable channel
 * Uses modern CSS rgba syntax with slash separator
 * Example: cssVarRgba('59 130 246', 0.5) → 'rgba(59 130 246 / 0.5)'
 */
export const cssVarRgba = (color: string, alpha: number) => {
  return `rgba(${color} / ${alpha})`;
};

/**
 * Convert hex to standard RGB array
 * Example: #3B82F6 → [59, 130, 246]
 */
export const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  return [r, g, b];
};

/**
 * Create rgba color from hex with alpha
 * Example: rgbaColor('#3B82F6', 0.5) → 'rgba(59, 130, 246, 0.5)'
 */
export const rgbaColor = (color = '#fff', alpha = 0.5) => {
  const [r, g, b] = hexToRgb(color);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * Capitalize first letter of a string
 * Example: 'primary' → 'Primary'
 */
export const capitalize = (string: string) =>
  (string.charAt(0).toUpperCase() + string.slice(1)).replace(/-/g, ' ');

/**
 * Format large numbers with K, M, B suffixes
 * Example: 1500 → '1.5K', 1500000 → '1.5M'
 */
export const formatNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(num % 1_000_000_000 < 10 ? 0 : 1) + 'B';
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(num % 1_000_000 < 10 ? 0 : 1) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(num % 1_000 < 10 ? 0 : 1) + 'K';
  } else {
    return num.toString();
  }
};

/**
 * Format currency with locale support
 */
export const currencyFormat = (
  amount: number,
  locale: Intl.LocalesArgument = 'en-US',
  options: Intl.NumberFormatOptions = {},
) => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
};

/**
 * Format number with locale support
 */
export const numberFormat = (
  number: number,
  locale: Intl.LocalesArgument = 'en-US',
  options: Intl.NumberFormatOptions = {
    notation: 'standard',
  },
) =>
  new Intl.NumberFormat(locale, {
    ...options,
  }).format(number);

/**
 * Calculate percentage
 */
export const getPercentage = (value: number, total: number) => {
  return Math.round((value / total) * 100);
};

/**
 * Calculate percentage change between two numbers
 */
export const calculatePercentageIncrement = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return Math.round(((current - previous) / previous) * 100);
};

/**
 * Convert seconds to HH:MM:SS format
 */
export const secondsToHms = (d: number) => {
  d = Math.max(0, Math.floor(d));

  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  const s = d % 60;

  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Convert seconds to MM:SS format
 */
export const secondsToMs = (seconds: number) => {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);

  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (fileName: string, separator = '.') =>
  fileName.split(separator).pop() || 'unknown';

/**
 * Check if file is an image
 */
export const isImageFile = (file: File) => {
  const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  return imageMimeTypes.includes(file.type);
};

/**
 * Get file icon based on extension
 */
export const getFileIcon = (fileFormat: string): string => {
  switch (fileFormat.toLowerCase()) {
    case 'zip':
    case 'rar':
      return 'material-symbols:folder-zip-outline-rounded';
    case 'txt':
      return 'material-symbols:text-snippet-outline-rounded';
    case 'csv':
      return 'material-symbols:csv-outline-rounded';
    case 'wav':
    case 'mp3':
    case 'ogg':
    case 'm4a':
      return 'material-symbols:audio-file-outline-rounded';
    case 'mp4':
    case 'mkv':
    case 'avi':
      return 'material-symbols:video-file-outline-rounded';
    case 'pdf':
      return 'material-symbols:picture-as-pdf-outline-rounded';
    case 'jpg':
    case 'png':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return 'material-symbols:imagesmode-outline-rounded';
    case 'doc':
    case 'docx':
      return 'material-symbols:description-outline-rounded';
    case 'xls':
    case 'xlsx':
      return 'material-symbols:table-chart-outline-rounded';
    default:
      return 'material-symbols:lab-profile-outline-rounded';
  }
};

/**
 * Convert kebab-case to Title Case
 */
export const kebabToTitleCase = (str: string) => {
  return str
    .toLowerCase()
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Convert string to kebab-case
 */
export const kebabCase = (string: string) =>
  string
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

/**
 * Convert kebab-case to Sentence Case
 * Example: 'hello-world-test' → 'Hello world test'
 */
export const kebabToSentenceCase = (str: string) => {
  return str
    .toLowerCase()
    .split('-')
    .map((word, index) => (index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
};

/**
 * Convert any string to Sentence Case
 * Example: 'helloWorld' → 'Hello world', 'hello_world' → 'Hello world'
 */
export const toSentenceCase = (str: string) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
};

/**
 * Convert any string to Title Case
 * Example: 'helloWorld' → 'Hello World', 'hello_world' → 'Hello World'
 */
export const toTitleCase = (str: string) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Get percentage as string with % suffix
 */
export const getPercentageStr = (value: number, total: number = 100) => {
  return `${getPercentage(value, total)}%`;
};

/**
 * Get random number in range
 */
export const getRandomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min) + min);
};

/**
 * Generate array of numbers in range
 */
export const getNumbersInRange = (startAt: number, endAt: number) => {
  return [...Array(endAt + 1 - startAt).keys()].map((i) => i + startAt);
};

/**
 * Generate unique ID using timestamp and random chars
 */
export const generateUniqueId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomChars = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `${timestamp}${randomChars}`;
};

/**
 * Get currency symbol for a currency code
 */
export const getCurrencySymbol = (currency: string, locale: Intl.LocalesArgument = 'en-US') => {
  const parts = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  })
    .formatToParts(0)
    .find((x) => x.type === 'currency');

  return parts ? parts.value : '$';
};

/**
 * Convert file to attachment object
 */
export const convertFileToAttachment = (file: File) => ({
  name: file.name,
  size: `${(file.size / 1024).toFixed(2)} KB`,
  format: getFileExtension(file.name),
  preview: isImageFile(file) ? URL.createObjectURL(file) : undefined,
});

/**
 * Mask card number (show only last 4 digits)
 */
export const maskCardNumber = (cardNumber: string): string =>
  cardNumber
    .split(' ')
    .map((group, index, array) => (index === array.length - 1 ? group : '****'))
    .join(' ');

type ByteUnit = 'b' | 'kb' | 'mb' | 'gb' | 'tb';

interface ConvertSizeOptions {
  from: ByteUnit;
  to: ByteUnit;
  reversible?: boolean;
}

/**
 * Convert file size between byte units
 */
export const convertSize = (
  size: number,
  options: ConvertSizeOptions = { from: 'kb', to: 'gb', reversible: false },
): number => {
  const units: ByteUnit[] = ['b', 'kb', 'mb', 'gb', 'tb'];
  let { from, to } = options;
  const { reversible } = options;

  if (!reversible) {
    [from, to] = [to, from];
  }

  const fromIndex = units.indexOf(from.toLowerCase() as ByteUnit);
  const toIndex = units.indexOf(to.toLowerCase() as ByteUnit);

  if (fromIndex === -1 || toIndex === -1) {
    throw new Error(`Invalid units. Supported units are: ${units.join(', ')}`);
  }

  const factor = Math.pow(1024, toIndex - fromIndex);
  return size * factor;
};

/**
 * Get range label for a numeric value
 */
export const getRangeLabel = (value: number) => {
  if (value < 50) return '0-50';
  if (value < 100) return '50-100';
  if (value < 250) return '100-250';
  if (value < 500) return '250-500';
  return '500+';
};

/**
 * Local storage helpers
 */
export const getItemFromStore = (
  key: string,
  defaultValue?: string | boolean,
  store = localStorage,
) => {
  try {
    return store.getItem(key) === null ? defaultValue : JSON.parse(store.getItem(key) as string);
  } catch {
    return store.getItem(key) || defaultValue;
  }
};

export const setItemToStore = (key: string, payload: string, store = localStorage) =>
  store.setItem(key, payload);

export const removeItemFromStore = (key: string, store = localStorage) => store.removeItem(key);
