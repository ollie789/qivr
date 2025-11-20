import { useMemo } from 'react';
import { SxProps, useTheme } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { LineChart } from 'echarts/charts';
import { LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useSettingsContext } from 'providers/SettingsProvider';
import ReactEchart from 'components/base/ReactEchart';

echarts.use([LegendComponent, TooltipComponent, LineChart, CanvasRenderer]);

interface ActivityChartProps {
  sx?: SxProps;
  data: number[];
  ref?: React.Ref<null | EChartsReactCore>;
}

const ActivityChart = ({ sx, data, ref }: ActivityChartProps) => {
  const { vars } = useTheme();
  const { getThemeColor } = useSettingsContext();

  const option = useMemo(
    () => ({
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: {
        type: 'category',
        data: Array.from({ length: data.length }, (_, i) => i + 1),
        axisTick: {
          show: false,
        },
        axisLine: {
          show: false,
        },
        boundaryGap: 0,
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          show: false,
        },
        splitLine: {
          show: false,
        },
      },
      series: [
        {
          data,
          type: 'line',
          showSymbol: false,
          width: 1,
          lineStyle: {
            color: getThemeColor(vars.palette.chBlue[500]),
            width: 1,
          },
        },
      ],
    }),
    [vars.palette, getThemeColor, data],
  );

  return <ReactEchart ref={ref} echarts={echarts} option={option} sx={sx} />;
};

export default ActivityChart;
