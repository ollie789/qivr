import {
  Box,
  Card,
  Typography,
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
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  InputAdornment,
  FormControl,
  Select,
  InputLabel,
} from "@mui/material";
import {
  Add,
  Search,
  MoreVert,
  Science,
  CheckCircle,
  Block,
  Business,
  Devices,
  Biotech,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  researchPartnersApi,
  ResearchPartnerListItem,
  CreatePartnerRequest,
} from "../services/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "notistack";

export default function ResearchPartners() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPartner, setSelectedPartner] =
    useState<ResearchPartnerListItem | null>(null);
  const [createForm, setCreateForm] = useState<CreatePartnerRequest>({
    name: "",
    contactEmail: "",
    description: "",
    website: "",
  });

  // Load partners
  const { data: partners, isLoading } = useQuery({
    queryKey: ["research-partners"],
    queryFn: researchPartnersApi.getPartners,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: researchPartnersApi.createPartner,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["research-partners"] });
      enqueueSnackbar("Partner created successfully", { variant: "success" });
      setCreateOpen(false);
      setCreateForm({
        name: "",
        contactEmail: "",
        description: "",
        website: "",
      });
      navigate(`/research-partners/${data.id}`);
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to create partner", {
        variant: "error",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: researchPartnersApi.activatePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partners"] });
      enqueueSnackbar("Partner activated", { variant: "success" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: researchPartnersApi.deactivatePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partners"] });
      enqueueSnackbar("Partner deactivated", { variant: "success" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: researchPartnersApi.deletePartner,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partners"] });
      enqueueSnackbar("Partner deleted", { variant: "success" });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to delete partner", {
        variant: "error",
      });
    },
  });

  // Filter partners
  const filteredPartners =
    partners?.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.slug.toLowerCase().includes(search.toLowerCase()) ||
        p.contactEmail?.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && p.isActive) ||
        (statusFilter === "inactive" && !p.isActive);
      return matchesSearch && matchesStatus;
    }) || [];

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    partner: ResearchPartnerListItem,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedPartner(partner);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPartner(null);
  };

  const handleCreate = () => {
    if (!createForm.name.trim()) {
      enqueueSnackbar("Partner name is required", { variant: "error" });
      return;
    }
    createMutation.mutate(createForm);
  };

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Science sx={{ fontSize: 32, color: "primary.main" }} />
          <Box>
            <Typography variant="h5" fontWeight={600}>
              Research Partners
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage medical device companies and research partnerships
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateOpen(true)}
        >
          Add Partner
        </Button>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ p: 2, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Business color="primary" />
            <Typography variant="body2" color="text.secondary">
              Partners
            </Typography>
          </Box>
          <Typography variant="h4">{partners?.length || 0}</Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CheckCircle color="success" />
            <Typography variant="body2" color="text.secondary">
              Active
            </Typography>
          </Box>
          <Typography variant="h4">
            {partners?.filter((p) => p.isActive).length || 0}
          </Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Devices color="info" />
            <Typography variant="body2" color="text.secondary">
              Total Devices
            </Typography>
          </Box>
          <Typography variant="h4">
            {partners?.reduce((sum, p) => sum + p.deviceCount, 0) || 0}
          </Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Biotech color="secondary" />
            <Typography variant="body2" color="text.secondary">
              Active Studies
            </Typography>
          </Box>
          <Typography variant="h4">
            {partners?.reduce((sum, p) => sum + p.studyCount, 0) || 0}
          </Typography>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <TextField
            placeholder="Search partners..."
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
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) =>
                setStatusFilter(e.target.value as "all" | "active" | "inactive")
              }
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Card>

      {/* Partners Table */}
      <Card>
        {isLoading ? (
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} height={60} />
            ))}
          </Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Partner</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell align="center">Clinics</TableCell>
                <TableCell align="center">Devices</TableCell>
                <TableCell align="center">Studies</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPartners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      {search || statusFilter !== "all"
                        ? "No partners match your filters"
                        : "No research partners yet. Add your first partner to get started."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPartners.map((partner) => (
                  <TableRow
                    key={partner.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => navigate(`/research-partners/${partner.id}`)}
                  >
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        {partner.logoUrl ? (
                          <Box
                            component="img"
                            src={partner.logoUrl}
                            alt={partner.name}
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              objectFit: "contain",
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: 1,
                              bgcolor: "primary.light",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Science sx={{ color: "primary.main" }} />
                          </Box>
                        )}
                        <Box>
                          <Typography fontWeight={500}>
                            {partner.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {partner.slug}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {partner.contactEmail || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={partner.clinicCount}
                        size="small"
                        color={partner.clinicCount > 0 ? "primary" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={partner.deviceCount}
                        size="small"
                        color={partner.deviceCount > 0 ? "info" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={partner.studyCount}
                        size="small"
                        color={partner.studyCount > 0 ? "secondary" : "default"}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={partner.isActive ? <CheckCircle /> : <Block />}
                        label={partner.isActive ? "Active" : "Inactive"}
                        color={partner.isActive ? "success" : "default"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell
                      align="right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <IconButton onClick={(e) => handleMenuOpen(e, partner)}>
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedPartner)
              navigate(`/research-partners/${selectedPartner.id}`);
          }}
        >
          View Details
        </MenuItem>
        {selectedPartner?.isActive ? (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              if (selectedPartner)
                deactivateMutation.mutate(selectedPartner.id);
            }}
          >
            Deactivate
          </MenuItem>
        ) : (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              if (selectedPartner) activateMutation.mutate(selectedPartner.id);
            }}
          >
            Activate
          </MenuItem>
        )}
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedPartner) {
              if (
                confirm(
                  `Delete ${selectedPartner.name}? This cannot be undone.`,
                )
              ) {
                deleteMutation.mutate(selectedPartner.id);
              }
            }
          }}
          sx={{ color: "error.main" }}
        >
          Delete
        </MenuItem>
      </Menu>

      {/* Create Dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Research Partner</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Partner Name"
              required
              value={createForm.name}
              onChange={(e) =>
                setCreateForm({ ...createForm, name: e.target.value })
              }
              placeholder="e.g., Medtronic"
              helperText="The company or organization name"
            />
            <TextField
              label="Contact Email"
              type="email"
              value={createForm.contactEmail}
              onChange={(e) =>
                setCreateForm({ ...createForm, contactEmail: e.target.value })
              }
              placeholder="partner@example.com"
            />
            <TextField
              label="Website"
              value={createForm.website}
              onChange={(e) =>
                setCreateForm({ ...createForm, website: e.target.value })
              }
              placeholder="https://www.example.com"
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
              placeholder="Brief description of the partnership..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreate}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating..." : "Create Partner"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
