import { Dispatch, SetStateAction, useImperativeHandle } from 'react';
import { SxProps } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs, { Dayjs } from 'dayjs';
import { Attendance } from 'types/hrm';
import StyledDateCalendar from 'components/styled/StyledDateCalendar';
import CalendarDay from './CalendarDay';

interface AttendanceCalendarMethods {
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
}
interface AttendanceCalendarProps {
  currentDate: Dayjs;
  setCurrentDate: Dispatch<SetStateAction<Dayjs>>;
  attendance: Attendance;
  sx?: SxProps;
  ref?: React.Ref<AttendanceCalendarMethods>;
}

const AttendanceCalendar = ({
  currentDate,
  setCurrentDate,
  attendance,
  sx,
  ref,
}: AttendanceCalendarProps) => {
  useImperativeHandle(ref, () => ({
    goToNextMonth: () => setCurrentDate((prev) => prev.add(1, 'month')),
    goToPreviousMonth: () => setCurrentDate((prev) => prev.subtract(1, 'month')),
  }));

  return (
    <Box sx={sx}>
      <StyledDateCalendar
        value={currentDate}
        onChange={(newValue) => newValue && setCurrentDate(newValue)}
        slots={{
          calendarHeader: () => null,
          day: (dayProps) => (
            <CalendarDay
              {...dayProps}
              isDifferentMonthDay={dayProps.day.month() !== currentDate.month()}
              status={attendance.details[Number(dayjs(dayProps.day).format('D')) - 1].status}
            />
          ),
        }}
        showDaysOutsideCurrentMonth
        fixedWeekNumber={5}
        sx={{ minHeight: 300 }}
      />
    </Box>
  );
};

export default AttendanceCalendar;
