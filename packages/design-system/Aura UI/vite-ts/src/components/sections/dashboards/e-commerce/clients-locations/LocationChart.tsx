import { useMemo } from 'react';
import { SxProps, useTheme } from '@mui/material';
import { BarChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { tooltipFormatterList } from 'helpers/echart-utils';
import useNumberFormat from 'hooks/useNumberFormat';
import { useBreakpoints } from 'providers/BreakpointsProvider';
import { useSettingsContext } from 'providers/SettingsProvider';
import { ClientLocation } from 'types/dashboard';
import ReactEchart from 'components/base/ReactEchart';

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  BarChart,
  CanvasRenderer,
  LegendComponent,
]);

interface LocationChartProps {
  data: ClientLocation[];
  sx: SxProps;
}

const LocationChart = ({ data, sx }: LocationChartProps) => {
  const { vars, typography } = useTheme();
  const { up, currentBreakpoint } = useBreakpoints();
  const upMd = up('md');
  const { numberFormat } = useNumberFormat();
  const { getThemeColor } = useSettingsContext();

  const getOptions = useMemo(
    () => ({
      tooltip: {
        trigger: 'axis',
        formatter: (params: CallbackDataParams[]) => tooltipFormatterList(params),
      },
      xAxis: {
        type: 'category',
        data: data.map((item) => item.name),
        axisLabel: {
          color: getThemeColor(vars.palette.text.secondary),
          fontSize: 12,
          fontFamily: typography.fontFamily,
          interval: currentBreakpoint === 'md' ? 'auto' : 0,
          rotate: upMd ? 0 : 70,
        },
        min: 'dataMin',
        max: 'dataMax',

        axisLine: {
          lineStyle: {
            color: getThemeColor(vars.palette.chGrey[300]),
          },
        },
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        axisTick: {
          show: false,
        },
        splitLine: {
          lineStyle: {
            color: getThemeColor(vars.palette.chGrey[200]),
          },
        },
        axisLabel: {
          show: false,
        },
        axisLine: {
          show: false,
        },
      },
      series: [
        {
          type: 'bar',
          data: data.map((item) => item.value),
          itemStyle: {
            borderRadius: [2, 2, 0, 0],
            color: getThemeColor(vars.palette.chBlue[300]),
          },
          barWidth: currentBreakpoint === 'md' ? 8 : 24,
          label: {
            show: true,
            position: 'outside',
            formatter: (params: CallbackDataParams) =>
              numberFormat(Number(params.value), {
                notation: 'compact',
              }),
            color: getThemeColor(vars.palette.chBlue[500]),
            fontWeight: 700,
            fontSize: 12,
          },
        },
      ],
      grid: {
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
        right: 0,
        left: 0,
        bottom: 2,
        top: 15,
      },
    }),
    [currentBreakpoint, vars.palette, getThemeColor, data, upMd, numberFormat],
  );

  return <ReactEchart echarts={echarts} option={getOptions} sx={sx} />;
};

export default LocationChart;
