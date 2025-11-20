import { Dispatch, PropsWithChildren, createContext, use, useReducer } from 'react';
import { CalendarApi } from '@fullcalendar/core';
import { eventList, taskList } from 'data/calendar';
import {
  CALENDAR_ACTION_TYPE,
  SET_CALENDAR_STATE,
  calendarReducer,
} from 'reducers/CalendarReducer';
import { CalendarEvent, CalendarTask } from 'types/calendar';

export type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay';

export interface CalendarState {
  calendarApi: CalendarApi | null;
  schedulerApi: CalendarApi | null;
  title: string;
  selectedItem: CalendarEvent | CalendarTask | null;
  view: CalendarView;
  openNewEventModal: boolean;
  selectedStartDate: Date | string;
  selectedEndDate: Date | string;
  events: CalendarEvent[] | [];
  tasks: CalendarTask[] | [];
}

interface CalendarContextInterface extends CalendarState {
  calendarDispatch: Dispatch<CALENDAR_ACTION_TYPE>;
  updateView: (type: 'calendar' | 'scheduler', action: 'prev' | 'next' | 'today') => void;
  navigateToDate: (date: Date) => void;
}

export const CalendarContext = createContext({} as CalendarContextInterface);

const CalendarProvider = ({ children }: PropsWithChildren) => {
  const initialState: CalendarState = {
    calendarApi: null,
    schedulerApi: null,
    title: '',
    selectedItem: null,
    view: 'dayGridMonth',
    openNewEventModal: false,
    selectedStartDate: '',
    selectedEndDate: '',
    events: eventList,
    tasks: taskList,
  };

  const [calendarState, calendarDispatch] = useReducer(calendarReducer, initialState);

  const updateView = (type: 'calendar' | 'scheduler', action: 'prev' | 'next' | 'today') => {
    const api = type === 'calendar' ? calendarState.calendarApi : calendarState.schedulerApi;
    if (!api) return;
    if (action === 'next') api.next();
    else if (action === 'prev') api.prev();
    else api.today();

    calendarDispatch({
      type: SET_CALENDAR_STATE,
      payload: { title: api.view.title },
    });
  };

  const navigateToDate = (date: Date) => {
    if (calendarState.calendarApi) {
      calendarState.calendarApi.gotoDate(date);
    }
  };

  return (
    <CalendarContext
      value={{
        ...calendarState,
        calendarDispatch,
        updateView,
        navigateToDate,
      }}
    >
      {children}
    </CalendarContext>
  );
};

export const useCalendarContext = () => use(CalendarContext);

export default CalendarProvider;
