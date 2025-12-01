import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  InputAdornment,
  Switch,
  FormControlLabel,
  Drawer,
  Divider,
  Tabs,
  Tab,
  LinearProgress,
} from "@mui/material";
import {
  Add,
  Edit,
  Archive,
  Restore,
  Search,
  Close,
  Upload,
  CheckCircle,
  Warning,
  ContentCopy,
} from "@mui/icons-material";
import { useSnackbar } from "notistack";
import { deviceManagementApi } from "../services/api";
import type { ManagedDevice, CreateDeviceRequest } from "../types/outcomes";

const emptyDevice: CreateDeviceRequest = {
  name: "",
  deviceCode: "",
  category: "",
  bodyRegion: "",
  description: "",
  udiCode: "",
};

export default function DeviceManagement() {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  // State
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<ManagedDevice | null>(
    null,
  );
  const [formData, setFormData] = useState<CreateDeviceRequest>(emptyDevice);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [tabValue, setTabValue] = useState(0);

  // Queries
  const { data, isLoading, error } = useQuery({
    queryKey: ["managed-devices", showInactive],
    queryFn: () => deviceManagementApi.getDevices(showInactive),
  });

  const { data: metadata } = useQuery({
    queryKey: ["device-metadata"],
    queryFn: () => deviceManagementApi.getMetadata(),
  });

  const devices = data?.devices || [];
  const categories = metadata?.categories || [];
  const bodyRegions = metadata?.bodyRegions || [];

  // Filter devices
  const filteredDevices = devices.filter((device) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      device.name.toLowerCase().includes(searchLower) ||
      device.deviceCode.toLowerCase().includes(searchLower) ||
      device.category?.toLowerCase().includes(searchLower) ||
      device.bodyRegion?.toLowerCase().includes(searchLower)
    );
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: deviceManagementApi.createDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-devices"] });
      enqueueSnackbar("Device created successfully", { variant: "success" });
      closeDrawer();
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to create device", {
        variant: "error",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateDeviceRequest }) =>
      deviceManagementApi.updateDevice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-devices"] });
      enqueueSnackbar("Device updated successfully", { variant: "success" });
      closeDrawer();
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to update device", {
        variant: "error",
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: deviceManagementApi.archiveDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-devices"] });
      enqueueSnackbar("Device archived", { variant: "success" });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: deviceManagementApi.restoreDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["managed-devices"] });
      enqueueSnackbar("Device restored", { variant: "success" });
    },
  });

  const bulkCreateMutation = useMutation({
    mutationFn: deviceManagementApi.bulkCreate,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["managed-devices"] });
      enqueueSnackbar(result.message, { variant: "success" });
      setBulkDialogOpen(false);
      setBulkText("");
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Bulk import failed", {
        variant: "error",
      });
    },
  });

  // Handlers
  const openCreateDrawer = () => {
    setEditingDevice(null);
    setFormData(emptyDevice);
    setDrawerOpen(true);
  };

  const openEditDrawer = (device: ManagedDevice) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      deviceCode: device.deviceCode,
      category: device.category || "",
      bodyRegion: device.bodyRegion || "",
      description: device.description || "",
      udiCode: device.udiCode || "",
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditingDevice(null);
    setFormData(emptyDevice);
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.deviceCode) {
      enqueueSnackbar("Name and Device Code are required", {
        variant: "warning",
      });
      return;
    }

    if (editingDevice) {
      updateMutation.mutate({ id: editingDevice.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleBulkImport = () => {
    const lines = bulkText
      .trim()
      .split("\n")
      .filter((line) => line.trim());
    const devices: CreateDeviceRequest[] = [];

    for (const line of lines) {
      const parts =
        line.split("\t").length > 1 ? line.split("\t") : line.split(",");
      if (parts.length >= 2) {
        devices.push({
          name: parts[0]?.trim() || "",
          deviceCode: parts[1]?.trim() || "",
          category: parts[2]?.trim() || "",
          bodyRegion: parts[3]?.trim() || "",
          description: parts[4]?.trim() || "",
          udiCode: parts[5]?.trim() || "",
        });
      }
    }

    if (devices.length === 0) {
      enqueueSnackbar(
        "No valid devices found. Use format: Name, Code, Category, Body Region, Description, UDI",
        { variant: "warning" },
      );
      return;
    }

    bulkCreateMutation.mutate(devices);
  };

  const handleDuplicateDevice = (device: ManagedDevice) => {
    setEditingDevice(null);
    setFormData({
      name: `${device.name} (Copy)`,
      deviceCode: `${device.deviceCode}-COPY`,
      category: device.category || "",
      bodyRegion: device.bodyRegion || "",
      description: device.description || "",
      udiCode: "",
    });
    setDrawerOpen(true);
  };

  const updateField = (field: keyof CreateDeviceRequest, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (error) {
    return (
      <Alert severity="error">
        Failed to load devices. Please try again later.
      </Alert>
    );
  }

  const activeCount = devices.filter((d) => d.isActive).length;
  const inactiveCount = devices.filter((d) => !d.isActive).length;

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Device Management
          </Typography>
          <Typography color="text.secondary">
            Add, edit, and manage your medical device catalog
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Upload />}
            onClick={() => setBulkDialogOpen(true)}
          >
            Bulk Import
          </Button>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreateDrawer}
          >
            Add Device
          </Button>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ minWidth: 140 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Active Devices
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {isLoading ? <Skeleton width={40} /> : activeCount}
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 140 }}>
          <CardContent sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Archived
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {isLoading ? <Skeleton width={40} /> : inactiveCount}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <TextField
              placeholder="Search devices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ minWidth: 300 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                />
              }
              label="Show archived devices"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Devices Table */}
      {isLoading ? (
        <Card>
          <CardContent>
            <Skeleton variant="rectangular" height={400} />
          </CardContent>
        </Card>
      ) : filteredDevices.length === 0 ? (
        <Alert
          severity="info"
          action={
            <Button color="inherit" size="small" onClick={openCreateDrawer}>
              Add Device
            </Button>
          }
        >
          {devices.length === 0
            ? "No devices yet. Add your first device to get started."
            : "No devices match your search."}
        </Alert>
      ) : (
        <Paper sx={{ overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Device</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Body Region</TableCell>
                <TableCell align="center">Usage</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDevices.map((device) => (
                <TableRow
                  key={device.id}
                  sx={{
                    opacity: device.isActive ? 1 : 0.6,
                    bgcolor: device.isActive ? "transparent" : "action.hover",
                  }}
                >
                  <TableCell>
                    <Typography fontWeight={600}>{device.name}</Typography>
                    {device.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: "block",
                          maxWidth: 300,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {device.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {device.deviceCode}
                    </Typography>
                    {device.udiCode && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block" }}
                      >
                        UDI: {device.udiCode}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.category ? (
                      <Chip
                        label={device.category}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {device.bodyRegion ? (
                      <Chip
                        label={device.bodyRegion}
                        size="small"
                        variant="outlined"
                      />
                    ) : (
                      <Typography color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Typography fontWeight={600}>
                      {device.usageCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {device.patientCount} patients
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {device.isActive ? (
                      <Chip
                        icon={<CheckCircle />}
                        label="Active"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<Warning />}
                        label="Archived"
                        color="default"
                        size="small"
                      />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => openEditDrawer(device)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Duplicate">
                      <IconButton
                        size="small"
                        onClick={() => handleDuplicateDevice(device)}
                      >
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {device.isActive ? (
                      <Tooltip title="Archive">
                        <IconButton
                          size="small"
                          onClick={() => archiveMutation.mutate(device.id)}
                          disabled={device.usageCount > 0}
                        >
                          <Archive fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Tooltip title="Restore">
                        <IconButton
                          size="small"
                          onClick={() => restoreMutation.mutate(device.id)}
                        >
                          <Restore fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Add/Edit Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{ sx: { width: { xs: "100%", sm: 450 } } }}
      >
        <Box sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={600}>
              {editingDevice ? "Edit Device" : "Add New Device"}
            </Typography>
            <IconButton onClick={closeDrawer}>
              <Close />
            </IconButton>
          </Box>

          <Tabs
            value={tabValue}
            onChange={(_, v) => setTabValue(v)}
            sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
          >
            <Tab label="Basic Info" />
            <Tab label="Details" />
          </Tabs>

          {tabValue === 0 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Device Name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                required
                fullWidth
                placeholder="e.g., Infuse Bone Graft LT-CAGE"
                helperText="The full product name"
                autoFocus
              />
              <TextField
                label="Device Code / SKU"
                value={formData.deviceCode}
                onChange={(e) => updateField("deviceCode", e.target.value)}
                required
                fullWidth
                placeholder="e.g., MDT-INF-7510"
                helperText="Your internal product code or SKU"
                inputProps={{ style: { fontFamily: "monospace" } }}
              />
              <Autocomplete
                freeSolo
                options={categories}
                value={formData.category || ""}
                onChange={(_, value) => updateField("category", value || "")}
                onInputChange={(_, value) => updateField("category", value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    placeholder="Select or type a category"
                    helperText="Group similar devices together"
                  />
                )}
              />
              <Autocomplete
                freeSolo
                options={bodyRegions}
                value={formData.bodyRegion || ""}
                onChange={(_, value) => updateField("bodyRegion", value || "")}
                onInputChange={(_, value) => updateField("bodyRegion", value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Body Region"
                    placeholder="Select or type a body region"
                    helperText="Where this device is typically used"
                  />
                )}
              />
            </Box>
          )}

          {tabValue === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                multiline
                rows={4}
                fullWidth
                placeholder="Brief description of the device..."
                helperText="Optional product description"
              />
              <TextField
                label="FDA UDI Code"
                value={formData.udiCode}
                onChange={(e) => updateField("udiCode", e.target.value)}
                fullWidth
                placeholder="e.g., (01)00884838012345"
                helperText="Unique Device Identifier (if available)"
                inputProps={{ style: { fontFamily: "monospace" } }}
              />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" onClick={closeDrawer} fullWidth>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              fullWidth
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Saving..."
                : editingDevice
                  ? "Update Device"
                  : "Add Device"}
            </Button>
          </Box>
        </Box>
      </Drawer>

      {/* Bulk Import Dialog */}
      <Dialog
        open={bulkDialogOpen}
        onClose={() => setBulkDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulk Import Devices</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Paste device data from a spreadsheet. Each row should contain: Name,
            Code, Category, Body Region, Description, UDI (tab or comma
            separated).
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Tip:</strong> Copy rows directly from Excel or Google
              Sheets. Duplicate codes will be skipped.
            </Typography>
          </Alert>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={`Infuse Bone Graft, MDT-7510, Bone Graft, Lumbar, rhBMP-2 bone graft, (01)00884838012345
Prestige LP Disc, MDT-8620, Spinal Implant, Cervical, Cervical disc replacement,
...`}
            sx={{ fontFamily: "monospace", fontSize: 13 }}
          />
          {bulkCreateMutation.isPending && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleBulkImport}
            disabled={!bulkText.trim() || bulkCreateMutation.isPending}
          >
            Import Devices
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
