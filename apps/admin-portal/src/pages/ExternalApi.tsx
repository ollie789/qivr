import {
  Box,
  Card,
  Typography,
  Grid,
  Skeleton,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Tooltip,
} from "@mui/material";
import {
  Key,
  Add,
  ContentCopy,
  Refresh,
  CheckCircle,
  Block,
  Code,
  PlayArrow,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  externalApiService,
  adminApi,
  ExternalApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
} from "../services/api";
import { useState } from "react";

export default function ExternalApi() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState(0);
  const [showRevoked, setShowRevoked] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<CreateApiKeyResponse | null>(
    null,
  );
  const [copied, setCopied] = useState(false);
  const [createForm, setCreateForm] = useState<CreateApiKeyRequest>({
    name: "",
    tenantId: "",
    description: "",
    partnerName: "",
    contactEmail: "",
    scopes: ["read"],
    rateLimitPerHour: 1000,
  });

  // Load API keys
  const { data: keysData, isLoading: loadingKeys } = useQuery({
    queryKey: ["api-keys", showRevoked],
    queryFn: () => externalApiService.getApiKeys(undefined, showRevoked),
  });

  // Load tenants for dropdown
  const { data: tenants } = useQuery({
    queryKey: ["tenants-list"],
    queryFn: adminApi.getTenants,
  });

  // Load API docs
  const { data: apiDocs, isLoading: loadingDocs } = useQuery({
    queryKey: ["api-docs"],
    queryFn: externalApiService.getDocs,
  });

  // Load usage stats
  const { data: usageStats } = useQuery({
    queryKey: ["api-usage"],
    queryFn: () => externalApiService.getUsageStats(),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: externalApiService.createApiKey,
    onSuccess: (data) => {
      setNewKeyResult(data);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) => externalApiService.revokeApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => externalApiService.activateApiKey(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["api-keys"] }),
  });

  const regenerateMutation = useMutation({
    mutationFn: (id: string) => externalApiService.regenerateApiKey(id),
    onSuccess: (data) => {
      setNewKeyResult(data);
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const handleCreate = () => {
    createMutation.mutate(createForm);
  };

  const handleCopyKey = () => {
    if (newKeyResult?.apiKey) {
      navigator.clipboard.writeText(newKeyResult.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseNewKey = () => {
    setNewKeyResult(null);
    setCreateOpen(false);
    setCreateForm({
      name: "",
      tenantId: "",
      description: "",
      partnerName: "",
      contactEmail: "",
      scopes: ["read"],
      rateLimitPerHour: 1000,
    });
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            External API
          </Typography>
          <Typography color="text.secondary">
            Manage API keys for partners to access clinic performance data
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
        >
          Create API Key
        </Button>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<Key />} label="API Keys" iconPosition="start" />
        <Tab icon={<Code />} label="Documentation" iconPosition="start" />
      </Tabs>

      {/* API Keys Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          {/* Summary Cards */}
          <Grid size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3" fontWeight={700} color="primary">
                {usageStats?.totalActiveKeys ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Active Keys
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 6, md: 3 }}>
            <Card sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h3" fontWeight={700} color="success.main">
                {usageStats?.keysUsedInPeriod ?? 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Used (30d)
              </Typography>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Recently Active Keys
              </Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {usageStats?.topKeys?.slice(0, 5).map((k: any) => (
                  <Chip
                    key={k.id}
                    size="small"
                    label={k.name}
                    variant="outlined"
                  />
                ))}
                {!usageStats?.topKeys?.length && (
                  <Typography variant="caption" color="text.secondary">
                    No recent activity
                  </Typography>
                )}
              </Box>
            </Card>
          </Grid>

          {/* Keys Table */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6" fontWeight={600}>
                  API Keys
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showRevoked}
                      onChange={(e) => setShowRevoked(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Show revoked"
                />
              </Box>
              {loadingKeys ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name / Partner</TableCell>
                      <TableCell>Tenant</TableCell>
                      <TableCell>Key Prefix</TableCell>
                      <TableCell>Scopes</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Last Used</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {keysData?.keys?.map((key: ExternalApiKey) => (
                      <TableRow key={key.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={500}>
                            {key.name}
                          </Typography>
                          {key.partnerName && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {key.partnerName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {key.tenantName || key.tenantSlug}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <code>{key.keyPrefix}...</code>
                        </TableCell>
                        <TableCell>
                          {key.scopes.map((s) => (
                            <Chip
                              key={s}
                              size="small"
                              label={s}
                              variant="outlined"
                              sx={{ mr: 0.5 }}
                            />
                          ))}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={key.isActive ? "Active" : "Revoked"}
                            color={key.isActive ? "success" : "error"}
                          />
                        </TableCell>
                        <TableCell>
                          {key.lastUsedAt
                            ? new Date(key.lastUsedAt).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Regenerate key">
                            <IconButton
                              size="small"
                              onClick={() => regenerateMutation.mutate(key.id)}
                              disabled={regenerateMutation.isPending}
                            >
                              <Refresh fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {key.isActive ? (
                            <Tooltip title="Revoke key">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => revokeMutation.mutate(key.id)}
                                disabled={revokeMutation.isPending}
                              >
                                <Block fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="Reactivate key">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => activateMutation.mutate(key.id)}
                                disabled={activateMutation.isPending}
                              >
                                <PlayArrow fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!keysData?.keys?.length && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          <Typography color="text.secondary" sx={{ py: 3 }}>
                            No API keys found. Create one to get started.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Documentation Tab */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                API Endpoints
              </Typography>
              {loadingDocs ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <Box>
                  <Alert severity="info" sx={{ mb: 3 }}>
                    Base URL: <code>{apiDocs?.baseUrl}</code>
                  </Alert>
                  {apiDocs?.endpoints?.map((ep: any, i: number) => (
                    <Box
                      key={i}
                      sx={{
                        p: 2,
                        mb: 2,
                        borderRadius: 1,
                        bgcolor: "background.default",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          mb: 1,
                        }}
                      >
                        <Chip
                          size="small"
                          label={ep.method}
                          color="primary"
                          variant="outlined"
                        />
                        <code>{ep.path}</code>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {ep.description}
                      </Typography>
                      {ep.parameters?.length > 0 && (
                        <Box sx={{ mt: 1 }}>
                          <Typography variant="caption" color="text.secondary">
                            Parameters:{" "}
                          </Typography>
                          {ep.parameters.map((p: string) => (
                            <Chip
                              key={p}
                              size="small"
                              label={p}
                              variant="outlined"
                              sx={{ mr: 0.5, fontSize: "0.7rem" }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Authentication
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {apiDocs?.authentication?.description}
              </Typography>
              <Box
                sx={{ bgcolor: "background.default", p: 2, borderRadius: 1 }}
              >
                <Typography variant="caption" color="text.secondary">
                  Header
                </Typography>
                <Typography variant="body2" fontWeight={500}>
                  {apiDocs?.authentication?.header}: {"<your-api-key>"}
                </Typography>
              </Box>
            </Card>
            <Card sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Rate Limits
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {apiDocs?.rateLimits?.description}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Default: <strong>{apiDocs?.rateLimits?.defaultLimit}</strong>
              </Typography>
            </Card>
            <Card sx={{ p: 3, mt: 2 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Privacy
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {apiDocs?.privacy?.description}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                K-anonymity: <strong>{apiDocs?.privacy?.kAnonymity}</strong>
              </Typography>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Create API Key Dialog */}
      <Dialog
        open={createOpen && !newKeyResult}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create API Key</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2, mb: 2 }}>
            <InputLabel>Tenant</InputLabel>
            <Select
              value={createForm.tenantId}
              label="Tenant"
              onChange={(e) =>
                setCreateForm({ ...createForm, tenantId: e.target.value })
              }
            >
              {tenants?.map((t: any) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Key Name"
            placeholder="e.g., NDIS Integration"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Partner Name"
            placeholder="Organization name"
            value={createForm.partnerName}
            onChange={(e) =>
              setCreateForm({ ...createForm, partnerName: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Contact Email"
            placeholder="partner@example.com"
            value={createForm.contactEmail}
            onChange={(e) =>
              setCreateForm({ ...createForm, contactEmail: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            multiline
            rows={2}
            value={createForm.description}
            onChange={(e) =>
              setCreateForm({ ...createForm, description: e.target.value })
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Rate Limit (requests/hour)"
            type="number"
            value={createForm.rateLimitPerHour}
            onChange={(e) =>
              setCreateForm({
                ...createForm,
                rateLimitPerHour: parseInt(e.target.value) || 1000,
              })
            }
          />
          {createMutation.isError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {(createMutation.error as Error).message}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={
              !createForm.name ||
              !createForm.tenantId ||
              createMutation.isPending
            }
          >
            {createMutation.isPending ? "Creating..." : "Create Key"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Key Result Dialog */}
      <Dialog open={!!newKeyResult} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle color="success" />
            API Key Created
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 3 }}>
            {newKeyResult?.warning}
          </Alert>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            API Key
          </Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              p: 2,
              bgcolor: "background.default",
              borderRadius: 1,
              mb: 2,
            }}
          >
            <code style={{ flex: 1, wordBreak: "break-all" }}>
              {newKeyResult?.apiKey}
            </code>
            <IconButton onClick={handleCopyKey}>
              {copied ? <CheckCircle color="success" /> : <ContentCopy />}
            </IconButton>
          </Box>
          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Name
              </Typography>
              <Typography>{newKeyResult?.name}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Tenant
              </Typography>
              <Typography>{newKeyResult?.tenantName}</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Rate Limit
              </Typography>
              <Typography>{newKeyResult?.rateLimitPerHour}/hour</Typography>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Scopes
              </Typography>
              <Typography>{newKeyResult?.scopes?.join(", ")}</Typography>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={handleCloseNewKey}>
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
