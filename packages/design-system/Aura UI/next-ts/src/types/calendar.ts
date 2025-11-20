import { PaletteColorKey } from 'theme/palette';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay: boolean;
  category?: string;
  eventType?: string;
  url?: string;
  location?: string;
  description?: string;
  notifyInMinutes?: number;
  guests?: string[];
}
export interface CalendarTask {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay: boolean;
  description?: string;
  selectedList?: string;
  repeated?: string;
}

export interface EventCategory {
  value: string;
  label: string;
  color: PaletteColorKey;
}
