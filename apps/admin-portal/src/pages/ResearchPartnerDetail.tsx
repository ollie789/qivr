import {
  Box,
  Card,
  Typography,
  Tabs,
  Tab,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Autocomplete,
} from "@mui/material";
import {
  ArrowBack,
  Edit,
  CheckCircle,
  Block,
  Add,
  Delete,
  Business,
  Devices,
  Biotech,
  Link as LinkIcon,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  researchPartnersApi,
  UpdatePartnerRequest,
  CreateAffiliationRequest,
  UpdateAffiliationRequest,
  CreateDeviceRequest,
  UpdateDeviceRequest,
} from "../services/api";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSnackbar } from "notistack";

export default function ResearchPartnerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [tab, setTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [affiliationOpen, setAffiliationOpen] = useState(false);
  const [editAffiliationOpen, setEditAffiliationOpen] = useState(false);
  const [selectedAffiliation, setSelectedAffiliation] = useState<string | null>(
    null,
  );
  const [editForm, setEditForm] = useState<UpdatePartnerRequest>({});
  const [affiliationForm, setAffiliationForm] =
    useState<CreateAffiliationRequest>({
      tenantId: "",
      status: "Pending",
      dataSharingLevel: "Aggregated",
      notes: "",
    });
  const [deviceOpen, setDeviceOpen] = useState(false);
  const [editDeviceOpen, setEditDeviceOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [deviceForm, setDeviceForm] = useState<CreateDeviceRequest>({
    name: "",
    deviceCode: "",
    category: "",
    bodyRegion: "",
    description: "",
  });

  // Load partner details
  const { data: partner, isLoading } = useQuery({
    queryKey: ["research-partner", id],
    queryFn: () => researchPartnersApi.getPartner(id!),
    enabled: !!id,
  });

  // Load available clinics for affiliation
  const { data: availableClinics } = useQuery({
    queryKey: ["available-clinics", id],
    queryFn: () => researchPartnersApi.getAvailableClinics(id!),
    enabled: !!id && affiliationOpen,
  });

  // Mutations
  const updateMutation = useMutation({
    mutationFn: (data: UpdatePartnerRequest) =>
      researchPartnersApi.updatePartner(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      enqueueSnackbar("Partner updated successfully", { variant: "success" });
      setEditOpen(false);
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to update partner", {
        variant: "error",
      });
    },
  });

  const activateMutation = useMutation({
    mutationFn: () => researchPartnersApi.activatePartner(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      enqueueSnackbar("Partner activated", { variant: "success" });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: () => researchPartnersApi.deactivatePartner(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      enqueueSnackbar("Partner deactivated", { variant: "success" });
    },
  });

  const addAffiliationMutation = useMutation({
    mutationFn: (data: CreateAffiliationRequest) =>
      researchPartnersApi.addAffiliation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      queryClient.invalidateQueries({ queryKey: ["available-clinics", id] });
      enqueueSnackbar("Affiliation added", { variant: "success" });
      setAffiliationOpen(false);
      setAffiliationForm({
        tenantId: "",
        status: "Pending",
        dataSharingLevel: "Aggregated",
        notes: "",
      });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to add affiliation", {
        variant: "error",
      });
    },
  });

  const updateAffiliationMutation = useMutation({
    mutationFn: ({
      affiliationId,
      data,
    }: {
      affiliationId: string;
      data: UpdateAffiliationRequest;
    }) => researchPartnersApi.updateAffiliation(id!, affiliationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      enqueueSnackbar("Affiliation updated", { variant: "success" });
      setEditAffiliationOpen(false);
      setSelectedAffiliation(null);
    },
  });

  const deleteAffiliationMutation = useMutation({
    mutationFn: (affiliationId: string) =>
      researchPartnersApi.deleteAffiliation(id!, affiliationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      queryClient.invalidateQueries({ queryKey: ["available-clinics", id] });
      enqueueSnackbar("Affiliation removed", { variant: "success" });
    },
  });

  // Device mutations
  const addDeviceMutation = useMutation({
    mutationFn: (data: CreateDeviceRequest) =>
      researchPartnersApi.createDevice(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      enqueueSnackbar("Device added", { variant: "success" });
      setDeviceOpen(false);
      setDeviceForm({
        name: "",
        deviceCode: "",
        category: "",
        bodyRegion: "",
        description: "",
      });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to add device", {
        variant: "error",
      });
    },
  });

  const updateDeviceMutation = useMutation({
    mutationFn: ({
      deviceId,
      data,
    }: {
      deviceId: string;
      data: UpdateDeviceRequest;
    }) => researchPartnersApi.updateDevice(id!, deviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      enqueueSnackbar("Device updated", { variant: "success" });
      setEditDeviceOpen(false);
      setSelectedDevice(null);
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to update device", {
        variant: "error",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: (deviceId: string) =>
      researchPartnersApi.deleteDevice(id!, deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["research-partner", id] });
      enqueueSnackbar("Device deleted", { variant: "success" });
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message || "Failed to delete device", {
        variant: "error",
      });
    },
  });

  const handleOpenEdit = () => {
    if (partner) {
      setEditForm({
        name: partner.name,
        contactEmail: partner.contactEmail,
        description: partner.description,
        website: partner.website,
        logoUrl: partner.logoUrl,
      });
    }
    setEditOpen(true);
  };

  const handleEditAffiliation = (affiliationId: string) => {
    const aff = partner?.affiliations.find((a) => a.id === affiliationId);
    if (aff) {
      setAffiliationForm({
        tenantId: aff.tenantId,
        status: aff.status,
        dataSharingLevel: aff.dataSharingLevel,
        notes: aff.notes || "",
      });
      setSelectedAffiliation(affiliationId);
      setEditAffiliationOpen(true);
    }
  };

  const handleEditDevice = (deviceId: string) => {
    const device = partner?.devices.find((d) => d.id === deviceId);
    if (device) {
      setDeviceForm({
        name: device.name,
        deviceCode: device.deviceCode,
        category: device.category || "",
        bodyRegion: device.bodyRegion || "",
        description: "",
      });
      setSelectedDevice(deviceId);
      setEditDeviceOpen(true);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Skeleton height={60} />
        <Skeleton height={200} />
        <Skeleton height={300} />
      </Box>
    );
  }

  if (!partner) {
    return (
      <Box>
        <Alert severity="error">Partner not found</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate("/research-partners")}
          sx={{ mt: 2 }}
        >
          Back to Partners
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => navigate("/research-partners")}>
            <ArrowBack />
          </IconButton>
          {partner.logoUrl ? (
            <Box
              component="img"
              src={partner.logoUrl}
              alt={partner.name}
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1,
                objectFit: "contain",
              }}
            />
          ) : (
            <Box
              sx={{
                width: 56,
                height: 56,
                borderRadius: 1,
                bgcolor: "primary.light",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Business sx={{ fontSize: 32, color: "primary.main" }} />
            </Box>
          )}
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Typography variant="h5" fontWeight={600}>
                {partner.name}
              </Typography>
              <Chip
                icon={partner.isActive ? <CheckCircle /> : <Block />}
                label={partner.isActive ? "Active" : "Inactive"}
                color={partner.isActive ? "success" : "default"}
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary">
              {partner.slug} {partner.website && `| ${partner.website}`}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button startIcon={<Edit />} onClick={handleOpenEdit}>
            Edit
          </Button>
          {partner.isActive ? (
            <Button
              color="warning"
              onClick={() => deactivateMutation.mutate()}
              disabled={deactivateMutation.isPending}
            >
              Deactivate
            </Button>
          ) : (
            <Button
              variant="contained"
              color="success"
              onClick={() => activateMutation.mutate()}
              disabled={activateMutation.isPending}
            >
              Activate
            </Button>
          )}
        </Box>
      </Box>

      {/* Stats Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Card sx={{ p: 2, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Business color="primary" />
            <Typography variant="body2" color="text.secondary">
              Affiliated Clinics
            </Typography>
          </Box>
          <Typography variant="h4">
            {partner.affiliations.filter((a) => a.status === "Active").length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {partner.affiliations.filter((a) => a.status === "Pending").length}{" "}
            pending
          </Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Devices color="info" />
            <Typography variant="body2" color="text.secondary">
              Devices
            </Typography>
          </Box>
          <Typography variant="h4">
            {partner.devices.filter((d) => d.isActive).length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {partner.devices.reduce((sum, d) => sum + d.usageCount, 0)} total
            uses
          </Typography>
        </Card>
        <Card sx={{ p: 2, flex: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Biotech color="secondary" />
            <Typography variant="body2" color="text.secondary">
              Studies
            </Typography>
          </Box>
          <Typography variant="h4">
            {partner.studies.filter((s) => s.status === "Active").length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {partner.studies.reduce((sum, s) => sum + s.currentEnrollment, 0)}{" "}
            enrolled
          </Typography>
        </Card>
      </Box>

      {/* Tabs */}
      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="Overview" />
          <Tab label={`Affiliations (${partner.affiliations.length})`} />
          <Tab label={`Devices (${partner.devices.length})`} />
          <Tab label={`Studies (${partner.studies.length})`} />
        </Tabs>

        {/* Overview Tab */}
        {tab === 0 && (
          <Box sx={{ p: 3 }}>
            <Box
              sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}
            >
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Description
                </Typography>
                <Typography>
                  {partner.description || "No description"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Contact Email
                </Typography>
                <Typography>{partner.contactEmail || "-"}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Website
                </Typography>
                {partner.website ? (
                  <Typography
                    component="a"
                    href={partner.website}
                    target="_blank"
                    rel="noopener"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    {partner.website} <LinkIcon fontSize="small" />
                  </Typography>
                ) : (
                  <Typography>-</Typography>
                )}
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  Created
                </Typography>
                <Typography>
                  {new Date(partner.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Affiliations Tab */}
        {tab === 1 && (
          <Box>
            <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button
                startIcon={<Add />}
                onClick={() => setAffiliationOpen(true)}
              >
                Add Clinic
              </Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Clinic</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Data Sharing</TableCell>
                  <TableCell>Approved</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partner.affiliations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No clinic affiliations yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  partner.affiliations.map((aff) => (
                    <TableRow key={aff.id}>
                      <TableCell>
                        <Typography fontWeight={500}>
                          {aff.tenantName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {aff.tenantSlug}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={aff.status}
                          size="small"
                          color={
                            aff.status === "Active"
                              ? "success"
                              : aff.status === "Pending"
                                ? "warning"
                                : "default"
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={aff.dataSharingLevel}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        {aff.approvedAt
                          ? new Date(aff.approvedAt).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{
                            maxWidth: 200,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {aff.notes || "-"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditAffiliation(aff.id)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (
                              confirm(
                                `Remove affiliation with ${aff.tenantName}?`,
                              )
                            ) {
                              deleteAffiliationMutation.mutate(aff.id);
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Devices Tab */}
        {tab === 2 && (
          <Box>
            <Box sx={{ p: 2, display: "flex", justifyContent: "flex-end" }}>
              <Button startIcon={<Add />} onClick={() => setDeviceOpen(true)}>
                Add Device
              </Button>
            </Box>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Device</TableCell>
                  <TableCell>Code</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Body Region</TableCell>
                  <TableCell align="center">Usage</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {partner.devices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        No devices registered yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  partner.devices.map((device) => (
                    <TableRow key={device.id}>
                      <TableCell>
                        <Typography fontWeight={500}>{device.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {device.deviceCode}
                        </Typography>
                      </TableCell>
                      <TableCell>{device.category || "-"}</TableCell>
                      <TableCell>{device.bodyRegion || "-"}</TableCell>
                      <TableCell align="center">
                        <Chip
                          label={device.usageCount}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={device.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={device.isActive ? "success" : "default"}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleEditDevice(device.id)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (confirm(`Delete device ${device.name}?`)) {
                              deleteDeviceMutation.mutate(device.id);
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Studies Tab */}
        {tab === 3 && (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Study</TableCell>
                <TableCell>Protocol ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Dates</TableCell>
                <TableCell align="center">Enrollment</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {partner.studies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No studies yet
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                partner.studies.map((study) => (
                  <TableRow key={study.id}>
                    <TableCell>
                      <Typography fontWeight={500}>{study.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {study.protocolId || "-"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={study.status}
                        size="small"
                        color={
                          study.status === "Active"
                            ? "success"
                            : study.status === "Completed"
                              ? "info"
                              : study.status === "Paused"
                                ? "warning"
                                : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {study.startDate && (
                        <Typography variant="body2">
                          {new Date(study.startDate).toLocaleDateString()}
                          {study.endDate &&
                            ` - ${new Date(study.endDate).toLocaleDateString()}`}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Typography>
                        {study.currentEnrollment} / {study.targetEnrollment}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Edit Partner Dialog */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Partner</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Partner Name"
              value={editForm.name || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, name: e.target.value })
              }
            />
            <TextField
              label="Contact Email"
              type="email"
              value={editForm.contactEmail || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, contactEmail: e.target.value })
              }
            />
            <TextField
              label="Website"
              value={editForm.website || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, website: e.target.value })
              }
            />
            <TextField
              label="Logo URL"
              value={editForm.logoUrl || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, logoUrl: e.target.value })
              }
            />
            <TextField
              label="Description"
              multiline
              rows={3}
              value={editForm.description || ""}
              onChange={(e) =>
                setEditForm({ ...editForm, description: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => updateMutation.mutate(editForm)}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Affiliation Dialog */}
      <Dialog
        open={affiliationOpen}
        onClose={() => setAffiliationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Clinic Affiliation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <Autocomplete
              options={availableClinics || []}
              getOptionLabel={(option) => option.name}
              value={
                availableClinics?.find(
                  (c) => c.id === affiliationForm.tenantId,
                ) || null
              }
              onChange={(_, newValue) =>
                setAffiliationForm({
                  ...affiliationForm,
                  tenantId: newValue?.id || "",
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Select Clinic" required />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography>{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.slug}
                    </Typography>
                  </Box>
                </li>
              )}
            />
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select
                value={affiliationForm.status}
                label="Status"
                onChange={(e) =>
                  setAffiliationForm({
                    ...affiliationForm,
                    status: e.target.value,
                  })
                }
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Data Sharing Level</InputLabel>
              <Select
                value={affiliationForm.dataSharingLevel}
                label="Data Sharing Level"
                onChange={(e) =>
                  setAffiliationForm({
                    ...affiliationForm,
                    dataSharingLevel: e.target.value,
                  })
                }
              >
                <MenuItem value="Aggregated">Aggregated (K-anonymity)</MenuItem>
                <MenuItem value="Detailed">Detailed (De-identified)</MenuItem>
                <MenuItem value="Full">Full (All available fields)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              multiline
              rows={2}
              value={affiliationForm.notes}
              onChange={(e) =>
                setAffiliationForm({
                  ...affiliationForm,
                  notes: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAffiliationOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => addAffiliationMutation.mutate(affiliationForm)}
            disabled={
              !affiliationForm.tenantId || addAffiliationMutation.isPending
            }
          >
            {addAffiliationMutation.isPending ? "Adding..." : "Add Affiliation"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Affiliation Dialog */}
      <Dialog
        open={editAffiliationOpen}
        onClose={() => setEditAffiliationOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Affiliation</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select
                value={affiliationForm.status}
                label="Status"
                onChange={(e) =>
                  setAffiliationForm({
                    ...affiliationForm,
                    status: e.target.value,
                  })
                }
              >
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Revoked">Revoked</MenuItem>
                <MenuItem value="Suspended">Suspended</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Data Sharing Level</InputLabel>
              <Select
                value={affiliationForm.dataSharingLevel}
                label="Data Sharing Level"
                onChange={(e) =>
                  setAffiliationForm({
                    ...affiliationForm,
                    dataSharingLevel: e.target.value,
                  })
                }
              >
                <MenuItem value="Aggregated">Aggregated (K-anonymity)</MenuItem>
                <MenuItem value="Detailed">Detailed (De-identified)</MenuItem>
                <MenuItem value="Full">Full (All available fields)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Notes"
              multiline
              rows={2}
              value={affiliationForm.notes}
              onChange={(e) =>
                setAffiliationForm({
                  ...affiliationForm,
                  notes: e.target.value,
                })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditAffiliationOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedAffiliation) {
                updateAffiliationMutation.mutate({
                  affiliationId: selectedAffiliation,
                  data: {
                    status: affiliationForm.status,
                    dataSharingLevel: affiliationForm.dataSharingLevel,
                    notes: affiliationForm.notes,
                  },
                });
              }
            }}
            disabled={updateAffiliationMutation.isPending}
          >
            {updateAffiliationMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Device Dialog */}
      <Dialog
        open={deviceOpen}
        onClose={() => setDeviceOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Device</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Device Name"
              required
              value={deviceForm.name}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, name: e.target.value })
              }
              placeholder="e.g., Infuse Bone Graft"
            />
            <TextField
              label="Device Code"
              required
              value={deviceForm.deviceCode}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, deviceCode: e.target.value })
              }
              placeholder="e.g., MDT-INF-001"
            />
            <FormControl>
              <InputLabel>Category</InputLabel>
              <Select
                value={deviceForm.category}
                label="Category"
                onChange={(e) =>
                  setDeviceForm({ ...deviceForm, category: e.target.value })
                }
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Spinal Implant">Spinal Implant</MenuItem>
                <MenuItem value="Bone Graft">Bone Graft</MenuItem>
                <MenuItem value="Disc Replacement">Disc Replacement</MenuItem>
                <MenuItem value="Fixation Device">Fixation Device</MenuItem>
                <MenuItem value="Joint Replacement">Joint Replacement</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Body Region</InputLabel>
              <Select
                value={deviceForm.bodyRegion}
                label="Body Region"
                onChange={(e) =>
                  setDeviceForm({ ...deviceForm, bodyRegion: e.target.value })
                }
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Cervical">Cervical</MenuItem>
                <MenuItem value="Thoracic">Thoracic</MenuItem>
                <MenuItem value="Lumbar">Lumbar</MenuItem>
                <MenuItem value="Sacral">Sacral</MenuItem>
                <MenuItem value="Hip">Hip</MenuItem>
                <MenuItem value="Knee">Knee</MenuItem>
                <MenuItem value="Shoulder">Shoulder</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Description"
              multiline
              rows={2}
              value={deviceForm.description}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, description: e.target.value })
              }
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => addDeviceMutation.mutate(deviceForm)}
            disabled={
              !deviceForm.name ||
              !deviceForm.deviceCode ||
              addDeviceMutation.isPending
            }
          >
            {addDeviceMutation.isPending ? "Adding..." : "Add Device"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog
        open={editDeviceOpen}
        onClose={() => setEditDeviceOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Device</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Device Name"
              required
              value={deviceForm.name}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, name: e.target.value })
              }
            />
            <TextField
              label="Device Code"
              required
              value={deviceForm.deviceCode}
              onChange={(e) =>
                setDeviceForm({ ...deviceForm, deviceCode: e.target.value })
              }
            />
            <FormControl>
              <InputLabel>Category</InputLabel>
              <Select
                value={deviceForm.category}
                label="Category"
                onChange={(e) =>
                  setDeviceForm({ ...deviceForm, category: e.target.value })
                }
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Spinal Implant">Spinal Implant</MenuItem>
                <MenuItem value="Bone Graft">Bone Graft</MenuItem>
                <MenuItem value="Disc Replacement">Disc Replacement</MenuItem>
                <MenuItem value="Fixation Device">Fixation Device</MenuItem>
                <MenuItem value="Joint Replacement">Joint Replacement</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl>
              <InputLabel>Body Region</InputLabel>
              <Select
                value={deviceForm.bodyRegion}
                label="Body Region"
                onChange={(e) =>
                  setDeviceForm({ ...deviceForm, bodyRegion: e.target.value })
                }
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="Cervical">Cervical</MenuItem>
                <MenuItem value="Thoracic">Thoracic</MenuItem>
                <MenuItem value="Lumbar">Lumbar</MenuItem>
                <MenuItem value="Sacral">Sacral</MenuItem>
                <MenuItem value="Hip">Hip</MenuItem>
                <MenuItem value="Knee">Knee</MenuItem>
                <MenuItem value="Shoulder">Shoulder</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDeviceOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              if (selectedDevice) {
                updateDeviceMutation.mutate({
                  deviceId: selectedDevice,
                  data: {
                    name: deviceForm.name,
                    deviceCode: deviceForm.deviceCode,
                    category: deviceForm.category || undefined,
                    bodyRegion: deviceForm.bodyRegion || undefined,
                  },
                });
              }
            }}
            disabled={updateDeviceMutation.isPending}
          >
            {updateDeviceMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
