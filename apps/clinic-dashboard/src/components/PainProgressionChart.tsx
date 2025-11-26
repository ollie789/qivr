import React from "react";
import { Box, Typography, Paper, Grid, Alert } from "@mui/material";
import { TrendingDown as TrendingDownIcon } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { LineChart } from "@mui/x-charts/LineChart";
import { PainMap3DViewer } from "@qivr/design-system";
import apiClient from "../lib/api-client";

interface PainProgressionChartProps {
  patientId: string;
}

export const PainProgressionChart: React.FC<PainProgressionChartProps> = ({
  patientId,
}) => {
  const { data: progression, isLoading } = useQuery({
    queryKey: ["pain-progression", patientId],
    queryFn: async () => {
      const response = await apiClient.get(
        `/api/patients/${patientId}/pain-progression`
      );
      return response.data;
    },
  });

  if (isLoading) {
    return <Typography>Loading pain progression...</Typography>;
  }

  if (!progression) {
    return (
      <Alert severity="info">
        No pain progression data available yet.
      </Alert>
    );
  }

  const improvement =
    progression.baseline && progression.current
      ? Math.round(
          ((progression.baseline.intensity - progression.current.intensity) /
            progression.baseline.intensity) *
            100
        )
      : 0;

  return (
    <Box>
      {/* Side-by-side pain maps */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Baseline
            </Typography>
            {progression.baseline && (
              <>
                <PainMap3DViewer
                  regions={
                    progression.baseline.drawingDataJson
                      ? JSON.parse(progression.baseline.drawingDataJson)
                      : []
                  }
                  width={300}
                  height={400}
                />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Pain: {progression.baseline.intensity}/10
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(progression.baseline.createdAt).toLocaleDateString()}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Current
            </Typography>
            {progression.current && (
              <>
                <PainMap3DViewer
                  regions={
                    progression.current.drawingDataJson
                      ? JSON.parse(progression.current.drawingDataJson)
                      : []
                  }
                  width={300}
                  height={400}
                />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Pain: {progression.current.intensity}/10
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(progression.current.createdAt).toLocaleDateString()}
                </Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Improvement alert */}
      {improvement > 0 && (
        <Alert severity="success" icon={<TrendingDownIcon />} sx={{ mb: 3 }}>
          {improvement}% improvement from baseline
        </Alert>
      )}

      {/* Trend graph */}
      {progression.history && progression.history.length > 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Pain Level Over Time
          </Typography>
          <LineChart
            xAxis={[
              {
                data: progression.history.map((_: any, i: number) => i),
                scaleType: "point",
                valueFormatter: (value: number) => {
                  const date = new Date(progression.history[value].date);
                  return date.toLocaleDateString();
                },
              },
            ]}
            series={[
              {
                data: progression.history.map((h: any) => h.painLevel),
                label: "Pain Level",
                color: "#667eea",
              },
            ]}
            height={300}
          />
        </Paper>
      )}
    </Box>
  );
};
