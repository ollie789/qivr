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
} from "@mui/material";
import { ArrowBack, Edit, CreditCard } from "@mui/icons-material";
import { useState } from "react";

export default function TenantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // Mock data - replace with API
  const tenant = {
    id,
    name: "Sydney Physio Clinic",
    slug: "sydney-physio",
    status: "active",
    planTier: "professional",
    createdAt: "2024-06-15",
    contactEmail: "admin@sydneyphysio.com.au",
    contactName: "Dr. Sarah Chen",
    billingCustomerId: "cus_abc123",
    featureFlags: {
      aiTriage: true,
      aiTreatmentPlans: true,
      documentOcr: true,
      smsReminders: true,
      apiAccess: false,
      customBranding: false,
      hipaaAuditLogs: true,
    },
    usage: { practitioners: 6, patients: 847, storageGb: 12.4, aiCalls: 234 },
    limits: {
      maxPractitioners: 10,
      maxPatients: 2000,
      maxStorageGb: 50,
      maxAiCallsPerMonth: 1000,
    },
  };

  const usagePercent = (current: number, max: number) =>
    Math.min((current / max) * 100, 100);

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
            <Chip label={tenant.status} color="success" size="small" />
            <Chip
              label={tenant.planTier}
              size="small"
              sx={{ bgcolor: "#6366f1", color: "white" }}
            />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" startIcon={<CreditCard />}>
            Billing Portal
          </Button>
          <Button variant="contained" startIcon={<Edit />}>
            Edit
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
                    Contact
                  </Typography>
                  <Typography>{tenant.contactName}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Email
                  </Typography>
                  <Typography>{tenant.contactEmail}</Typography>
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
                    Stripe ID
                  </Typography>
                  <Typography>{tenant.billingCustomerId}</Typography>
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
                  label: "Practitioners",
                  current: tenant.usage.practitioners,
                  max: tenant.limits.maxPractitioners,
                },
                {
                  label: "Patients",
                  current: tenant.usage.patients,
                  max: tenant.limits.maxPatients,
                },
                {
                  label: "Storage (GB)",
                  current: tenant.usage.storageGb,
                  max: tenant.limits.maxStorageGb,
                },
                {
                  label: "AI Calls",
                  current: tenant.usage.aiCalls,
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
            {Object.entries(tenant.featureFlags).map(([key, value]) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                <FormControlLabel
                  control={<Switch checked={value} />}
                  label={key
                    .replace(/([A-Z])/g, " $1")
                    .replace(/^./, (s) => s.toUpperCase())}
                />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 3 }} />
          <Button variant="contained">Save Changes</Button>
        </Card>
      )}

      {tab === 2 && (
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Usage Analytics
          </Typography>
          <Box
            sx={{
              height: 300,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "text.secondary",
            }}
          >
            Usage charts - integrate with API data
          </Box>
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
              <Chip label="Professional - $299/mo" color="primary" />
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Next Invoice</Typography>
              <Typography>Dec 15, 2024 - $299.00</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography>Payment Method</Typography>
              <Typography>Visa •••• 4242</Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
            <Button variant="outlined">View Invoices</Button>
            <Button variant="outlined">Change Plan</Button>
          </Box>
        </Card>
      )}
    </Box>
  );
}
