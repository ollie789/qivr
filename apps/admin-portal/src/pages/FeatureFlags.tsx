import { useState } from "react";
import {
  Box,
  Card,
  Typography,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Autocomplete,
  TextField,
  Button,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../services/api";
import { useSnackbar } from "notistack";

const featureDefinitions = [
  {
    key: "aiTriage",
    name: "AI Triage",
    description: "AI-powered patient intake triage",
  },
  {
    key: "aiTreatmentPlans",
    name: "AI Treatment Plans",
    description: "Generate treatment plans with AI",
  },
  {
    key: "documentOcr",
    name: "Document OCR",
    description: "Extract text from uploaded documents",
  },
  {
    key: "smsReminders",
    name: "SMS Reminders",
    description: "Appointment reminders via SMS",
  },
  {
    key: "apiAccess",
    name: "API Access",
    description: "External API for integrations",
  },
  {
    key: "customBranding",
    name: "Custom Branding",
    description: "White-label with clinic branding",
  },
  {
    key: "hipaaAuditLogs",
    name: "HIPAA Audit Logs",
    description: "Detailed access logging for compliance",
  },
  {
    key: "researchPartnerDataSharing",
    name: "Research Partner Data Sharing",
    description: "Allow sharing de-identified data with research partners",
  },
];

const planDefaults: Record<string, Record<string, boolean>> = {
  starter: {
    aiTriage: false,
    aiTreatmentPlans: false,
    documentOcr: true,
    smsReminders: false,
    apiAccess: false,
    customBranding: false,
    hipaaAuditLogs: false,
    researchPartnerDataSharing: false,
  },
  professional: {
    aiTriage: true,
    aiTreatmentPlans: true,
    documentOcr: true,
    smsReminders: true,
    apiAccess: false,
    customBranding: false,
    hipaaAuditLogs: true,
    researchPartnerDataSharing: false,
  },
  enterprise: {
    aiTriage: true,
    aiTreatmentPlans: true,
    documentOcr: true,
    smsReminders: true,
    apiAccess: true,
    customBranding: true,
    hipaaAuditLogs: true,
    researchPartnerDataSharing: true,
  },
};

interface Tenant {
  id: string;
  name: string;
  planTier: string;
  featureFlags: Record<string, boolean>;
}

export default function FeatureFlags() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [editedFlags, setEditedFlags] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const { data: tenants } = useQuery({
    queryKey: ["tenants-list"],
    queryFn: () => adminApi.getTenants(),
  });

  const { data: tenantDetail, isLoading: loadingDetail } = useQuery({
    queryKey: ["tenant", selectedTenant?.id],
    queryFn: () => adminApi.getTenant(selectedTenant!.id),
    enabled: !!selectedTenant?.id,
  });

  const updateFlagsMutation = useMutation({
    mutationFn: (flags: Record<string, boolean>) =>
      adminApi.updateFeatureFlags(selectedTenant!.id, flags),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tenant", selectedTenant?.id],
      });
      setHasChanges(false);
      enqueueSnackbar("Feature flags updated", { variant: "success" });
    },
    onError: () => {
      enqueueSnackbar("Failed to update flags", { variant: "error" });
    },
  });

  const handleTenantSelect = (_: unknown, tenant: Tenant | null) => {
    setSelectedTenant(tenant);
    setHasChanges(false);
    if (tenant) {
      setEditedFlags({});
    }
  };

  const handleFlagChange = (key: string, value: boolean) => {
    setEditedFlags((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const getCurrentFlags = () => {
    if (!tenantDetail) return {};
    return { ...tenantDetail.featureFlags, ...editedFlags };
  };

  const handleSave = () => {
    updateFlagsMutation.mutate(getCurrentFlags());
  };

  const handleReset = () => {
    setEditedFlags({});
    setHasChanges(false);
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Feature Flags
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Manage feature access per tenant or view plan defaults
      </Typography>

      {/* Tenant Selector */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Select Tenant
        </Typography>
        <Autocomplete
          options={(tenants as Tenant[]) || []}
          getOptionLabel={(t) => `${t.name} (${t.planTier})`}
          value={selectedTenant}
          onChange={handleTenantSelect}
          renderInput={(params) => (
            <TextField {...params} placeholder="Search tenants..." />
          )}
          sx={{ maxWidth: 400 }}
        />
      </Card>

      {/* Tenant Feature Flags Editor */}
      {selectedTenant && (
        <Card sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {selectedTenant.name}
              </Typography>
              <Chip
                label={selectedTenant.planTier}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                onClick={handleReset}
                disabled={!hasChanges}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!hasChanges || updateFlagsMutation.isPending}
              >
                {updateFlagsMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </Box>
          </Box>

          {loadingDetail ? (
            <Typography color="text.secondary">Loading...</Typography>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Feature</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Plan Default</TableCell>
                    <TableCell align="center">Enabled</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {featureDefinitions.map((f) => {
                    const planDefault =
                      planDefaults[selectedTenant.planTier]?.[f.key] ?? false;
                    const currentValue =
                      getCurrentFlags()[f.key] ?? planDefault;
                    const isOverridden =
                      editedFlags[f.key] !== undefined ||
                      (tenantDetail?.featureFlags[f.key] !== undefined &&
                        tenantDetail.featureFlags[f.key] !== planDefault);

                    return (
                      <TableRow key={f.key}>
                        <TableCell>
                          <Typography fontWeight={500}>{f.name}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {f.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={planDefault ? "Yes" : "No"}
                            size="small"
                            color={planDefault ? "success" : "default"}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Switch
                            checked={currentValue}
                            onChange={(e) =>
                              handleFlagChange(f.key, e.target.checked)
                            }
                          />
                          {isOverridden && (
                            <Chip
                              label="Override"
                              size="small"
                              color="warning"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Card>
      )}

      {/* Plan Defaults Reference */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Plan Defaults Reference
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Default features included with each plan tier
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Feature</TableCell>
                <TableCell align="center">
                  <Chip
                    label="Starter"
                    size="small"
                    sx={{ bgcolor: "#64748b", color: "white" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label="Professional"
                    size="small"
                    sx={{ bgcolor: "#6366f1", color: "white" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label="Enterprise"
                    size="small"
                    sx={{ bgcolor: "#ec4899", color: "white" }}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {featureDefinitions.map((f) => (
                <TableRow key={f.key}>
                  <TableCell>{f.name}</TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={planDefaults.starter[f.key]}
                      disabled
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={planDefaults.professional[f.key]}
                      disabled
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={planDefaults.enterprise[f.key]}
                      disabled
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
}
