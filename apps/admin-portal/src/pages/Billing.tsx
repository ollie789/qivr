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
  Skeleton,
} from "@mui/material";
import { TrendingUp, CreditCard, Receipt, Warning } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "../services/api";

export default function Billing() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: adminApi.getBillingOverview,
  });

  const { data: invoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: adminApi.getInvoices,
  });

  const stats = [
    {
      label: "MRR",
      value: overview?.mrrFormatted ?? "$0",
      icon: <TrendingUp />,
      color: "#22c55e",
    },
    {
      label: "Active Subscriptions",
      value: overview?.activeSubscriptions ?? 0,
      icon: <CreditCard />,
      color: "#6366f1",
    },
    {
      label: "Trial Tenants",
      value: overview?.trialTenants ?? 0,
      icon: <Receipt />,
      color: "#f59e0b",
    },
    {
      label: "Suspended",
      value: overview?.suspendedTenants ?? 0,
      icon: <Warning />,
      color: "#ef4444",
    },
  ];

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
                {isLoading ? (
                  <Skeleton width={60} />
                ) : (
                  <Typography variant="h5" fontWeight={700}>
                    {stat.value}
                  </Typography>
                )}
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
              {invoices?.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.tenantName}</TableCell>
                  <TableCell>${inv.amount}</TableCell>
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
