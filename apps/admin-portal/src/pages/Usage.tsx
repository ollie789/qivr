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
} from "@mui/material";

const usageData = [
  {
    tenant: "Sydney Physio Clinic",
    apiCalls: 45200,
    storage: 12.4,
    patients: 847,
    aiCalls: 234,
  },
  {
    tenant: "Melbourne Sports Medicine",
    apiCalls: 128400,
    storage: 45.2,
    patients: 2341,
    aiCalls: 892,
  },
  {
    tenant: "Brisbane Wellness Centre",
    apiCalls: 8900,
    storage: 2.1,
    patients: 156,
    aiCalls: 0,
  },
  {
    tenant: "Perth Chiropractic",
    apiCalls: 32100,
    storage: 8.7,
    patients: 503,
    aiCalls: 145,
  },
];

const totals = {
  apiCalls: usageData.reduce((sum, t) => sum + t.apiCalls, 0),
  storage: usageData.reduce((sum, t) => sum + t.storage, 0),
  patients: usageData.reduce((sum, t) => sum + t.patients, 0),
  aiCalls: usageData.reduce((sum, t) => sum + t.aiCalls, 0),
};

export default function Usage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Usage Analytics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Platform-wide resource consumption
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Total API Calls (30d)
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {(totals.apiCalls / 1000).toFixed(0)}K
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Total Storage
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {totals.storage.toFixed(1)} GB
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3 }}>
            <Typography color="text.secondary" variant="body2">
              Active Patients
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {totals.patients.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ p: 3 }}>
            <Typography color="text.secondary" variant="body2">
              AI Calls (30d)
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {totals.aiCalls.toLocaleString()}
            </Typography>
          </Card>
        </Grid>
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
                <TableCell>API Calls</TableCell>
                <TableCell>Storage</TableCell>
                <TableCell>Patients</TableCell>
                <TableCell>AI Calls</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {usageData.map((row) => (
                <TableRow key={row.tenant}>
                  <TableCell>{row.tenant}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={(row.apiCalls / 150000) * 100}
                        sx={{ flex: 1, height: 6, borderRadius: 3 }}
                      />
                      <Typography variant="body2" sx={{ minWidth: 60 }}>
                        {(row.apiCalls / 1000).toFixed(1)}K
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{row.storage.toFixed(1)} GB</TableCell>
                  <TableCell>{row.patients.toLocaleString()}</TableCell>
                  <TableCell>{row.aiCalls.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
