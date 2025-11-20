import { RefObject, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { GridApiCommunity } from '@mui/x-data-grid/internals';
import dayjs from 'dayjs';
import useNumberFormat from 'hooks/useNumberFormat';
import { getPastDates } from 'lib/utils';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import { Timesheet } from 'types/time-tracker';
import DashboardMenu from 'components/common/DashboardMenu';
import DataGridPagination from 'components/pagination/DataGridPagination';
import TableLabelDisplayedRows from 'components/pagination/TableLabelDisplayedRows';

const defaultPageSize = 6;

interface TimesheetTableProps {
  apiRef: RefObject<GridApiCommunity | null>;
  timesheet: Timesheet[];
  filterBy: { member?: string; team?: string; timeframe: string };
  filterButtonEl: HTMLButtonElement | null;
}

interface TimesheetColumns extends Timesheet {
  totalTimes: string;
}

const getTimeRange = (type: string) => {
  if (type === 'last 2 weeks') {
    return getPastDates(14).map((day) => dayjs(day).format('ddd, D MMM'));
  } else if (type === 'last 30 days') {
    return getPastDates(30).map((day) => dayjs(day).format('ddd, D MMM'));
  } else {
    return getPastDates('week').map((day) => dayjs(day).format('ddd, D MMM'));
  }
};

const formatTime = (totalSeconds: number) => {
  const timeDuration = dayjs.duration(totalSeconds, 'seconds');
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = timeDuration.minutes().toString().padStart(2, '0');
  const seconds = timeDuration.seconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};

const addTimes = (times: number[][]) => {
  return times.reduce((acc, curr) => curr.map((item, index) => (acc[index] || 0) + item), []);
};

const filterData = (
  project: Timesheet,
  filterBy: { member?: string; team?: string; timeframe: string },
) => {
  let times = [];

  if (filterBy.member) {
    times = project.workLogs.find((item) => item.user.name === filterBy.member)?.durations ?? [];
  } else if (filterBy.team) {
    const durations = project.workLogs
      .filter((item) => {
        if (item.team === filterBy.team) {
          return item;
        }
      })
      .map((item) => item.durations);

    times = addTimes(durations);
  } else {
    const durations = project.workLogs.map((item) => item.durations);
    times = addTimes(durations);
  }

  return times;
};

const TimesheetTable = ({ apiRef, filterBy, timesheet, filterButtonEl }: TimesheetTableProps) => {
  const { currencyFormat } = useNumberFormat();
  const timerange = getTimeRange(filterBy.timeframe);
  const { up } = useBreakpoints();
  const upLg = up('lg');

  const rows = timesheet.map((project) => {
    const times = filterData(project, filterBy).slice(-timerange.length);
    const totalTimes = times.reduce((sum, seconds) => sum + seconds, 0);

    return {
      ...project,
      totalTimes: formatTime(totalTimes),
      ...Object.fromEntries(
        timerange.map((day, index) => [day.replace(/[^a-zA-Z0-9]/g, ''), formatTime(times[index])]),
      ),
    };
  });

  const columns: GridColDef<TimesheetColumns>[] = useMemo(
    () => [
      {
        field: 'project',
        headerName: 'Project',
        headerClassName: 'project',
        minWidth: 260,
        flex: 1,
      },
      ...timerange.map((day) => ({
        field: day.replace(/[^a-zA-Z0-9]/g, ''),
        headerName: day,
        minWidth: 130,
        align: 'right' as const,
        headerAlign: 'right' as const,
        flex: 1,
      })),
      {
        field: 'totalTimes',
        headerName: 'Total',
        flex: 1,
        fontWeight: 'bold',
        align: 'right',
        headerAlign: 'right',
        minWidth: 140,
        renderCell: (params) => (
          <Typography variant="subtitle2" sx={{ color: 'text.primary' }}>
            {params.row.totalTimes}
          </Typography>
        ),
      },
      {
        field: 'action',
        headerAlign: 'right',
        align: 'right',
        editable: false,
        sortable: false,
        flex: 1,
        minWidth: 80,
        renderHeader: () => <DashboardMenu />,
        renderCell: () => <DashboardMenu />,
      },
    ],
    [currencyFormat],
  );

  return (
    <Box sx={{ width: 1 }}>
      <DataGrid
        rowHeight={64}
        rows={rows}
        apiRef={apiRef}
        columns={columns}
        pageSizeOptions={[defaultPageSize]}
        initialState={{
          pagination: {
            paginationModel: {
              pageSize: defaultPageSize,
            },
          },
        }}
        slots={{
          basePagination: (props) => (
            <DataGridPagination
              showAllHref="#!"
              labelDisplayedRows={upLg ? TableLabelDisplayedRows : () => null}
              {...props}
            />
          ),
        }}
        slotProps={{
          panel: {
            target: filterButtonEl,
          },
        }}
        sx={{
          '& .project': {
            pl: 3,
          },
        }}
      />
    </Box>
  );
};

export default TimesheetTable;
