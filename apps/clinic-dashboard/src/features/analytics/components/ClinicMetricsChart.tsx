import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  ButtonBase,
  Stack,
  Tab,
  Tabs,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Line,
  LineChart,
} from "recharts";
import {
  auraTokens,
  auraColors,
  glassTokens,
  AuraChartCard,
} from "@qivr/design-system";

interface MetricTab {
  key: string;
  title: string;
  value: string | number;
  format?: "number" | "currency" | "percent";
}

interface ChartDataPoint {
  name: string;
  actual: number;
  projected?: number;
  previous?: number;
}

interface ClinicMetricsChartProps {
  tabs: MetricTab[];
  data: Record<string, ChartDataPoint[]>;
  height?: number;
  chartType?: "area" | "bar" | "line";
}

const LegendButton: React.FC<{
  label: string;
  color: string;
  active: boolean;
  onClick: () => void;
  dashed?: boolean;
}> = ({ label, color, active, onClick, dashed }) => (
  <ButtonBase
    disableRipple
    onClick={onClick}
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1,
      px: 1.5,
      py: 0.5,
      borderRadius: auraTokens.borderRadius.sm,
      opacity: active ? 1 : 0.4,
      transition: auraTokens.transitions.default,
      "&:hover": {
        bgcolor: "action.hover",
      },
    }}
  >
    {dashed ? (
      <Stack direction="row" gap={0.25}>
        {[0, 1].map((i) => (
          <Box
            key={i}
            sx={{
              width: 6,
              height: 3,
              bgcolor: color,
              borderRadius: 1,
              flexShrink: 0,
            }}
          />
        ))}
      </Stack>
    ) : (
      <Box
        sx={{
          width: 16,
          height: 4,
          bgcolor: color,
          borderRadius: 2,
          flexShrink: 0,
        }}
      />
    )}
    <Typography variant="caption" fontWeight={600} color="text.secondary">
      {label}
    </Typography>
  </ButtonBase>
);

const formatValue = (
  value: number | string,
  format?: "number" | "currency" | "percent",
): string => {
  if (typeof value === "string") return value;
  switch (format) {
    case "currency":
      return `$${value.toLocaleString()}`;
    case "percent":
      return `${value}%`;
    default:
      return value.toLocaleString();
  }
};

const ClinicMetricsChart: React.FC<ClinicMetricsChartProps> = ({
  tabs,
  data,
  height = 300,
  chartType = "area",
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [showActual, setShowActual] = useState(true);
  const [showProjected, setShowProjected] = useState(true);

  const currentTab = tabs[activeTab];
  const chartData = currentTab?.key ? data[currentTab.key] || [] : [];

  const gradientId = useMemo(
    () => `gradient-${currentTab?.key || "default"}`,
    [currentTab?.key],
  );

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 10, left: -10, bottom: 0 },
    };

    const commonAxisProps = {
      axisLine: false,
      tickLine: false,
      tick: { fontSize: 12, fill: theme.palette.text.secondary },
    };

    const tooltipStyle = {
      backgroundColor: theme.palette.background.paper,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 12,
      boxShadow: glassTokens.shadow.standard,
    };

    if (chartType === "bar") {
      return (
        <BarChart {...commonProps}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={theme.palette.divider}
          />
          <XAxis dataKey="name" {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          {showActual && (
            <Bar
              dataKey="actual"
              fill={auraColors.blue.main}
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
          )}
          {showProjected && chartData[0]?.projected !== undefined && (
            <Bar
              dataKey="projected"
              fill={alpha(auraColors.green.main, 0.6)}
              radius={[4, 4, 0, 0]}
              animationDuration={500}
            />
          )}
        </BarChart>
      );
    }

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={theme.palette.divider}
          />
          <XAxis dataKey="name" {...commonAxisProps} />
          <YAxis {...commonAxisProps} />
          <Tooltip contentStyle={tooltipStyle} />
          {showActual && (
            <Line
              type="monotone"
              dataKey="actual"
              stroke={auraColors.blue.main}
              strokeWidth={2}
              dot={{ fill: auraColors.blue.main, strokeWidth: 2, r: 4 }}
              animationDuration={500}
            />
          )}
          {showProjected && chartData[0]?.projected !== undefined && (
            <Line
              type="monotone"
              dataKey="projected"
              stroke={auraColors.green.main}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              animationDuration={500}
            />
          )}
        </LineChart>
      );
    }

    // Default: area chart
    return (
      <AreaChart {...commonProps}>
        <defs>
          <linearGradient
            id={`${gradientId}-actual`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="5%"
              stopColor={auraColors.blue.main}
              stopOpacity={0.3}
            />
            <stop
              offset="95%"
              stopColor={auraColors.blue.main}
              stopOpacity={0}
            />
          </linearGradient>
          <linearGradient
            id={`${gradientId}-projected`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="5%"
              stopColor={auraColors.green.main}
              stopOpacity={0.2}
            />
            <stop
              offset="95%"
              stopColor={auraColors.green.main}
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke={theme.palette.divider}
        />
        <XAxis dataKey="name" {...commonAxisProps} />
        <YAxis {...commonAxisProps} />
        <Tooltip contentStyle={tooltipStyle} />
        {showActual && (
          <Area
            type="monotone"
            dataKey="actual"
            stroke={auraColors.blue.main}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId}-actual)`}
            animationDuration={500}
          />
        )}
        {showProjected && chartData[0]?.projected !== undefined && (
          <Area
            type="monotone"
            dataKey="projected"
            stroke={auraColors.green.main}
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill={`url(#${gradientId}-projected)`}
            animationDuration={500}
          />
        )}
      </AreaChart>
    );
  };

  const tabsHeader = (
    <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2, mx: -3, px: 3 }}>
      <Tabs
        value={activeTab}
        onChange={(_, val) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0" },
        }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.key}
            sx={{
              alignItems: "flex-start",
              textAlign: "left",
              px: 0,
              py: 1.5,
              mr: 4,
              minWidth: "auto",
            }}
            label={
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.5 }}
                >
                  {tab.title}
                </Typography>
                <Typography
                  variant="h5"
                  fontWeight={600}
                  color={
                    activeTab === index ? "text.primary" : "text.secondary"
                  }
                >
                  {formatValue(tab.value, tab.format)}
                </Typography>
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  );

  return (
    <AuraChartCard
      title=""
      sx={{ "& > div:first-of-type": { display: "none" } }}
    >
      {tabsHeader}
      <Stack
        direction="row"
        spacing={1}
        justifyContent="flex-end"
        sx={{ mb: 2 }}
      >
        <LegendButton
          label="Actual"
          color={auraColors.blue.main}
          active={showActual}
          onClick={() => setShowActual(!showActual)}
        />
        {chartData[0]?.projected !== undefined && (
          <LegendButton
            label="Projected"
            color={auraColors.green.main}
            active={showProjected}
            onClick={() => setShowProjected(!showProjected)}
            dashed
          />
        )}
      </Stack>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </AuraChartCard>
  );
};

export default ClinicMetricsChart;
