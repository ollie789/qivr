import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  Autocomplete,
  Avatar,
  Chip,
  MenuItem,
  SelectChangeEvent,
  Stack,
  Typography,
  buttonBaseClasses,
  inputBaseClasses,
} from '@mui/material';
import { defaultEmails } from 'data/email';
import { useEmailContext } from 'providers/EmailProvider';
import IconifyIcon from 'components/base/IconifyIcon';
import StyledFormControl from 'components/styled/StyledFormControl';
import StyledSelect from 'components/styled/StyledSelect';
import StyledTextField from 'components/styled/StyledTextField';

interface SendOptionInputProps {
  setSendType: Dispatch<SetStateAction<string>>;
  sendType: string;
}

const SendOptionInput = ({ setSendType, sendType }: SendOptionInputProps) => {
  const {
    emailState: { email },
  } = useEmailContext();
  const [values, setValues] = useState<string[]>([email!.user.email, ...defaultEmails]);
  const handleChange = (event: SelectChangeEvent) => {
    setSendType(event.target.value);
  };
  useEffect(() => {
    if (sendType === 'Reply') {
      setValues([email!.user.email]);
    } else {
      setValues([]);
    }
  }, [sendType, email]);

  return (
    <Stack sx={{ flexWrap: 'wrap', flexDirection: { xs: 'column', sm: 'row' } }}>
      <StyledFormControl>
        <StyledSelect
          variant="filled"
          inputProps={{ 'aria-label': 'Send type' }}
          value={sendType}
          onChange={handleChange}
          renderValue={() => (
            <Typography
              variant="subtitle2"
              sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 3 }}
            >
              <IconifyIcon
                icon={
                  sendType === 'Reply'
                    ? 'material-symbols:reply-rounded'
                    : 'material-symbols:forward-rounded'
                }
                sx={{ fontSize: 20 }}
              />
              {sendType}
            </Typography>
          )}
          sx={{ alignSelf: 'flex-start' }}
        >
          <MenuItem value="Reply">
            <IconifyIcon icon="material-symbols:reply-rounded" sx={{ fontSize: 20, mr: 1 }} />
            Reply
          </MenuItem>
          <MenuItem value="Forward">
            <IconifyIcon icon="material-symbols:forward-rounded" sx={{ fontSize: 20, mr: 1 }} />
            Forward
          </MenuItem>
        </StyledSelect>
      </StyledFormControl>
      <Autocomplete
        sx={{ flex: 1 }}
        multiple
        freeSolo
        options={defaultEmails}
        value={values}
        disableClearable
        onChange={(event, newValue) => setValues(newValue)}
        renderValue={(value: string[], getItemProps) =>
          value.map((option: string, index: number) => {
            const { key, ...rest } = getItemProps({ index });

            return (
              <Chip
                key={key}
                variant="outlined"
                size="medium"
                sx={{ [`&.${buttonBaseClasses.root}`]: { mt: 0 } }}
                avatar={
                  option === email?.user.email ? (
                    <Avatar alt="Natacha" src={email?.user.avatar} />
                  ) : undefined
                }
                color="neutral"
                label={option}
                {...rest}
              />
            );
          })
        }
        renderInput={(params) => (
          <StyledTextField
            {...params}
            type="email"
            sx={{
              [`& .${inputBaseClasses.root}`]: {
                bgcolor: 'unset',
                gap: 0.5,
                ['&:hover']: {
                  bgcolor: 'unset',
                },
                [`&.${inputBaseClasses.focused}`]: {
                  bgcolor: 'unset !important',
                  boxShadow: 'none',
                },
              },
            }}
            variant="filled"
            placeholder="Type..."
          />
        )}
      />
    </Stack>
  );
};

export default SendOptionInput;
