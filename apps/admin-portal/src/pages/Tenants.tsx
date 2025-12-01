import { useState } from "react";
import {
  Box,
  Card,
  Typography,
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
  Button,
} from "@mui/material";
import {
  Search,
  MoreVert,
  Pause,
  PlayArrow,
  Download,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { adminApi } from "../services/api";
import { exportTenantsData } from "../services/export";

export default function Tenants() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const [search, setSearch] = useState("");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTenant, setSelectedTenant] = useState<any>(null);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["tenants"],
    queryFn: adminApi.getTenants,
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

  const filteredTenants =
    tenants?.filter(
      (t: any) =>
        t.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.slug?.toLowerCase().includes(search.toLowerCase()),
    ) || [];

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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700}>
          Tenants
        </Typography>
        <Typography color="text.secondary">
          Data from Analytics Lake (updated nightly)
        </Typography>
      </Box>

      <Card>
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download />}
            onClick={() => {
              exportTenantsData(filteredTenants);
              enqueueSnackbar("Tenants exported to CSV", {
                variant: "success",
              });
            }}
            disabled={filteredTenants.length === 0}
          >
            Export CSV
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Clinic</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i}>
                    {[...Array(4)].map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No tenants found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant: any) => (
                  <TableRow key={tenant.id} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{tenant.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tenant.slug}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {tenant.region ? (
                        <Chip label={tenant.region} size="small" />
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {tenant.created_at
                        ? new Date(tenant.created_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell align="right">
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
            suspendMutation.mutate(selectedTenant?.id);
            setAnchorEl(null);
          }}
        >
          <Pause fontSize="small" sx={{ mr: 1 }} /> Suspend
        </MenuItem>
        <MenuItem
          onClick={() => {
            activateMutation.mutate(selectedTenant?.id);
            setAnchorEl(null);
          }}
        >
          <PlayArrow fontSize="small" sx={{ mr: 1 }} /> Activate
        </MenuItem>
      </Menu>
    </Box>
  );
}
