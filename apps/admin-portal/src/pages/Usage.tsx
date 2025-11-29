import {
  Box,
  Card,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Skeleton,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export default function Usage() {
  const { data: totals, isLoading: loadingTotals } = useQuery({
    queryKey: ["usage-totals"],
    queryFn: adminApi.getUsageTotals,
  });

  const { data: usage, isLoading } = useQuery({
    queryKey: ["usage"],
    queryFn: () => adminApi.getAllUsage(),
  });

  const maxPatients = Math.max(
    ...(usage?.map((u: any) => u.activePatients) || [1]),
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Usage Analytics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform-wide resource consumption
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Total Patients", value: totals?.totalPatients },
          { label: "Total Practitioners", value: totals?.totalPractitioners },
          {
            label: "Appointments (Month)",
            value: totals?.appointmentsThisMonth,
          },
          { label: "Messages (Month)", value: totals?.messagesThisMonth },
        ].map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ p: 3 }}>
              <Typography color="text.secondary" variant="body2">
                {stat.label}
              </Typography>
              {loadingTotals ? (
                <Skeleton width={80} height={40} />
              ) : (
                <Typography variant="h4" fontWeight={700}>
                  {stat.value?.toLocaleString() || 0}
                </Typography>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={600}>
            Usage by Tenant
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Patients</TableCell>
                <TableCell>Practitioners</TableCell>
                <TableCell>Appointments</TableCell>
                <TableCell>Messages</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading
                ? [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      {[...Array(6)].map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : usage?.map((row: any) => (
                    <TableRow key={row.tenantId}>
                      <TableCell>{row.tenantName}</TableCell>
                      <TableCell sx={{ textTransform: "capitalize" }}>
                        {row.plan}
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={(row.activePatients / maxPatients) * 100}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="body2" sx={{ minWidth: 40 }}>
                            {row.activePatients}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{row.practitioners}</TableCell>
                      <TableCell>{row.appointments}</TableCell>
                      <TableCell>{row.messages}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
