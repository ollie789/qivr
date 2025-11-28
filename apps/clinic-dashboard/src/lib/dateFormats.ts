/**
 * Standardized date format strings for consistent date display across the app.
 * Uses date-fns format patterns.
 */

/** Full date with time: "Jan 15, 2024 2:30 PM" */
export const DATE_TIME_FULL = "MMM d, yyyy h:mm a";

/** Full date with 24h time: "Jan 15, 2024 14:30" */
export const DATE_TIME_24H = "MMM d, yyyy HH:mm";

/** Date only: "Jan 15, 2024" */
export const DATE_FULL = "MMM d, yyyy";

/** Short date: "Jan 15" */
export const DATE_SHORT = "MMM d";

/** Month and year: "January 2024" */
export const MONTH_YEAR = "MMMM yyyy";

/** Day of week with date: "Monday, January 15" */
export const WEEKDAY_DATE = "EEEE, MMMM d";

/** Time only: "2:30 PM" */
export const TIME_12H = "h:mm a";

/** Time only 24h: "14:30" */
export const TIME_24H = "HH:mm";

/** ISO date: "2024-01-15" */
export const DATE_ISO = "yyyy-MM-dd";

/** Relative time labels */
export const RELATIVE_TIME_OPTIONS = {
  addSuffix: true,
};
