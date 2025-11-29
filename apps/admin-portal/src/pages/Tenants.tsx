import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add,
  Search,
  MoreVert,
  Edit,
  Pause,
  PlayArrow,
  Delete,
} from "@mui/icons-material";
import { Tenant, TenantStatus, PlanTier } from "../types/tenant";

// Mock data - replace with API call
const mockTenants: Tenant[] = [
  {
    id: "1",
    name: "Sydney Physio Clinic",
    slug: "sydney-physio",
    status: "active",
    planTier: "professional",
    createdAt: "2024-06-15",
    contactEmail: "admin@sydneyphysio.com.au",
    contactName: "Dr. Sarah Chen",
    featureFlags: {
      aiTriage: true,
      aiTreatmentPlans: true,
      documentOcr: true,
      smsReminders: true,
      apiAccess: false,
      customBranding: false,
      hipaaAuditLogs: true,
    },
    usageLimits: {
      maxPractitioners: 10,
      maxPatients: 2000,
      maxStorageGb: 50,
      maxAiCallsPerMonth: 1000,
    },
  },
  {
    id: "2",
    name: "Melbourne Sports Medicine",
    slug: "melb-sports",
    status: "active",
    planTier: "enterprise",
    createdAt: "2024-03-20",
    contactEmail: "ops@melbsports.com.au",
    contactName: "James Wilson",
    featureFlags: {
      aiTriage: true,
      aiTreatmentPlans: true,
      documentOcr: true,
      smsReminders: true,
      apiAccess: true,
      customBranding: true,
      hipaaAuditLogs: true,
    },
    usageLimits: {
      maxPractitioners: 999,
      maxPatients: 999999,
      maxStorageGb: 500,
      maxAiCallsPerMonth: 10000,
    },
  },
  {
    id: "3",
    name: "Brisbane Wellness Centre",
    slug: "bris-wellness",
    status: "trial",
    planTier: "starter",
    createdAt: "2024-11-01",
    contactEmail: "hello@briswellness.com.au",
    contactName: "Emma Thompson",
    featureFlags: {
      aiTriage: false,
      aiTreatmentPlans: false,
      documentOcr: true,
      smsReminders: false,
      apiAccess: false,
      customBranding: false,
      hipaaAuditLogs: false,
    },
    usageLimits: {
      maxPractitioners: 2,
      maxPatients: 500,
      maxStorageGb: 10,
      maxAiCallsPerMonth: 0,
    },
  },
  {
    id: "4",
    name: "Perth Chiropractic",
    slug: "perth-chiro",
    status: "suspended",
    planTier: "professional",
    createdAt: "2024-01-10",
    contactEmail: "admin@perthchiro.com.au",
    contactName: "Michael Brown",
    featureFlags: {
      aiTriage: true,
      aiTreatmentPlans: true,
      documentOcr: true,
      smsReminders: true,
      apiAccess: false,
      customBranding: false,
      hipaaAuditLogs: true,
    },
    usageLimits: {
      maxPractitioners: 10,
      maxPatients: 2000,
      maxStorageGb: 50,
      maxAiCallsPerMonth: 1000,
    },
  },
];

const statusColors: Record<
  TenantStatus,
  "success" | "warning" | "error" | "default"
> = {
  active: "success",
  trial: "warning",
  suspended: "error",
  churned: "default",
};

const planColors: Record<PlanTier, string> = {
  starter: "#64748b",
  professional: "#6366f1",
  enterprise: "#ec4899",
};

export default function Tenants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const filteredTenants = mockTenants.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.contactEmail.toLowerCase().includes(search.toLowerCase()),
  );

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    tenant: Tenant,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedTenant(tenant);
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
          <Typography variant="h4" fontWeight={700}>
            Tenants
          </Typography>
          <Typography color="text.secondary">
            Manage clinic accounts and subscriptions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
        >
          Add Tenant
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <TextField
            placeholder="Search tenants..."
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 300 }}
          />
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Clinic</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Plan</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTenants.map((tenant) => (
                <TableRow
                  key={tenant.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/tenants/${tenant.id}`)}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{tenant.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tenant.slug}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {tenant.contactName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {tenant.contactEmail}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tenant.planTier}
                      size="small"
                      sx={{
                        bgcolor: planColors[tenant.planTier],
                        color: "white",
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tenant.status}
                      size="small"
                      color={statusColors[tenant.status]}
                      sx={{ textTransform: "capitalize" }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, tenant)}
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            navigate(`/tenants/${selectedTenant?.id}`);
            setAnchorEl(null);
          }}
        >
          <Edit fontSize="small" sx={{ mr: 1 }} /> Edit
        </MenuItem>
        {selectedTenant?.status === "active" ? (
          <MenuItem onClick={() => setAnchorEl(null)}>
            <Pause fontSize="small" sx={{ mr: 1 }} /> Suspend
          </MenuItem>
        ) : (
          <MenuItem onClick={() => setAnchorEl(null)}>
            <PlayArrow fontSize="small" sx={{ mr: 1 }} /> Activate
          </MenuItem>
        )}
        <MenuItem
          onClick={() => setAnchorEl(null)}
          sx={{ color: "error.main" }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Tenant</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Clinic Name" sx={{ mt: 2, mb: 2 }} />
          <TextField fullWidth label="Slug" sx={{ mb: 2 }} />
          <TextField fullWidth label="Contact Name" sx={{ mb: 2 }} />
          <TextField fullWidth label="Contact Email" type="email" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setCreateOpen(false)}>
            Create Tenant
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
