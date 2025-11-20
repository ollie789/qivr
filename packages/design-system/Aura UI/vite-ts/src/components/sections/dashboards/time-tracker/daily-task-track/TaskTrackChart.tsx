import { useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import dayjs from 'dayjs';
import { SvelteGanttOptions } from 'svelte-gantt/svelte';
import { Project, Task, TimeRange } from 'types/time-tracker';
import SvelteGanttChart from 'components/base/SvelteGanttChart';
import CustomTask from './CustomTask';

interface TaskTrackChartProps {
  projects: Project[];
  tasks: Task[];
  timeRanges: TimeRange[];
}

const customDateAdapter = {
  format(date: number, format: string) {
    return dayjs(date).format(format);
  },

  roundTo(date: number): number {
    const dayjsDate = dayjs(date);
    const seconds = dayjsDate.second();

    let roundedDate;
    if (seconds >= 30) {
      roundedDate = dayjsDate.add(60 - seconds, 'second').startOf('minute');
    } else {
      roundedDate = dayjsDate.startOf('minute');
    }

    return roundedDate.valueOf();
  },
};

const TaskTrackChart = ({ projects, tasks, timeRanges }: TaskTrackChartProps) => {
  const { typography, vars, direction } = useTheme();
  const taskElementHook = (node: HTMLElement, task: Task) => {
    const root = createRoot(node);
    root.render(<CustomTask task={task} vars={vars} direction={direction} />);

    return {
      update(newTask: Task) {
        root.render(<CustomTask task={newTask} vars={vars} direction={direction} />);
      },
    };
  };

  //@ts-ignore
  const options: SvelteGanttOptions = useMemo(() => {
    return {
      timeRanges,
      taskElementHook,
      dateAdapter: customDateAdapter,
      rows: projects.map((item) => ({ ...item, height: 72 })),
      tasks: tasks.map((task) => ({ ...task, classes: task.category })),
      from: dayjs().hour(9).minute(0).second(0).valueOf(),
      to: dayjs().hour(22).minute(0).second(0).valueOf(),
      headers: [{ unit: 'hour', format: 'h:mm A' }],
      tableHeaders: [{ title: 'Title', property: 'label', type: 'tree' }],
      ganttTableModules: [],
    };
  }, [vars.palette, projects, tasks, timeRanges]);

  return (
    <Box sx={{ width: 1, height: 540 }}>
      <SvelteGanttChart
        key={`TaskTrack-${direction}`}
        chartOptions={options}
        sx={{
          '& .sg-gantt': {
            borderBottom: 'none !important',

            '& .sg-timeline': {
              flexDirection: 'column-reverse !important',
              '& .sg-header': {
                background: 'none',
                '& .header-container .column-header-row:nth-of-type(1)': {
                  borderTop: 'none !important',
                  '& .column-header-cell': {
                    paddingLeft: '0 !important',
                  },
                },
              },
              '& .sg-time-range': {
                backgroundColor: `${vars.palette.dividerLight}`,
              },
              '& .sg-timeline-body': {
                padding: '0 !important',
              },
              '& .sg-row': {
                border: 'none !important',
              },
              '& .sg-task': {
                borderRadius: '8px !important',
                h6: {
                  fontFamily: typography.fontFamily,
                },
                div: {
                  fontSize: typography.caption.fontSize,
                  fontFamily: typography.fontFamily,
                },
              },
              '& .column-header-cell': {
                border: 'none !important',
                background: 'none !important',

                '& .column-header-cell-label': {
                  fontWeight: 400,
                  fontSize: typography.caption.fontSize,
                  color: vars.palette.text.secondary,
                },
              },
            },
          },
        }}
      />
    </Box>
  );
};

export default TaskTrackChart;
