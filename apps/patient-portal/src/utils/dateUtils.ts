import { format, parseISO, isToday, isTomorrow, isPast } from "date-fns";

/**
 * Format a date string for display with time
 */
export function formatDateTime(isoDate: string): string {
  const date = parseISO(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return format(date, "MMM dd, yyyy • h:mm a");
}

/**
 * Format a due date with relative labels (Today, Tomorrow, Overdue)
 */
export function formatDueDate(dateStr?: string): string | null {
  if (!dateStr) return null;
  const date = parseISO(dateStr);
  if (Number.isNaN(date.getTime())) return null;

  if (isToday(date)) return `Today at ${format(date, "h:mm a")}`;
  if (isTomorrow(date)) return `Tomorrow at ${format(date, "h:mm a")}`;
  if (isPast(date)) return `Overdue - ${format(date, "MMM d")}`;
  return format(date, "EEE, MMM d 'at' h:mm a");
}

/**
 * Get chip color based on date urgency
 */
export function getDateChipColor(dateStr: string): "error" | "warning" | "default" {
  const date = parseISO(dateStr);
  if (Number.isNaN(date.getTime())) return "default";
  if (isToday(date)) return "error";
  if (isTomorrow(date)) return "warning";
  return "default";
}

/**
 * Get chip label based on date
 */
export function getDateChipLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  if (Number.isNaN(date.getTime())) return "Upcoming";
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}
