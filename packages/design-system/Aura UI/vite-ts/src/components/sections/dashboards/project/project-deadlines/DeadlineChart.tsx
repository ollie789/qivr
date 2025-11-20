import { useMemo } from 'react';
import { SxProps, ThemeVars, useTheme } from '@mui/material';
import { EChartsOption } from 'echarts-for-react';
import { GaugeChart } from 'echarts/charts';
import { LegendComponent, TitleComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useSettingsContext } from 'providers/SettingsProvider';
import { DeadlineMetric } from 'types/project';
import ReactEchart from 'components/base/ReactEchart';

interface DeadlineChartProps {
  sx?: SxProps;
  data: DeadlineMetric[];
}

echarts.use([TooltipComponent, CanvasRenderer, LegendComponent, GaugeChart, TitleComponent]);

export const getCompletionColor = (
  completed: 'before' | 'after' | 'on',
  vars: ThemeVars,
  getThemeColor: (color: string) => string,
): string => {
  switch (completed) {
    case 'before':
      return getThemeColor(vars.palette.chGreen[500]);
    case 'after':
      return getThemeColor(vars.palette.chOrange[500]);
    case 'on':
      return getThemeColor(vars.palette.chBlue[500]);
    default:
      return getThemeColor(vars.palette.chGrey[500]);
  }
};

const DeadlineChart = ({ sx, data }: DeadlineChartProps) => {
  const { vars, typography } = useTheme();
  const { getThemeColor } = useSettingsContext();
  const chartData = useMemo(
    () =>
      data.map((metric, index) => ({
        ...metric,
        radius: `${(85 - index * 15) * 0.8}%`,
        color: getCompletionColor(metric.completed, vars, getThemeColor),
        totalProjects: data.reduce((sum, project) => project.count + sum, 0),
      })),
    [data, vars.palette, getThemeColor],
  );

  const getOptions: EChartsOption = useMemo(
    () => ({
      title: {
        text: `${chartData[0]?.totalProjects}`,
        left: '50%',
        top: '50%',
        textAlign: 'center',
        textVerticalAlign: 'middle',
        textStyle: {
          fontSize: 32,
          fontFamily: typography.fontFamily,
          fontWeight: typography.fontWeightBold,
          color: getThemeColor(vars.palette.text.primary),
        },
      },
      tooltip: {
        trigger: 'item',
        formatter: '{b0} deadline: {c0}%',
      },
      series: chartData.map((item) => ({
        type: 'gauge',
        startAngle: 90,
        endAngle: -270,
        radius: item.radius,
        pointer: { show: false },
        center: ['51%', '50%'],
        progress: {
          show: true,
          overlap: false,
          roundCap: true,
          clip: false,
          itemStyle: { color: item.color },
        },
        axisLine: {
          lineStyle: {
            width: 8.5,
            color: [[1, getThemeColor(vars.palette.chGrey[200])]],
          },
        },
        splitLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        data: [
          {
            value: Math.round((item.count / item.totalProjects) * 100),
            name: item.completed,
          },
        ],
        detail: { show: false },
        title: { show: false },
        animationDuration: 2000,
      })),
    }),
    [chartData, vars.palette, getThemeColor],
  );

  return <ReactEchart echarts={echarts} option={getOptions} sx={sx} />;
};

export default DeadlineChart;
