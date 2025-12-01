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
  Alert,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Search,
  PersonOutline,
  History,
  Campaign,
  ContentCopy,
  CheckCircle,
  Error,
  Visibility,
  Business,
} from "@mui/icons-material";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  supportApi,
  adminApi,
  AuditLog,
  SearchResult,
  ImpersonateResult,
} from "../services/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Support() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [auditPage, setAuditPage] = useState(1);
  const [auditFilters, setAuditFilters] = useState<{
    action?: string;
    resourceType?: string;
  }>({});

  // Impersonation state
  const [impersonateForm, setImpersonateForm] = useState({
    tenantId: "",
    email: "",
    reason: "",
  });
  const [impersonateResult, setImpersonateResult] =
    useState<ImpersonateResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Announcement state
  const [announcementForm, setAnnouncementForm] = useState({
    tenantId: "",
    sendToAll: false,
    subject: "",
    body: "",
  });

  // Global search
  const { data: searchResults, isLoading: loadingSearch } = useQuery({
    queryKey: ["global-search", searchQuery],
    queryFn: () => supportApi.globalSearch(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  // Audit logs
  const { data: auditLogs, isLoading: loadingAudit } = useQuery({
    queryKey: ["audit-logs", auditPage, auditFilters],
    queryFn: () =>
      supportApi.getAuditLogs({
        page: auditPage,
        pageSize: 20,
        ...auditFilters,
      }),
  });

  // Tenants for dropdown
  const { data: tenants } = useQuery({
    queryKey: ["tenants-list"],
    queryFn: adminApi.getTenants,
  });

  // Impersonation mutation
  const impersonateMutation = useMutation({
    mutationFn: supportApi.impersonate,
    onSuccess: (data) => {
      setImpersonateResult(data);
    },
  });

  // Announcement mutation
  const announcementMutation = useMutation({
    mutationFn: supportApi.sendAnnouncement,
    onSuccess: () => {
      setAnnouncementForm({
        tenantId: "",
        sendToAll: false,
        subject: "",
        body: "",
      });
    },
  });

  const handleImpersonate = () => {
    impersonateMutation.mutate({
      tenantId: impersonateForm.tenantId,
      email: impersonateForm.email || undefined,
      reason: impersonateForm.reason,
    });
  };

  const handleCopyToken = () => {
    if (impersonateResult?.token) {
      navigator.clipboard.writeText(impersonateResult.token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendAnnouncement = () => {
    announcementMutation.mutate({
      tenantId: announcementForm.sendToAll
        ? undefined
        : announcementForm.tenantId,
      sendToAllTenants: announcementForm.sendToAll,
      subject: announcementForm.subject,
      body: announcementForm.body,
    });
  };

  const renderSearchResult = (result: SearchResult) => (
    <Box
      key={result.id}
      sx={{
        p: 2,
        mb: 1,
        borderRadius: 1,
        bgcolor: "background.default",
        cursor: "pointer",
        "&:hover": { bgcolor: "action.hover" },
      }}
      onClick={() => {
        if (result.type === "tenant") {
          navigate(`/tenants/${result.id}`);
        }
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        {result.type === "tenant" ? (
          <Business fontSize="small" color="primary" />
        ) : (
          <PersonOutline fontSize="small" color="secondary" />
        )}
        <Typography variant="body2" fontWeight={500}>
          {result.name}
        </Typography>
        <Chip
          size="small"
          label={result.type}
          variant="outlined"
          sx={{ ml: "auto" }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {result.description}
      </Typography>
      {result.email && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          {result.email}
        </Typography>
      )}
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Support Tools
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Impersonation, audit logs, and tenant communication
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<Search />} label="Search" iconPosition="start" />
        <Tab
          icon={<PersonOutline />}
          label="Impersonate"
          iconPosition="start"
        />
        <Tab icon={<History />} label="Audit Logs" iconPosition="start" />
        <Tab icon={<Campaign />} label="Announcements" iconPosition="start" />
      </Tabs>

      {/* Global Search Tab */}
      {tab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ p: 3 }}>
              <TextField
                fullWidth
                placeholder="Search tenants, users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              {searchQuery.length >= 2 && (
                <Box sx={{ mt: 2 }}>
                  {loadingSearch ? (
                    <Skeleton variant="rectangular" height={200} />
                  ) : searchResults?.results?.length === 0 ? (
                    <Typography color="text.secondary" sx={{ py: 2 }}>
                      No results found for "{searchQuery}"
                    </Typography>
                  ) : (
                    <>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {searchResults?.resultCount} results
                      </Typography>
                      {searchResults?.results.map(renderSearchResult)}
                    </>
                  )}
                </Box>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Impersonate Tab */}
      {tab === 1 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Impersonate User
              </Typography>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Impersonation creates a temporary access token for debugging.
                All actions are logged and audited.
              </Alert>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Tenant</InputLabel>
                <Select
                  value={impersonateForm.tenantId}
                  label="Tenant"
                  onChange={(e) =>
                    setImpersonateForm({
                      ...impersonateForm,
                      tenantId: e.target.value,
                    })
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
                label="User Email (optional)"
                placeholder="Leave empty for tenant admin"
                value={impersonateForm.email}
                onChange={(e) =>
                  setImpersonateForm({
                    ...impersonateForm,
                    email: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Reason"
                placeholder="Why are you impersonating this user?"
                value={impersonateForm.reason}
                onChange={(e) =>
                  setImpersonateForm({
                    ...impersonateForm,
                    reason: e.target.value,
                  })
                }
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="warning"
                onClick={handleImpersonate}
                disabled={
                  !impersonateForm.tenantId || impersonateMutation.isPending
                }
              >
                {impersonateMutation.isPending
                  ? "Generating..."
                  : "Generate Token"}
              </Button>

              {impersonateMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(impersonateMutation.error as Error).message}
                </Alert>
              )}
            </Card>
          </Grid>

          {impersonateResult && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Card sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Impersonation Token Generated
                </Typography>
                <Alert severity="info" sx={{ mb: 2 }}>
                  {impersonateResult.warning}
                </Alert>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Target User
                  </Typography>
                  <Typography fontWeight={500}>
                    {impersonateResult.targetUser.name} (
                    {impersonateResult.targetUser.email})
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Role: {impersonateResult.targetUser.role}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tenant
                  </Typography>
                  <Typography fontWeight={500}>
                    {impersonateResult.tenant.name}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Expires In
                  </Typography>
                  <Typography fontWeight={500}>
                    {impersonateResult.expiresIn / 60} minutes
                  </Typography>
                </Box>
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={impersonateResult.token}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <IconButton onClick={handleCopyToken}>
                        {copied ? (
                          <CheckCircle color="success" />
                        ) : (
                          <ContentCopy />
                        )}
                      </IconButton>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Use this token in the Authorization header: Bearer {"{token}"}
                </Typography>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Audit Logs Tab */}
      {tab === 2 && (
        <Grid container spacing={3}>
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
                  Admin Audit Logs
                </Typography>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Action</InputLabel>
                    <Select
                      value={auditFilters.action || ""}
                      label="Action"
                      onChange={(e) =>
                        setAuditFilters({
                          ...auditFilters,
                          action: e.target.value || undefined,
                        })
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="tenant">Tenant</MenuItem>
                      <MenuItem value="billing">Billing</MenuItem>
                      <MenuItem value="support">Support</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Resource Type</InputLabel>
                    <Select
                      value={auditFilters.resourceType || ""}
                      label="Resource Type"
                      onChange={(e) =>
                        setAuditFilters({
                          ...auditFilters,
                          resourceType: e.target.value || undefined,
                        })
                      }
                    >
                      <MenuItem value="">All</MenuItem>
                      <MenuItem value="Tenant">Tenant</MenuItem>
                      <MenuItem value="User">User</MenuItem>
                      <MenuItem value="Subscription">Subscription</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {loadingAudit ? (
                <Skeleton variant="rectangular" height={400} />
              ) : (
                <>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Admin</TableCell>
                        <TableCell>Action</TableCell>
                        <TableCell>Resource</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {auditLogs?.logs?.map((log: AuditLog) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            {new Date(log.createdAt).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.adminEmail}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={log.action}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {log.resourceType}/
                              {log.resourceName || log.resourceId}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {log.success ? (
                              <CheckCircle fontSize="small" color="success" />
                            ) : (
                              <Error fontSize="small" color="error" />
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                // Could open detail modal
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Box
                    sx={{ display: "flex", justifyContent: "center", mt: 2 }}
                  >
                    <Pagination
                      count={auditLogs?.totalPages || 1}
                      page={auditPage}
                      onChange={(_, p) => setAuditPage(p)}
                    />
                  </Box>
                </>
              )}
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Announcements Tab */}
      {tab === 3 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Send Announcement
              </Typography>
              <Alert severity="info" sx={{ mb: 3 }}>
                Send email announcements to all users in a tenant or across the
                entire platform.
              </Alert>
              <Box sx={{ mb: 2 }}>
                <Button
                  variant={
                    announcementForm.sendToAll ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() =>
                    setAnnouncementForm({
                      ...announcementForm,
                      sendToAll: true,
                      tenantId: "",
                    })
                  }
                  sx={{ mr: 1 }}
                >
                  All Tenants
                </Button>
                <Button
                  variant={
                    !announcementForm.sendToAll ? "contained" : "outlined"
                  }
                  size="small"
                  onClick={() =>
                    setAnnouncementForm({
                      ...announcementForm,
                      sendToAll: false,
                    })
                  }
                >
                  Specific Tenant
                </Button>
              </Box>
              {!announcementForm.sendToAll && (
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Tenant</InputLabel>
                  <Select
                    value={announcementForm.tenantId}
                    label="Tenant"
                    onChange={(e) =>
                      setAnnouncementForm({
                        ...announcementForm,
                        tenantId: e.target.value,
                      })
                    }
                  >
                    {tenants?.map((t: any) => (
                      <MenuItem key={t.id} value={t.id}>
                        {t.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <TextField
                fullWidth
                label="Subject"
                value={announcementForm.subject}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    subject: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Message"
                multiline
                rows={6}
                value={announcementForm.body}
                onChange={(e) =>
                  setAnnouncementForm({
                    ...announcementForm,
                    body: e.target.value,
                  })
                }
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendAnnouncement}
                disabled={
                  !announcementForm.subject ||
                  !announcementForm.body ||
                  (!announcementForm.sendToAll && !announcementForm.tenantId) ||
                  announcementMutation.isPending
                }
              >
                {announcementMutation.isPending
                  ? "Sending..."
                  : "Send Announcement"}
              </Button>

              {announcementMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Announcement sent successfully!
                </Alert>
              )}
              {announcementMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {(announcementMutation.error as Error).message}
                </Alert>
              )}
            </Card>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Tips
              </Typography>
              <Box sx={{ color: "text.secondary" }}>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  <strong>When to use announcements:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                  - Planned maintenance windows
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                  - New feature releases
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                  - Important security updates
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                  - Billing or pricing changes
                </Typography>
                <Typography variant="body2" sx={{ mt: 3, mb: 2 }}>
                  <strong>Best practices:</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                  - Keep messages concise
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                  - Include action items if needed
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, pl: 2 }}>
                  - Test with a single tenant first
                </Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
