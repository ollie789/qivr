import { useMemo } from 'react';
import { SxProps, useTheme } from '@mui/material/styles';
import EChartsReactCore from 'echarts-for-react/lib/core';
import { PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { useSettingsContext } from 'providers/SettingsProvider';
import { AnalyticsData } from 'types/crm-deal-details';
import ReactEchart from 'components/base/ReactEchart';

echarts.use([TooltipComponent, GridComponent, PieChart, CanvasRenderer, LegendComponent]);
interface AnalyticsChartProps {
  sx?: SxProps;
  data: AnalyticsData[];
  ref?: React.Ref<null | EChartsReactCore>;
}

const AnalyticsChart = ({ sx, data, ref }: AnalyticsChartProps) => {
  const { vars } = useTheme();
  const { getThemeColor } = useSettingsContext();

  const getOptions = useMemo(
    () => ({
      tooltip: {
        trigger: 'item',
      },
      legend: {
        show: false,
      },
      color: [
        getThemeColor(vars.palette.warning.light),
        getThemeColor(vars.palette.info.light),
        getThemeColor(vars.palette.primary.light),
        getThemeColor(vars.palette.success.light),
      ],
      series: [
        {
          name: 'Analytics',
          type: 'pie',
          radius: ['55%', '90%'],
          itemStyle: {
            borderRadius: 0,
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
    [vars.palette, data, getThemeColor],
  );

  return <ReactEchart ref={ref} echarts={echarts} option={getOptions} sx={sx} />;
};

export default AnalyticsChart;
