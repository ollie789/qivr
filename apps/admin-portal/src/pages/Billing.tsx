import {
  Box,
  Card,
  Typography,
  Grid,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
} from "@mui/material";
import {
  TrendingUp,
  CreditCard,
  Receipt,
  Business,
  Download,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { adminApi } from "../services/api";
import { exportTransactionsData } from "../services/export";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from "recharts";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b"];

export default function Billing() {
  const { enqueueSnackbar } = useSnackbar();

  const { data: overview, isLoading } = useQuery({
    queryKey: ["billing-overview"],
    queryFn: adminApi.getBillingOverview,
  });

  const { data: transactions, isLoading: loadingTx } = useQuery({
    queryKey: ["recent-transactions"],
    queryFn: () => adminApi.getRecentTransactions(15),
  });

  const cards = [
    {
      label: "Monthly Recurring Revenue",
      value: overview?.mrrFormatted ?? "$0",
      icon: <TrendingUp />,
      color: "#22c55e",
    },
    {
      label: "Annual Recurring Revenue",
      value: overview?.arrFormatted ?? "$0",
      icon: <CreditCard />,
      color: "#6366f1",
    },
    {
      label: "Active Tenants",
      value: overview?.activeTenants?.toString() ?? "0",
      icon: <Business />,
      color: "#f59e0b",
    },
    {
      label: "Total Tenants",
      value: overview?.totalTenants?.toString() ?? "0",
      icon: <Receipt />,
      color: "#ec4899",
    },
  ];

  const planChartData = (overview?.planBreakdown ?? []).map((p) => ({
    name: p.plan.charAt(0).toUpperCase() + p.plan.slice(1),
    value: p.revenue,
    count: p.count,
  }));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Billing
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Revenue and billing overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cards.map((stat) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.label}>
            <Card sx={{ p: 3 }}>
              {isLoading ? (
                <Skeleton variant="rectangular" height={60} />
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                </Box>
              )}
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Revenue by Plan
            </Typography>
            {isLoading ? (
              <Skeleton
                variant="circular"
                width={200}
                height={200}
                sx={{ mx: "auto", mt: 4 }}
              />
            ) : planChartData.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 320,
                  color: "text.secondary",
                }}
              >
                No plan data available
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={planChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: $${value}`}
                    outerRadius={100}
                    dataKey="value"
                  >
                    {planChartData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string, props: any) => [
                      `$${value} (${props.payload.count} tenants)`,
                      name,
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Card sx={{ p: 3, height: 400 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Plan Breakdown
            </Typography>
            {isLoading ? (
              <Skeleton variant="rectangular" height={300} />
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Plan</TableCell>
                      <TableCell align="right">Tenants</TableCell>
                      <TableCell align="right">Price</TableCell>
                      <TableCell align="right">MRR</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(overview?.planBreakdown ?? []).map((plan) => (
                      <TableRow key={plan.plan}>
                        <TableCell>
                          <Chip
                            label={
                              plan.plan.charAt(0).toUpperCase() +
                              plan.plan.slice(1)
                            }
                            size="small"
                            sx={{
                              bgcolor:
                                plan.plan === "enterprise"
                                  ? "#f59e0b20"
                                  : plan.plan === "professional"
                                    ? "#22c55e20"
                                    : "#6366f120",
                              color:
                                plan.plan === "enterprise"
                                  ? "#f59e0b"
                                  : plan.plan === "professional"
                                    ? "#22c55e"
                                    : "#6366f1",
                            }}
                          />
                        </TableCell>
                        <TableCell align="right">{plan.count}</TableCell>
                        <TableCell align="right">
                          $
                          {plan.plan === "starter"
                            ? 99
                            : plan.plan === "professional"
                              ? 299
                              : 599}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          ${plan.revenue}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={3} sx={{ fontWeight: 600 }}>
                        Total MRR
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={{ fontWeight: 700, color: "#22c55e" }}
                      >
                        {overview?.mrrFormatted ?? "$0"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ p: 3, mt: 3 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Recent Transactions
          </Typography>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => {
              exportTransactionsData(transactions?.transactions ?? []);
              enqueueSnackbar("Transactions exported to CSV", {
                variant: "success",
              });
            }}
            disabled={(transactions?.transactions ?? []).length === 0}
          >
            Export CSV
          </Button>
        </Box>
        {loadingTx ? (
          <Skeleton variant="rectangular" height={200} />
        ) : (transactions?.transactions ?? []).length === 0 ? (
          <Typography
            color="text.secondary"
            sx={{ py: 4, textAlign: "center" }}
          >
            No recent transactions. Connect Stripe to see payment history.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(transactions?.transactions ?? []).map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{formatDate(tx.created)}</TableCell>
                    <TableCell>
                      {tx.customerEmail || tx.customerId || "-"}
                    </TableCell>
                    <TableCell>{tx.description || "-"}</TableCell>
                    <TableCell align="right">
                      ${tx.amount.toFixed(2)} {tx.currency}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          tx.refunded
                            ? "Refunded"
                            : tx.paid
                              ? "Paid"
                              : tx.status
                        }
                        color={
                          tx.refunded
                            ? "warning"
                            : tx.paid
                              ? "success"
                              : "default"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
