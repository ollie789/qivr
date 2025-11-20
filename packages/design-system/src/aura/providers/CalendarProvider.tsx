import { createContext, useContext, ReactNode } from 'react';

const CalendarContext = createContext<any>(null);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  return <CalendarContext.Provider value={{}}>{children}</CalendarContext.Provider>;
};

export const useCalendar = () => useContext(CalendarContext);
export default CalendarProvider;
