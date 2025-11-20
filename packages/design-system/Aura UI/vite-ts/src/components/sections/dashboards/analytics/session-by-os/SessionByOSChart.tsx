import React, { useMemo } from 'react';
import { SxProps, useTheme } from '@mui/material';
import dayjs from 'dayjs';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { tooltipFormatterList } from 'helpers/echart-utils';
import { getPastDates } from 'lib/utils';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import { useSettingsContext } from 'providers/SettingsProvider';
import { UserEngagementData } from 'types/analytics';
import ReactEchart from 'components/base/ReactEchart';

echarts.use([TooltipComponent, GridComponent, LineChart, CanvasRenderer, LegendComponent]);

interface SessionByOSChartProps {
  sx: SxProps;
  data: UserEngagementData;
  ref?: React.Ref<null | EChartsReactCore>;
}

const SessionByOSChart = ({ sx, data, ref }: SessionByOSChartProps) => {
  const { vars } = useTheme();
  const { getThemeColor } = useSettingsContext();
  const { up } = useBreakpoints();

  const upMd = up('md');
  const upXl = up('xl');

  const getOptions = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: CallbackDataParams[]) => tooltipFormatterList(params, true),
        axisPointer: {
          type: 'line',
          lineStyle: {
            color: getThemeColor(vars.palette.dividerLight),
            type: 'solid',
          },
          z: 1,
        },
      },
      legend: {
        data: ['actual', 'projected'],
        show: false,
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: getPastDates(15).map((date) => {
          return dayjs(date).format('MMM DD');
        }),
        axisLabel: {
          show: false,
        },
        splitLine: {
          show: upMd && !upXl ? true : false,
          lineStyle: {
            color: getThemeColor(vars.palette.dividerLight),
          },
        },
      },
      yAxis: {
        type: 'value',
        boundaryGap: false,
        axisLabel: {
          show: false,
        },
        splitLine: {
          show: upMd && !upXl ? true : false,
          lineStyle: {
            color: getThemeColor(vars.palette.dividerLight),
          },
        },
      },
      series: [
        {
          name: 'Actual',
          type: 'line',
          data: data.actual,
          showSymbol: false,
          symbol: 'circle',
          smooth: 0.2,
          lineStyle: {
            width: 2,
            color: getThemeColor(vars.palette.chBlue[300]),
          },
          itemStyle: {
            color: getThemeColor(vars.palette.chBlue[300]),
          },
          emphasis: {
            lineStyle: {
              color: getThemeColor(vars.palette.chBlue[300]),
            },
            itemStyle: {
              color: getThemeColor(vars.palette.chBlue[300]),
            },
          },
        },
        {
          type: 'line',
          name: 'Projected',
          data: data.projected,
          showSymbol: false,
          symbol: 'circle',
          zlevel: 1,
          smooth: 0.2,
          lineStyle: {
            width: 1,
            type: 'dashed',
            color: getThemeColor(vars.palette.chGrey[400]),
          },
          itemStyle: {
            color: getThemeColor(vars.palette.chGrey[400]),
          },
          emphasis: {
            lineStyle: {
              color: getThemeColor(vars.palette.chGrey[400]),
            },
            itemStyle: {
              color: getThemeColor(vars.palette.chGrey[400]),
            },
          },
        },
      ],
      grid: { left: 0, right: 0, top: 10, bottom: 0, outerBoundsMode: 'none' },
    }),
    [vars.palette, getThemeColor, data, upMd, upXl],
  );

  return <ReactEchart ref={ref} echarts={echarts} option={getOptions} sx={sx} />;
};

export default SessionByOSChart;
