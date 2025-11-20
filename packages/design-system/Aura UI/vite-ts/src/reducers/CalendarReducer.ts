import { CalendarApi } from '@fullcalendar/core';
import { CalendarState } from 'providers/CalendarProvider';
import { CalendarEvent } from 'types/calendar';

export const SET_CALENDAR_STATE = 'SET_CALENDAR_STATE';
export const INITIALIZE_CALENDAR = 'INITIALIZE_CALENDAR';
export const INITIALIZE_SCHEDULER = 'INITIALIZE_SCHEDULER';
export const HANDLE_SELECT = 'HANDLE_SELECT';
export const ADD_NEW_EVENT = 'ADD_NEW_EVENT';
export const ADD_NEW_TASK = 'ADD_NEW_TASK';
export const SELECT_EVENT = 'SELECT_EVENT';
export const UPDATE_EVENT = 'UPDATE_EVENT';
export const UPDATE_TASK = 'UPDATE_TASK';

export type CALENDAR_ACTION_TYPE =
  | {
      type: typeof SET_CALENDAR_STATE;
      payload: Partial<CalendarState>;
    }
  | {
      type: typeof INITIALIZE_CALENDAR;
      payload: CalendarApi;
    }
  | {
      type: typeof INITIALIZE_SCHEDULER;
      payload: CalendarApi;
    }
  | {
      type: typeof HANDLE_SELECT;
      payload: { startDate: string; endDate: string };
    }
  | {
      type: typeof ADD_NEW_EVENT;
      payload: CalendarEvent;
    }
  | {
      type: typeof ADD_NEW_TASK;
      payload: CalendarEvent;
    }
  | {
      type: typeof SELECT_EVENT;
      payload: CalendarEvent;
    }
  | {
      type: typeof UPDATE_EVENT;
      payload: CalendarEvent;
    }
  | {
      type: typeof UPDATE_TASK;
      payload: CalendarEvent;
    };

export const calendarReducer = (state: CalendarState, action: CALENDAR_ACTION_TYPE) => {
  switch (action.type) {
    case SET_CALENDAR_STATE: {
      return { ...state, ...action.payload };
    }
    case INITIALIZE_CALENDAR: {
      const { payload } = action;

      return {
        ...state,
        calendarApi: payload,
      };
    }
    case INITIALIZE_SCHEDULER: {
      return {
        ...state,
        schedulerApi: action.payload,
      };
    }
    case HANDLE_SELECT: {
      const { payload } = action;

      return {
        ...state,
        openNewEventModal: true,
        selectedStartDate: payload.startDate,
        selectedEndDate: payload.endDate,
        selectedItem: null,
      };
    }

    case ADD_NEW_EVENT: {
      const { payload } = action;
      state.calendarApi?.addEvent(payload);

      return {
        ...state,
        events: [...state.events, payload],
        openNewEventModal: false,
      };
    }
    case ADD_NEW_TASK: {
      const { payload } = action;
      state.calendarApi?.addEvent(payload);

      return {
        ...state,
        tasks: [...state.tasks, payload],
        openNewEventModal: false,
      };
    }
    case SELECT_EVENT: {
      return {
        ...state,
        selectedItem: action.payload,
        openNewEventModal: true,
      };
    }
    case UPDATE_EVENT:
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id ? action.payload : event,
        ),
        openNewEventModal: false,
      };
    case UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.payload.id ? action.payload : task)),
        openNewEventModal: false,
      };

    default:
      return state;
  }
};
