import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  CompareArrows,
  TrendingUp,
  TrendingDown,
  Lock,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { deviceOutcomesApi } from "../services/api";

const PROM_TYPES = [
  { value: "ODI", label: "Oswestry Disability Index (ODI)" },
  { value: "NDI", label: "Neck Disability Index (NDI)" },
  { value: "PHQ-9", label: "Patient Health Questionnaire (PHQ-9)" },
  { value: "GAD-7", label: "Generalized Anxiety Disorder (GAD-7)" },
  { value: "VAS", label: "Visual Analog Scale (VAS)" },
];

export default function Compare() {
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [selectedPromType, setSelectedPromType] = useState("ODI");

  const { data: devicesData } = useQuery({
    queryKey: ["devices-overview"],
    queryFn: () => deviceOutcomesApi.getDevicesWithOutcomes(),
  });

  const {
    data: comparison,
    isLoading: comparisonLoading,
    refetch: runComparison,
  } = useQuery({
    queryKey: ["device-comparison", selectedDevices, selectedPromType],
    queryFn: () =>
      deviceOutcomesApi.compareDevices(selectedDevices, selectedPromType),
    enabled: selectedDevices.length >= 2,
  });

  const devices = devicesData?.devices || [];
  const eligibleDevices = devices.filter((d) => d.hasSufficientData);

  const chartData =
    comparison?.comparisons
      .filter((c) => !c.supressedDueToPrivacy)
      .map((c) => ({
        name:
          c.deviceName.length > 20
            ? c.deviceName.substring(0, 17) + "..."
            : c.deviceName,
        fullName: c.deviceName,
        Baseline: c.baselineAverageScore,
        "Follow-up": c.followUpAverageScore,
        Improvement: c.percentImprovement,
      })) || [];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Device Comparison
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Compare outcome metrics across multiple devices
      </Typography>

      {/* Selection Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <FormControl sx={{ minWidth: 300 }}>
              <InputLabel>Select Devices to Compare</InputLabel>
              <Select
                multiple
                value={selectedDevices}
                onChange={(e) =>
                  setSelectedDevices(
                    typeof e.target.value === "string"
                      ? e.target.value.split(",")
                      : e.target.value,
                  )
                }
                input={<OutlinedInput label="Select Devices to Compare" />}
                renderValue={(selected) =>
                  `${selected.length} device${selected.length !== 1 ? "s" : ""} selected`
                }
              >
                {eligibleDevices.map((device) => (
                  <MenuItem key={device.deviceId} value={device.deviceId}>
                    <Checkbox
                      checked={selectedDevices.includes(device.deviceId)}
                    />
                    <ListItemText
                      primary={device.deviceName}
                      secondary={`${device.patientCount} patients`}
                    />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>PROM Type</InputLabel>
              <Select
                value={selectedPromType}
                onChange={(e) => setSelectedPromType(e.target.value)}
                label="PROM Type"
              >
                {PROM_TYPES.map((prom) => (
                  <MenuItem key={prom.value} value={prom.value}>
                    {prom.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              startIcon={<CompareArrows />}
              onClick={() => runComparison()}
              disabled={selectedDevices.length < 2 || comparisonLoading}
            >
              Compare
            </Button>
          </Box>

          {devices.length > eligibleDevices.length && (
            <Alert severity="info" sx={{ mt: 2 }}>
              {devices.length - eligibleDevices.length} device(s) hidden due to
              insufficient data (minimum 5 patients required)
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {selectedDevices.length < 2 ? (
        <Alert severity="info">
          Select at least 2 devices to compare their outcomes
        </Alert>
      ) : comparisonLoading ? (
        <Card>
          <CardContent sx={{ textAlign: "center", py: 6 }}>
            <Typography color="text.secondary">
              Loading comparison...
            </Typography>
          </CardContent>
        </Card>
      ) : !comparison || comparison.comparisons.length === 0 ? (
        <Alert severity="warning">
          No comparison data available for the selected devices
        </Alert>
      ) : (
        <>
          {/* Comparison Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                {selectedPromType} Score Comparison
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis type="number" stroke="#94a3b8" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#94a3b8"
                      width={150}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a2332",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      formatter={(value: number, name: string) => [
                        value.toFixed(1),
                        name,
                      ]}
                    />
                    <Legend />
                    <Bar
                      dataKey="Baseline"
                      fill="#0ea5e9"
                      radius={[0, 4, 4, 0]}
                    />
                    <Bar
                      dataKey="Follow-up"
                      fill="#10b981"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Improvement Chart */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Percent Improvement
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer>
                  <BarChart data={chartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.1)"
                    />
                    <XAxis dataKey="name" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" unit="%" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a2332",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                      }}
                      formatter={(value: number) => [
                        `${value.toFixed(1)}%`,
                        "Improvement",
                      ]}
                    />
                    <Bar
                      dataKey="Improvement"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          {/* Detailed Table */}
          <Paper sx={{ overflow: "hidden" }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell align="center">Patients</TableCell>
                  <TableCell align="center">Baseline Avg</TableCell>
                  <TableCell align="center">Follow-up Avg</TableCell>
                  <TableCell align="center">Improvement</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {comparison.comparisons.map((result) => (
                  <TableRow key={result.deviceId}>
                    <TableCell>
                      <Typography fontWeight={600}>
                        {result.deviceName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {result.deviceCode}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {result.supressedDueToPrivacy ? (
                        <Chip icon={<Lock />} label="<5" size="small" />
                      ) : (
                        result.patientCount
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {result.supressedDueToPrivacy
                        ? "-"
                        : result.baselineAverageScore.toFixed(1)}
                    </TableCell>
                    <TableCell align="center">
                      {result.supressedDueToPrivacy
                        ? "-"
                        : result.followUpAverageScore.toFixed(1)}
                    </TableCell>
                    <TableCell align="center">
                      {result.supressedDueToPrivacy ? (
                        <Chip label="Insufficient Data" size="small" />
                      ) : result.percentImprovement > 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "success.main",
                          }}
                        >
                          <TrendingUp fontSize="small" />
                          <Typography fontWeight={600} sx={{ ml: 0.5 }}>
                            {result.percentImprovement.toFixed(1)}%
                          </Typography>
                        </Box>
                      ) : result.percentImprovement < 0 ? (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "error.main",
                          }}
                        >
                          <TrendingDown fontSize="small" />
                          <Typography fontWeight={600} sx={{ ml: 0.5 }}>
                            {Math.abs(result.percentImprovement).toFixed(1)}%
                          </Typography>
                        </Box>
                      ) : (
                        <Typography color="text.secondary">0%</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </>
      )}
    </Box>
  );
}
