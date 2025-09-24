/**
 * Centralized date utilities and exports
 * Re-exports commonly used date-fns functions and provides custom utilities
 */

// Re-export commonly used date-fns functions
export {
  // Formatting
  format,
  formatDistance,
  formatDistanceToNow,
  formatRelative,
  formatISO,
  parseISO,
  
  // Date arithmetic
  addDays,
  addWeeks,
  addMonths,
  addYears,
  addHours,
  addMinutes,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  subHours,
  subMinutes,
  
  // Date comparison
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  isPast,
  isFuture,
  isWithinInterval,
  
  // Date manipulation
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfYear,
  
  // Date getters
  getDay,
  getDate,
  getMonth,
  getYear,
  getHours,
  getMinutes,
  getSeconds,
  getDaysInMonth,
  
  // Date setters
  setDate,
  setMonth,
  setYear,
  setHours,
  setMinutes,
  setSeconds,
  
  // Utilities
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  differenceInHours,
  differenceInMinutes,
  eachDayOfInterval,
  isValid,
} from 'date-fns';

// Re-export locale if needed
export { enAU } from 'date-fns/locale';

// Custom date utilities
export const formatAppointmentTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'h:mm a');
};

export const formatAppointmentDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEEE, d MMMM yyyy');
};

export const formatShortDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'dd/MM/yyyy');
};

export const formatTimeAgo = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const getDateRange = (view: 'day' | 'week' | 'month', date: Date = new Date()) => {
  switch (view) {
    case 'day':
      return {
        start: startOfDay(date),
        end: endOfDay(date),
      };
    case 'week':
      return {
        start: startOfWeek(date),
        end: endOfWeek(date),
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
  }
};

export const isBusinessHours = (date: Date): boolean => {
  const hours = getHours(date);
  const day = getDay(date);
  // Monday-Friday 9am-5pm
  return day >= 1 && day <= 5 && hours >= 9 && hours < 17;
};

export const getNextBusinessDay = (date: Date = new Date()): Date => {
  let nextDay = addDays(date, 1);
  while (getDay(nextDay) === 0 || getDay(nextDay) === 6) {
    nextDay = addDays(nextDay, 1);
  }
  return nextDay;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMinutes} min`;
};