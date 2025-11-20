import { Controller, useFormContext } from 'react-hook-form';
import {
  Avatar,
  Button,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from '@mui/material';
import IconifyIcon from 'components/base/IconifyIcon';
import { NewTeamFormValues } from 'components/sections/kanban/create-board/steps/TeamInvite/NewTeamTabPanel';
import StyledFormControl from 'components/styled/StyledFormControl';
import StyledTextField from 'components/styled/StyledTextField';

interface NewTeamTableProps {
  fields: { id: string; name: string; email: string; avatar: string; role: string }[];
  remove: (index: number) => void;
}

const NewTeamTable = ({ fields, remove }: NewTeamTableProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext<NewTeamFormValues>();

  return (
    <TableContainer sx={{ ml: 0, pl: 0 }}>
      <Table aria-label="team management table" className="disable-edge-padding">
        <TableBody>
          {fields.map((person, index) => (
            <TableRow
              key={person.id}
              sx={{
                '&:last-of-type td': { border: 0 },
              }}
            >
              <TableCell sx={{ maxWidth: 392 }}>
                <Stack
                  sx={{
                    gap: 1.5,
                    alignItems: 'center',
                    pr: 2,
                  }}
                >
                  <Avatar alt={person.name} src={person.avatar} sx={{ width: 24, height: 24 }} />
                  <div>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 400,
                      }}
                    >
                      {person.name}
                    </Typography>
                    <Typography variant="caption">{person.email}</Typography>
                  </div>
                </Stack>
              </TableCell>

              <TableCell align="right" sx={{ width: 180 }}>
                {!person.name ? (
                  <Button
                    fullWidth
                    variant="soft"
                    color="primary"
                    endIcon={
                      <IconifyIcon
                        icon="material-symbols:outgoing-mail-outline"
                        sx={{ height: 20, width: 20, mt: 0.5 }}
                      />
                    }
                  >
                    Invite to Aurora
                  </Button>
                ) : (
                  <StyledFormControl sx={{ maxWidth: { sm: 120 }, width: 1, textAlign: 'left' }}>
                    <Controller
                      name={`team.${index}.role`}
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <StyledTextField select variant="filled" {...field}>
                          <MenuItem value="Member">Member</MenuItem>
                          <MenuItem value="Admin">Admin</MenuItem>
                          <MenuItem value="Guest">Guest</MenuItem>
                        </StyledTextField>
                      )}
                    />
                    {errors?.team?.[index]?.role && (
                      <Typography variant="caption" color="error">
                        {errors?.team?.[index]?.role?.message}
                      </Typography>
                    )}
                  </StyledFormControl>
                )}
              </TableCell>

              <TableCell align="left" sx={{ width: 36, px: 0 }}>
                <IconButton onClick={() => remove(index)}>
                  <IconifyIcon
                    icon="material-symbols:close-rounded"
                    color="text.primary"
                    fontSize={20}
                  />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default NewTeamTable;
