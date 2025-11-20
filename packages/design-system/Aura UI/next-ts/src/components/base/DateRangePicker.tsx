import { useState } from 'react';
import ReactDatePicker, { DatePickerProps as ReactDatePickerProps } from 'react-datepicker';
import { Box, Button, Stack, SxProps, TextField, Typography } from '@mui/material';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import IconifyIcon from './IconifyIcon';

interface DateRangePickerProps {
  defaultStartDate?: Date | null;
  defaultEndDate?: Date | null;
  sx?: SxProps;
  onChange?: (dates: [Date | null, Date | null]) => void;
}

const DateRangePicker = ({
  defaultStartDate = null,
  defaultEndDate = null,
  selectsMultiple,
  onChange,
  sx,
  ...rest
}: DateRangePickerProps & ReactDatePickerProps) => {
  const [startDate, setStartDate] = useState<Date | null>(defaultStartDate);
  const [endDate, setEndDate] = useState<Date | null>(defaultEndDate);
  const { up } = useBreakpoints();

  const upSm = up('sm');

  const handleChange = (dates: [Date | null, Date | null]) => {
    const [start, end] = dates;
    setStartDate(start);
    setEndDate(end);
    if (onChange) {
      onChange(dates);
    }
  };

  return (
    <Box sx={{ ...sx }}>
      <ReactDatePicker
        selected={startDate}
        startDate={startDate || undefined}
        endDate={endDate || undefined}
        onChange={handleChange}
        popperPlacement={upSm ? 'bottom-start' : undefined}
        showPopperArrow={false}
        selectsRange
        wrapperClassName={rest.isClearable && (startDate || endDate) ? 'clearable' : ''}
        customInput={<TextField label="Select Date Range" fullWidth />}
        renderCustomHeader={({
          date,
          decreaseMonth,
          increaseMonth,
          prevMonthButtonDisabled,
          nextMonthButtonDisabled,
        }) => (
          <Stack sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Button
              shape="square"
              color="neutral"
              onClick={decreaseMonth}
              disabled={prevMonthButtonDisabled}
            >
              <IconifyIcon icon="material-symbols:chevron-left-rounded" sx={{ fontSize: 20 }} />
            </Button>

            <Typography variant="button">
              {date.toLocaleString('default', { month: 'long' })} {date.getFullYear()}
            </Typography>

            <Button
              shape="square"
              color="neutral"
              onClick={increaseMonth}
              disabled={nextMonthButtonDisabled}
            >
              <IconifyIcon icon="material-symbols:chevron-right-rounded" sx={{ fontSize: 20 }} />
            </Button>
          </Stack>
        )}
        {...rest}
      />
    </Box>
  );
};

export default DateRangePicker;
