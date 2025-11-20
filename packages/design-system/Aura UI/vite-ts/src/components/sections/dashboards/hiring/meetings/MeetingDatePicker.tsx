import { useState } from 'react';
import { inputBaseClasses } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import StyledTextField from 'components/styled/StyledTextField';

const MeetingDatePicker = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());

  const handleDateChange = (date: Dayjs | null) => {
    setSelectedDate(date);
  };

  return (
    <DatePicker
      format="DD MMM, YYYY"
      defaultValue={selectedDate}
      onChange={handleDateChange}
      slots={{
        textField: StyledTextField,
      }}
      sx={{
        maxWidth: { lg: 150 },

        [`& .${inputBaseClasses.input}`]: {
          pr: '0px !important',
        },
      }}
    />
  );
};

export default MeetingDatePicker;
