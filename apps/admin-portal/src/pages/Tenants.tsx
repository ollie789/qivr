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
  Skeleton,
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { adminApi } from "../services/api";

const statusColors: Record<
  string,
  "success" | "warning" | "error" | "default"
> = {
  active: "success",
  trial: "warning",
  suspended: "error",
  cancelled: "default",
};

const planColors: Record<string, string> = {
  starter: "#64748b",
  professional: "#6366f1",
  enterprise: "#ec4899",
};

export default function Tenants() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants", search],
    queryFn: () => adminApi.getTenants(search || undefined),
  });

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      enqueueSnackbar("Tenant suspended", { variant: "warning" });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateTenant(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      enqueueSnackbar("Tenant activated", { variant: "success" });
    },
  });

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    tenant: any,
  ) => {
    event.stopPropagation();
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
        <Button variant="contained" startIcon={<Add />} disabled>
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
                <TableCell>Patients</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(7)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : tenants?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No tenants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tenants?.map((tenant: any) => (
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
                        {tenant.contactName || "-"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tenant.contactEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.plan}
                        size="small"
                        sx={{
                          bgcolor:
                            planColors[tenant.plan?.toLowerCase()] || "#64748b",
                          color: "white",
                          textTransform: "capitalize",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={tenant.status}
                        size="small"
                        color={statusColors[tenant.status] || "default"}
                        sx={{ textTransform: "capitalize" }}
                      />
                    </TableCell>
                    <TableCell>
                      {tenant.patientCount?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell>
                      {new Date(tenant.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => handleMenuOpen(e, tenant)}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
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
          <Edit fontSize="small" sx={{ mr: 1 }} /> View Details
        </MenuItem>
        {selectedTenant?.status === "active" ? (
          <MenuItem
            onClick={() => {
              suspendMutation.mutate(selectedTenant.id);
              setAnchorEl(null);
            }}
          >
            <Pause fontSize="small" sx={{ mr: 1 }} /> Suspend
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              activateMutation.mutate(selectedTenant.id);
              setAnchorEl(null);
            }}
          >
            <PlayArrow fontSize="small" sx={{ mr: 1 }} /> Activate
          </MenuItem>
        )}
        <MenuItem sx={{ color: "error.main" }} disabled>
          <Delete fontSize="small" sx={{ mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </Box>
  );
}
