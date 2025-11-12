/**
 * Centralized date utilities and exports
 * Re-exports commonly used date-fns functions and provides custom utilities
 */

import {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  setHours,
  setMinutes,
  getHours,
  isSameDay,
  isToday,
} from 'date-fns';

// Commonly used date formatting functions
export const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy');
};

export const formatDateTime = (date: Date | string) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: Date | string) => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
};

// Re-export commonly used functions
export {
  format,
  parseISO,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  subWeeks,
  subMonths,
  setHours,
  setMinutes,
  getHours,
  isSameDay,
  isToday,
};
