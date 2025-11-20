import { useMemo } from 'react';
import { SxProps, useTheme } from '@mui/material';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { tooltipFormatterList } from 'helpers/echart-utils';
import { useSettingsContext } from 'providers/SettingsProvider';
import { LeadSourceData } from 'types/crm';
import ReactEchart from 'components/base/ReactEchart';

echarts.use([TooltipComponent, GridComponent, PieChart, CanvasRenderer, LegendComponent]);

interface LeadSourcesChartProps {
  sx?: SxProps;
  data: LeadSourceData[];
  ref?: React.Ref<null | EChartsReactCore>;
}

const LeadSourcesChart = ({ sx, data, ref }: LeadSourcesChartProps) => {
  const { vars } = useTheme();
  const { getThemeColor } = useSettingsContext();

  const getOptions = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
        formatter: (params: CallbackDataParams[]) => tooltipFormatterList(params),
      },
      legend: {
        show: false,
      },
      color: [
        getThemeColor(vars.palette.chBlue[400]),
        getThemeColor(vars.palette.chOrange[400]),
        getThemeColor(vars.palette.chLightBlue[400]),
        getThemeColor(vars.palette.chGreen[400]),
      ],
      series: [
        {
          type: 'pie',
          radius: ['45%', '70%'],
          itemStyle: {
            borderRadius: 3,
          },
          padAngle: 2,
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: false,
            },
          },
          labelLine: {
            show: false,
          },
          data: data,
        },
      ],
      grid: { outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    }),
    [vars.palette, getThemeColor, data],
  );

  return <ReactEchart ref={ref} echarts={echarts} option={getOptions} sx={sx} />;
};

export default LeadSourcesChart;
