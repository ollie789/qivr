import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  Grid,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  CreditCard,
  Block,
  CheckCircle,
} from "@mui/icons-material";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/api";
import { useSnackbar } from "notistack";

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [tab, setTab] = useState(0);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [newPlan, setNewPlan] = useState("");
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});
  const [flagsChanged, setFlagsChanged] = useState(false);

  const {
    data: tenant,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => adminApi.getTenant(id!),
    enabled: !!id,
  });

  // Initialize feature flags when tenant loads
  if (tenant && Object.keys(featureFlags).length === 0) {
    setFeatureFlags(tenant.featureFlags);
  }

  const suspendMutation = useMutation({
    mutationFn: () => adminApi.suspendTenant(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
      enqueueSnackbar("Tenant suspended", { variant: "success" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => adminApi.activateTenant(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
      enqueueSnackbar("Tenant activated", { variant: "success" });
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: (plan: string) => adminApi.updatePlan(id!, plan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
      setShowPlanDialog(false);
      enqueueSnackbar("Plan updated", { variant: "success" });
    },
  });

  const updateFlagsMutation = useMutation({
    mutationFn: (flags: Record<string, boolean>) =>
      adminApi.updateFeatureFlags(id!, flags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
      setFlagsChanged(false);
      enqueueSnackbar("Feature flags updated", { variant: "success" });
    },
  });

  const handleFlagChange = (key: string, value: boolean) => {
    setFeatureFlags((prev) => ({ ...prev, [key]: value }));
    setFlagsChanged(true);
  };

  const usagePercent = (current: number, max: number) =>
    Math.min((current / max) * 100, 100);

  if (isLoading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }

  if (error || !tenant) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/tenants")}
          sx={{ mb: 2 }}
        >
          Back to Tenants
        </Button>
        <Alert severity="error">
          Failed to load tenant details. The tenant may not exist.
        </Alert>
      </Box>
    );
  }

  const planPrices: Record<string, number> = {
    starter: 99,
    professional: 299,
    enterprise: 599,
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate("/tenants")}
        sx={{ mb: 2 }}
      >
        Back to Tenants
      </Button>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            {tenant.name}
          </Typography>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Chip
              label={tenant.status}
              color={tenant.status === "active" ? "success" : "warning"}
              size="small"
            />
            <Chip
              label={tenant.planTier}
              size="small"
              sx={{ bgcolor: "#6366f1", color: "white" }}
            />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {tenant.status === "active" ? (
            <Button
              variant="outlined"
              color="warning"
              startIcon={<Block />}
              onClick={() => suspendMutation.mutate()}
              disabled={suspendMutation.isPending}
            >
              Suspend
            </Button>
          ) : (
            <Button
              variant="outlined"
              color="success"
              startIcon={<CheckCircle />}
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              Activate
            </Button>
          )}
          <Button variant="outlined" startIcon={<CreditCard />}>
            Billing Portal
          </Button>
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={() => {
              setNewPlan(tenant.planTier);
              setShowPlanDialog(true);
            }}
          >
            Change Plan
          </Button>
        </Box>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label="Overview" />
        <Tab label="Feature Flags" />
        <Tab label="Usage" />
        <Tab label="Billing" />
      </Tabs>

      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Details
              </Typography>
              <Box
                sx={{
                  "& > div": {
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: "divider",
                  },
                }}
              >
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Slug
                  </Typography>
                  <Typography>{tenant.slug}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography>{tenant.contactEmail || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Phone
                  </Typography>
                  <Typography>{tenant.phone || "-"}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Location
                  </Typography>
                  <Typography>
                    {[tenant.city, tenant.state, tenant.country]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Created
                  </Typography>
                  <Typography>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                <Box sx={{ border: "none !important" }}>
                  <Typography variant="caption" color="text.secondary">
                    Timezone
                  </Typography>
                  <Typography>{tenant.timezone || "UTC"}</Typography>
                </Box>
              </Box>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Usage Summary
              </Typography>
              {[
                {
                  label: "Staff",
                  current: tenant.usage.staff,
                  max: tenant.limits.maxStaff,
                },
                {
                  label: "Patients",
                  current: tenant.usage.patients,
                  max: tenant.limits.maxPatients,
                },
                {
                  label: "Storage (GB)",
                  current: 0, // TODO: Add storage tracking
                  max: tenant.limits.maxStorageGb,
                },
                {
                  label: "AI Calls/Month",
                  current: 0, // TODO: Add AI call tracking
                  max: tenant.limits.maxAiCallsPerMonth,
                },
              ].map((item) => (
                <Box key={item.label} sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 0.5,
                    }}
                  >
                    <Typography variant="body2">{item.label}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.current} / {item.max}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={usagePercent(item.current, item.max)}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              ))}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2">Appointments this month</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {tenant.usage.appointmentsThisMonth}
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}

      {tab === 1 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Feature Flags
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Toggle features for this tenant
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(featureFlags).map(([key, value]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={value}
                      onChange={(e) => handleFlagChange(key, e.target.checked)}
                    />
                  }
                  label={key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Button
            variant="contained"
            disabled={!flagsChanged || updateFlagsMutation.isPending}
            onClick={() => updateFlagsMutation.mutate(featureFlags)}
          >
            {updateFlagsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </Card>
      )}

      {tab === 2 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Usage Analytics
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography color="text.secondary" variant="body2">
                Total Patients
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {tenant.usage.patients}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography color="text.secondary" variant="body2">
                Staff Members
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {tenant.usage.staff}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography color="text.secondary" variant="body2">
                Appointments (30 days)
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {tenant.usage.appointmentsThisMonth}
              </Typography>
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <Typography color="text.secondary" variant="body2">
                Plan Tier
              </Typography>
              <Typography variant="h4" fontWeight={700}>
                {tenant.planTier}
              </Typography>
            </Grid>
          </Grid>
        </Card>
      )}

      {tab === 3 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Billing
          </Typography>
          <Box
            sx={{
              "& > div": { py: 2, borderBottom: 1, borderColor: "divider" },
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Current Plan</Typography>
              <Chip
                label={`${tenant.planTier.charAt(0).toUpperCase() + tenant.planTier.slice(1)} - $${planPrices[tenant.planTier] || 0}/mo`}
                color="primary"
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Status</Typography>
              <Chip
                label={tenant.status}
                color={tenant.status === "active" ? "success" : "warning"}
                size="small"
              />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Customer Since</Typography>
              <Typography>
                {new Date(tenant.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button variant="outlined">View Invoices</Button>
            <Button
              variant="outlined"
              onClick={() => {
                setNewPlan(tenant.planTier);
                setShowPlanDialog(true);
              }}
            >
              Change Plan
            </Button>
          </Box>
        </Card>
      )}

      {/* Change Plan Dialog */}
      <Dialog open={showPlanDialog} onClose={() => setShowPlanDialog(false)}>
        <DialogTitle>Change Plan</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Plan</InputLabel>
            <Select
              value={newPlan}
              label="Plan"
              onChange={(e) => setNewPlan(e.target.value)}
            >
              <MenuItem value="starter">Starter ($99/mo)</MenuItem>
              <MenuItem value="professional">Professional ($299/mo)</MenuItem>
              <MenuItem value="enterprise">Enterprise ($599/mo)</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPlanDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => updatePlanMutation.mutate(newPlan)}
            disabled={updatePlanMutation.isPending}
          >
            Update Plan
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
