import {
  Box,
  Card,
  Typography,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { TrendingUp, CreditCard, Receipt, Warning } from "@mui/icons-material";

const stats = [
  { label: "MRR", value: "$4,850", icon: <TrendingUp />, color: "#22c55e" },
  {
    label: "Active Subscriptions",
    value: "21",
    icon: <CreditCard />,
    color: "#6366f1",
  },
  {
    label: "Pending Invoices",
    value: "3",
    icon: <Receipt />,
    color: "#f59e0b",
  },
  { label: "Failed Payments", value: "1", icon: <Warning />, color: "#ef4444" },
];

const recentInvoices = [
  {
    tenant: "Sydney Physio Clinic",
    amount: "$299",
    status: "paid",
    date: "2024-11-15",
  },
  {
    tenant: "Melbourne Sports Medicine",
    amount: "$599",
    status: "paid",
    date: "2024-11-15",
  },
  {
    tenant: "Brisbane Wellness Centre",
    amount: "$99",
    status: "pending",
    date: "2024-11-20",
  },
  {
    tenant: "Perth Chiropractic",
    amount: "$299",
    status: "failed",
    date: "2024-11-10",
  },
];

export default function Billing() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Billing
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Revenue and payment management
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ p: 3, display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: `${stat.color}20`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </Box>
              <Box>
                <Typography color="text.secondary" variant="body2">
                  {stat.label}
                </Typography>
                <Typography variant="h5" fontWeight={700}>
                  {stat.value}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" fontWeight={600}>
            Recent Invoices
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Tenant</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentInvoices.map((inv, i) => (
                <TableRow key={i}>
                  <TableCell>{inv.tenant}</TableCell>
                  <TableCell>{inv.amount}</TableCell>
                  <TableCell>
                    <Chip
                      label={inv.status}
                      size="small"
                      color={
                        inv.status === "paid"
                          ? "success"
                          : inv.status === "pending"
                            ? "warning"
                            : "error"
                      }
                    />
                  </TableCell>
                  <TableCell>{inv.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
