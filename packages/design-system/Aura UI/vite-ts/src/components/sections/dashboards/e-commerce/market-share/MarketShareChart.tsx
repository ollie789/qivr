import { useMemo } from 'react';
import { SxProps } from '@mui/material';
import { Share } from 'data/e-commerce/marketShare';
import { PieChart } from 'echarts/charts';
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components';
import * as echarts from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { CallbackDataParams } from 'echarts/types/dist/shared';
import { tooltipFormatterList } from 'helpers/echart-utils';
import { useSettingsContext } from 'providers/SettingsProvider';
import ReactEchart from 'components/base/ReactEchart';

echarts.use([TooltipComponent, PieChart, CanvasRenderer, GridComponent, LegendComponent]);

interface MarketShareChartProps {
  data: Share[];
  bgColorMap: { [key: string]: string };
  sx: SxProps;
}

const MarketShareChart = ({ data, bgColorMap, sx }: MarketShareChartProps) => {
  const { getThemeColor } = useSettingsContext();

  const getOptions = useMemo(
    () => ({
      color: Object.values(bgColorMap).map((i) => getThemeColor(i)),
      tooltip: {
        trigger: 'item',
        formatter: (params: CallbackDataParams[]) => tooltipFormatterList(params),
      },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          padAngle: 2,
          radius: ['100%', '94%'],
          avoidLabelOverlap: false,
          emphasis: {
            scale: false,
            itemStyle: {
              color: 'inherit',
            },
          },
          itemStyle: {
            borderColor: 'transparent',
          },
          label: {
            show: false,
          },
          data: data.map((share) => ({ name: share.brand, value: share.revenue })),
        },
      ],
      grid: { outerBoundsMode: 'same', outerBoundsContain: 'axisLabel' },
    }),
    [data, bgColorMap, getThemeColor],
  );

  return <ReactEchart echarts={echarts} option={getOptions} sx={sx} />;
};

export default MarketShareChart;
