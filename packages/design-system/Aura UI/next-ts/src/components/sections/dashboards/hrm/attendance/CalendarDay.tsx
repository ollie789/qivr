import { ThemeVars, useTheme } from '@mui/material';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import dayjs from 'dayjs';

interface CalendarDayProps {
  status: string;
  isDifferentMonthDay: boolean;
}

const getHighlightColor = (type: string, vars: ThemeVars) => {
  switch (type) {
    case 'ON TIME':
      return vars.palette.success.lighter;
    case 'DELAYED':
      return vars.palette.warning.lighter;
    case 'ABSENT':
      return vars.palette.error.lighter;
    case 'LEAVE':
      return vars.palette.info.lighter;
  }
};

const CalendarDay = (props: PickersDayProps & CalendarDayProps) => {
  const { day, status, isDifferentMonthDay, ...other } = props;
  const { vars } = useTheme();

  const isToday = day.isSame(dayjs(), 'day');
  const isWeeknd = day.day() === 5 || day.day() === 6;
  const isHighlightedDay = day < dayjs() && !isDifferentMonthDay && !isWeeknd;

  return (
    <PickersDay
      {...other}
      day={day}
      sx={[
        isDifferentMonthDay && {
          opacity: 0.5,
        },
        isHighlightedDay && {
          bgcolor: `${getHighlightColor(status, vars)} !important`,
        },
        isHighlightedDay &&
          isToday && {
            borderColor: `${getHighlightColor(status, vars)} !important`,
          },
        isToday && {
          bgcolor: `${vars.palette.primary.main} !important`,
        },
      ]}
    />
  );
};

export default CalendarDay;
