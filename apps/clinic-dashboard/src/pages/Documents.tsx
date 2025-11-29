import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Menu,
  ListItemIcon,
  ListItemText,
  Grid,
  Tabs,
  Tab,
  Divider,
  Autocomplete,
  Alert,
} from "@mui/material";
import {
  Add,
  MoreVert,
  Download,
  Visibility,
  Delete,
  ViewModule,
  ViewList,
  Send,
  LocalHospital,
  Science,
  MedicalServices,
  Assignment,
  AttachFile,
  CheckCircle,
  Schedule,
  Warning,
  Description,
  Pending,
  Done,
} from "@mui/icons-material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { documentApi, Document } from "../services/documentApi";
import {
  referralApi,
  CreateReferralRequest,
  REFERRAL_TYPES,
  REFERRAL_PRIORITIES,
  REFERRAL_STATUSES,
  COMMON_SPECIALTIES,
  ReferralType,
  ReferralPriority,
} from "../services/referralApi";
import type { Patient } from "../services/patientApi";
import { patientApi } from "../services/patientApi";
import {
  SearchBar,
  ConfirmDialog,
  PageHeader,
  AuraButton,
  AuraEmptyState,
  FilterChips,
  AuraDocumentCard,
  auraTokens,
  TableLabelDisplayedRows,
  FormSection,
  DialogSection,
  FormDialog,
  AuraCard,
  AuraGlassStatCard,
} from "@qivr/design-system";

const DOCUMENT_TYPES = [
  { value: "", label: "All Types" },
  { value: "referral", label: "Referral" },
  { value: "consent", label: "Consent" },
  { value: "progress_note", label: "Progress Note" },
  { value: "assessment", label: "Assessment" },
  { value: "lab_report", label: "Lab Report" },
  { value: "imaging", label: "Imaging/X-Ray" },
  { value: "prescription", label: "Prescription" },
  { value: "insurance", label: "Insurance" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "treatment_plan", label: "Treatment Plan" },
  { value: "invoice", label: "Invoice/Receipt" },
  { value: "correspondence", label: "Correspondence" },
  { value: "other", label: "Other" },
];

const STATUS_COLORS: Record<
  string,
  "default" | "primary" | "success" | "error" | "warning"
> = {
  processing: "primary",
  ready: "success",
  failed: "error",
};

interface TabPanelProps {
  children?: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Documents() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  // Tab state
  const [activeTab, setActiveTab] = useState(0);

  // Document state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null,
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);

  // Referral dialog state
  const [referralDialogOpen, setReferralDialogOpen] = useState(false);
  const [referralForm, setReferralForm] = useState<
    Partial<CreateReferralRequest>
  >({
    type: "Specialist",
    priority: "Routine",
    specialty: "",
  });

  // Referral filters
  const [referralStatusFilter, setReferralStatusFilter] = useState("");

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["documents", documentType, status],
    queryFn: () =>
      documentApi.list({
        documentType: documentType || undefined,
        status: status || undefined,
      }),
    refetchInterval: 30000,
  });

  // Fetch referrals
  const { data: referrals = [], isLoading: referralsLoading } = useQuery({
    queryKey: ["referrals", referralStatusFilter],
    queryFn: () =>
      referralApi.getAll({
        status: (referralStatusFilter as any) || undefined,
      }),
  });

  // Fetch referral stats
  const { data: referralStats } = useQuery({
    queryKey: ["referralStats"],
    queryFn: () => referralApi.getStats(),
  });

  // Fetch patients for referral dialog
  const { data: patientsResponse } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientApi.getPatients({ limit: 500 }),
  });
  const patients: Patient[] = patientsResponse?.data || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      enqueueSnackbar("Document deleted successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      enqueueSnackbar("Failed to delete document", { variant: "error" });
    },
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { url } = await documentApi.getDownloadUrl(id);
      window.open(url, "_blank");
    },
    onError: () => {
      enqueueSnackbar("Failed to download document", { variant: "error" });
    },
  });

  // Create referral mutation
  const createReferralMutation = useMutation({
    mutationFn: (request: CreateReferralRequest) => referralApi.create(request),
    onSuccess: (referral) => {
      enqueueSnackbar("Referral created successfully", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
      setReferralDialogOpen(false);
      setReferralForm({
        type: "Specialist",
        priority: "Routine",
        specialty: "",
      });
      // If we had a document selected, attach it to the referral
      if (selectedDocument) {
        referralApi.attachDocument(referral.id, selectedDocument.id, false);
      }
    },
    onError: () => {
      enqueueSnackbar("Failed to create referral", { variant: "error" });
    },
  });

  // Send referral mutation
  const sendReferralMutation = useMutation({
    mutationFn: (id: string) => referralApi.send(id),
    onSuccess: () => {
      enqueueSnackbar("Referral sent and patient notified", {
        variant: "success",
      });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
    },
    onError: () => {
      enqueueSnackbar("Failed to send referral", { variant: "error" });
    },
  });

  // Update referral status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: string;
      notes?: string;
    }) => referralApi.updateStatus(id, status as any, notes),
    onSuccess: () => {
      enqueueSnackbar("Referral status updated", { variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["referrals"] });
      queryClient.invalidateQueries({ queryKey: ["referralStats"] });
    },
    onError: () => {
      enqueueSnackbar("Failed to update referral status", { variant: "error" });
    },
  });

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    document: Document,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(document);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDownload = () => {
    if (selectedDocument) {
      downloadMutation.mutate(selectedDocument.id);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const confirmDelete = () => {
    if (selectedDocument) {
      deleteMutation.mutate(selectedDocument.id);
    }
  };

  const handleCreateReferralFromDocument = () => {
    if (selectedDocument) {
      // Pre-fill referral form based on document type
      const docType = selectedDocument.documentType.toLowerCase();
      let referralType: ReferralType = "Specialist";
      let specialty = "";

      if (
        docType.includes("imaging") ||
        docType.includes("x-ray") ||
        docType.includes("mri")
      ) {
        referralType = "Imaging";
        specialty = "Radiology";
      } else if (docType.includes("lab") || docType.includes("pathology")) {
        referralType = "Laboratory";
        specialty = "Pathology";
      } else if (docType.includes("physio") || docType.includes("therapy")) {
        referralType = "Therapy";
        specialty = "Physiotherapy";
      }

      setReferralForm({
        type: referralType,
        priority: "Routine",
        specialty,
        patientId: selectedDocument.patientId,
        clinicalHistory: selectedDocument.extractedText?.substring(0, 500),
      });
      setReferralDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleSubmitReferral = () => {
    if (!referralForm.patientId || !referralForm.specialty) {
      enqueueSnackbar("Please fill in required fields", { variant: "warning" });
      return;
    }
    createReferralMutation.mutate(referralForm as CreateReferralRequest);
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      doc.fileName.toLowerCase().includes(search) ||
      doc.patientName?.toLowerCase().includes(search) ||
      doc.notes?.toLowerCase().includes(search)
    );
  });

  const paginatedDocuments = filteredDocuments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getStatusColor = (status: string) => {
    const found = REFERRAL_STATUSES.find((s) => s.value === status);
    return (found?.color || "default") as
      | "default"
      | "primary"
      | "success"
      | "error"
      | "warning"
      | "info";
  };

  const getPriorityColor = (priority: string) => {
    const found = REFERRAL_PRIORITIES.find((p) => p.value === priority);
    return (found?.color || "default") as
      | "default"
      | "primary"
      | "success"
      | "error"
      | "warning"
      | "info";
  };

  // Get suggested actions based on OCR content
  const getSuggestedActions = (doc: Document) => {
    const actions: {
      label: string;
      icon: React.ReactNode;
      action: () => void;
    }[] = [];
    const text = (doc.extractedText || "").toLowerCase();
    const docType = doc.documentType.toLowerCase();

    // Check for imaging-related content
    if (
      text.includes("x-ray") ||
      text.includes("mri") ||
      text.includes("ct scan") ||
      text.includes("ultrasound") ||
      docType.includes("imaging")
    ) {
      actions.push({
        label: "Create Imaging Referral",
        icon: <Science fontSize="small" />,
        action: () => {
          setSelectedDocument(doc);
          setReferralForm({
            type: "Imaging",
            priority: "Routine",
            specialty: "Radiology",
            patientId: doc.patientId,
            clinicalHistory: doc.extractedText?.substring(0, 500),
          });
          setReferralDialogOpen(true);
        },
      });
    }

    // Check for lab-related content
    if (
      text.includes("blood test") ||
      text.includes("pathology") ||
      text.includes("lab") ||
      docType.includes("lab")
    ) {
      actions.push({
        label: "Create Lab Referral",
        icon: <Science fontSize="small" />,
        action: () => {
          setSelectedDocument(doc);
          setReferralForm({
            type: "Laboratory",
            priority: "Routine",
            specialty: "Pathology",
            patientId: doc.patientId,
            clinicalHistory: doc.extractedText?.substring(0, 500),
          });
          setReferralDialogOpen(true);
        },
      });
    }

    // Check for specialist referral indicators
    if (
      text.includes("refer") ||
      text.includes("specialist") ||
      text.includes("consult")
    ) {
      actions.push({
        label: "Create Specialist Referral",
        icon: <LocalHospital fontSize="small" />,
        action: () => {
          setSelectedDocument(doc);
          setReferralForm({
            type: "Specialist",
            priority: "Routine",
            specialty: "",
            patientId: doc.patientId,
            clinicalHistory: doc.extractedText?.substring(0, 500),
          });
          setReferralDialogOpen(true);
        },
      });
    }

    // Always add generic referral option
    if (actions.length === 0) {
      actions.push({
        label: "Create Referral",
        icon: <MedicalServices fontSize="small" />,
        action: () => {
          setSelectedDocument(doc);
          setReferralForm({
            type: "Specialist",
            priority: "Routine",
            specialty: "",
            patientId: doc.patientId,
          });
          setReferralDialogOpen(true);
        },
      });
    }

    return actions;
  };

  return (
    <Box
      sx={{
        p: auraTokens.responsivePadding.page,
        maxWidth: auraTokens.responsive.contentWide,
        mx: "auto",
      }}
    >
      <PageHeader
        title="Documents & Referrals"
        description="Manage patient documents and referral workflows"
        actions={
          <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <AuraButton
              variant="outlined"
              size="large"
              startIcon={<Send />}
              onClick={() => {
                setSelectedDocument(null);
                setReferralForm({
                  type: "Specialist",
                  priority: "Routine",
                  specialty: "",
                });
                setReferralDialogOpen(true);
              }}
              sx={{ px: 3, py: 1.5 }}
            >
              New Referral
            </AuraButton>
            <AuraButton
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate("/documents/upload")}
              sx={{ px: 3, py: 1.5, fontWeight: 600 }}
            >
              Upload Document
            </AuraButton>
          </Box>
        }
      />

      {/* Stats Overview */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Total Documents"
            value={documents.length.toString()}
            icon={<Description />}
            trend={
              documents.filter((d) => d.status === "processing").length > 0
                ? {
                    value: documents.filter((d) => d.status === "processing")
                      .length,
                    isPositive: true,
                    label: "processing",
                  }
                : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Active Referrals"
            value={(
              (referralStats?.pendingReferrals || 0) +
              (referralStats?.sentReferrals || 0)
            ).toString()}
            icon={<Pending />}
            trend={
              referralStats?.pendingReferrals
                ? {
                    value: referralStats.pendingReferrals,
                    isPositive: false,
                    label: "pending",
                  }
                : undefined
            }
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Awaiting Results"
            value={referrals
              .filter((r) => r.status === "Completed")
              .length.toString()}
            icon={<Schedule />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Completed"
            value={(referralStats?.completedReferrals || 0).toString()}
            icon={<Done />}
            trend={
              referralStats?.avgCompletionDays
                ? {
                    value: referralStats.avgCompletionDays,
                    isPositive: true,
                    label: "avg days",
                  }
                : undefined
            }
          />
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: auraTokens.borderRadius.md }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ borderBottom: 1, borderColor: "divider", px: 2 }}
        >
          <Tab label="Documents" icon={<AttachFile />} iconPosition="start" />
          <Tab label="Referrals" icon={<Send />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Documents Tab */}
      <TabPanel value={activeTab} index={0}>
        <Paper
          sx={{
            mb: 3,
            p: 3,
            borderRadius: auraTokens.borderRadius.md,
            boxShadow: 2,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 4 }}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search documents..."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Document Type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="processing">Processing</MenuItem>
                <MenuItem value="ready">Ready</MenuItem>
                <MenuItem value="failed">Failed</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, md: 2 }}>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Box
                  sx={{
                    display: "flex",
                    gap: 0.5,
                    bgcolor: "action.hover",
                    borderRadius: auraTokens.borderRadius.sm,
                    p: 0.5,
                  }}
                >
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("grid")}
                    sx={{
                      bgcolor:
                        viewMode === "grid" ? "primary.main" : "transparent",
                      color: viewMode === "grid" ? "white" : "text.secondary",
                      "&:hover": {
                        bgcolor:
                          viewMode === "grid" ? "primary.dark" : "action.hover",
                      },
                    }}
                  >
                    <ViewModule fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("list")}
                    sx={{
                      bgcolor:
                        viewMode === "list" ? "primary.main" : "transparent",
                      color: viewMode === "list" ? "white" : "text.secondary",
                      "&:hover": {
                        bgcolor:
                          viewMode === "list" ? "primary.dark" : "action.hover",
                      },
                    }}
                  >
                    <ViewList fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Active Filters */}
          {(searchTerm || documentType || status) && (
            <Box sx={{ mt: 2 }}>
              <FilterChips
                filters={[
                  ...(searchTerm
                    ? [{ key: "search", label: `Search: ${searchTerm}` }]
                    : []),
                  ...(documentType
                    ? [
                        {
                          key: "type",
                          label: `Type: ${DOCUMENT_TYPES.find((t) => t.value === documentType)?.label}`,
                        },
                      ]
                    : []),
                  ...(status
                    ? [{ key: "status", label: `Status: ${status}` }]
                    : []),
                ]}
                onRemove={(key) => {
                  if (key === "search") setSearchTerm("");
                  if (key === "type") setDocumentType("");
                  if (key === "status") setStatus("");
                }}
                onClearAll={() => {
                  setSearchTerm("");
                  setDocumentType("");
                  setStatus("");
                }}
              />
            </Box>
          )}
        </Paper>

        {viewMode === "grid" ? (
          <Box>
            {isLoading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box
                      sx={{
                        height: 200,
                        bgcolor: "action.hover",
                        borderRadius: 2,
                      }}
                    />
                  </Grid>
                ))}
              </Grid>
            ) : paginatedDocuments.length === 0 ? (
              <Paper sx={{ p: 4, borderRadius: 2 }}>
                <AuraEmptyState
                  title="No documents found"
                  description={
                    searchTerm || documentType || status
                      ? "Try adjusting your filters"
                      : "No documents have been uploaded yet"
                  }
                />
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {paginatedDocuments.map((doc) => (
                  <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                    <AuraCard
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <AuraDocumentCard
                        id={doc.id}
                        name={doc.fileName}
                        type={doc.fileName.split(".").pop() || "file"}
                        size={formatFileSize(doc.fileSize)}
                        uploadedAt={doc.createdAt}
                        uploadedBy={doc.assignedToName}
                        category={doc.documentType}
                        onView={() => {
                          setSelectedDocument(doc);
                          if (doc.extractedText) {
                            setOcrDialogOpen(true);
                          }
                        }}
                        onDownload={() => downloadMutation.mutate(doc.id)}
                      />
                      {/* Smart Actions */}
                      {doc.extractedText && (
                        <Box sx={{ px: 2, pb: 2, mt: "auto" }}>
                          <Divider sx={{ my: 1 }} />
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 1, display: "block" }}
                          >
                            Suggested Actions
                          </Typography>
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {getSuggestedActions(doc).map((action, idx) => (
                              <Chip
                                key={idx}
                                label={action.label}
                                icon={action.icon as React.ReactElement}
                                size="small"
                                onClick={action.action}
                                sx={{ cursor: "pointer" }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </AuraCard>
                  </Grid>
                ))}
              </Grid>
            )}
            <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
              <TablePagination
                component="div"
                count={filteredDocuments.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                labelDisplayedRows={({ from, to, count }) => (
                  <TableLabelDisplayedRows from={from} to={to} count={count} />
                )}
              />
            </Box>
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{ borderRadius: auraTokens.borderRadius.md, boxShadow: 2 }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>File Name</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Smart Actions</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography variant="body2" color="text.secondary">
                        Loading documents...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : paginatedDocuments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                      <AuraEmptyState
                        title="No documents found"
                        description={
                          searchTerm || documentType || status
                            ? "Try adjusting your filters"
                            : "No documents have been uploaded yet"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedDocuments.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {doc.fileName}
                          </Typography>
                          {doc.isUrgent && (
                            <Chip
                              label="Urgent"
                              size="small"
                              color="error"
                              sx={{ mt: 0.5 }}
                            />
                          )}
                          {doc.extractedText && (
                            <Chip
                              label="OCR"
                              size="small"
                              color="info"
                              sx={{ mt: 0.5, ml: 0.5 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{doc.patientName || "Unknown"}</TableCell>
                      <TableCell>
                        <Chip
                          label={doc.documentType}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                      <TableCell>
                        <Chip
                          label={doc.status}
                          size="small"
                          color={STATUS_COLORS[doc.status] || "default"}
                        />
                      </TableCell>
                      <TableCell>
                        {doc.extractedText && (
                          <Box
                            sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                          >
                            {getSuggestedActions(doc)
                              .slice(0, 2)
                              .map((action, idx) => (
                                <Chip
                                  key={idx}
                                  label={action.label}
                                  icon={action.icon as React.ReactElement}
                                  size="small"
                                  onClick={action.action}
                                  sx={{ cursor: "pointer" }}
                                />
                              ))}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {doc.extractedText && (
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedDocument(doc);
                              setOcrDialogOpen(true);
                            }}
                            title="View OCR Text"
                          >
                            <Visibility />
                          </IconButton>
                        )}
                        <IconButton
                          size="small"
                          onClick={(e) => handleMenuOpen(e, doc)}
                        >
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              component="div"
              count={filteredDocuments.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              labelDisplayedRows={({ from, to, count }) => (
                <TableLabelDisplayedRows from={from} to={to} count={count} />
              )}
            />
          </TableContainer>
        )}
      </TabPanel>

      {/* Referrals Tab */}
      <TabPanel value={activeTab} index={1}>
        <Paper
          sx={{
            mb: 3,
            p: 3,
            borderRadius: auraTokens.borderRadius.md,
            boxShadow: 2,
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search referrals..."
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={referralStatusFilter}
                onChange={(e) => setReferralStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                {REFERRAL_STATUSES.map((s) => (
                  <MenuItem key={s.value} value={s.value}>
                    {s.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer
          component={Paper}
          sx={{ borderRadius: auraTokens.borderRadius.md, boxShadow: 2 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Specialty</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>External Provider</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {referralsLoading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Typography variant="body2" color="text.secondary">
                      Loading referrals...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : referrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ border: 0, p: 0 }}>
                    <AuraEmptyState
                      title="No referrals found"
                      description="Create your first referral to get started"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                referrals.map((referral) => (
                  <TableRow key={referral.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {referral.patientName || "Unknown Patient"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={referral.typeName}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{referral.specialty}</TableCell>
                    <TableCell>
                      <Chip
                        label={referral.priorityName}
                        size="small"
                        color={getPriorityColor(referral.priority)}
                        icon={
                          referral.priority === "Emergency" ? (
                            <Warning fontSize="small" />
                          ) : undefined
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={referral.statusName}
                        size="small"
                        color={getStatusColor(referral.status)}
                      />
                    </TableCell>
                    <TableCell>
                      {referral.externalProviderName || "-"}
                    </TableCell>
                    <TableCell>
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="right">
                      {referral.status === "Draft" && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            sendReferralMutation.mutate(referral.id)
                          }
                          title="Send Referral"
                          color="primary"
                        >
                          <Send fontSize="small" />
                        </IconButton>
                      )}
                      {referral.status === "Sent" && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: referral.id,
                              status: "Acknowledged",
                            })
                          }
                          title="Mark Acknowledged"
                          color="info"
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                      )}
                      {referral.status === "Acknowledged" && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: referral.id,
                              status: "Scheduled",
                            })
                          }
                          title="Mark Scheduled"
                          color="primary"
                        >
                          <Schedule fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/referrals/${referral.id}`)}
                        title="View Details"
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      {/* Document Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <Download fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCreateReferralFromDocument}>
          <ListItemIcon>
            <Send fontSize="small" />
          </ListItemIcon>
          <ListItemText>Create Referral</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedDocument) {
              navigate(
                `/patients/${selectedDocument.patientId}/medical-records`,
              );
            }
            handleMenuClose();
          }}
        >
          <ListItemIcon>
            <Assignment fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Medical Records</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Document"
        message={`Are you sure you want to delete "${selectedDocument?.fileName}"? This action cannot be undone.`}
        severity="error"
        confirmText="Delete"
      />

      {/* OCR Text Dialog */}
      <FormDialog
        open={ocrDialogOpen}
        onClose={() => setOcrDialogOpen(false)}
        maxWidth="md"
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            Extracted Text - {selectedDocument?.fileName}
            {selectedDocument?.confidenceScore && (
              <Chip
                label={`${Math.round(selectedDocument.confidenceScore)}% confidence`}
                size="small"
                color="success"
              />
            )}
          </Box>
        }
        onSubmit={() => {
          navigator.clipboard.writeText(selectedDocument?.extractedText || "");
          enqueueSnackbar("Text copied to clipboard", { variant: "success" });
        }}
        submitLabel="Copy Text"
        formActionsProps={{ cancelLabel: "Close" }}
      >
        <DialogSection>
          <FormSection
            title="OCR Results"
            description="Text extracted from the document using optical character recognition"
          >
            <Paper
              sx={{
                p: 2,
                bgcolor: "grey.50",
                maxHeight: 400,
                overflow: "auto",
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                fontSize: "0.875rem",
              }}
            >
              {selectedDocument?.extractedText || "No text extracted"}
            </Paper>
          </FormSection>

          {selectedDocument?.extractedPatientName && (
            <FormSection
              title="Extracted Information"
              description="Patient details identified from the document"
            >
              <Typography variant="body2">
                Patient Name: {selectedDocument.extractedPatientName}
              </Typography>
              {selectedDocument.extractedDob && (
                <Typography variant="body2">
                  Date of Birth: {selectedDocument.extractedDob}
                </Typography>
              )}
            </FormSection>
          )}

          {/* Smart Actions in OCR Dialog */}
          {selectedDocument?.extractedText && (
            <FormSection
              title="Quick Actions"
              description="Based on the document content, you can take these actions"
            >
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                {getSuggestedActions(selectedDocument).map((action, idx) => (
                  <AuraButton
                    key={idx}
                    variant="outlined"
                    size="small"
                    startIcon={action.icon}
                    onClick={() => {
                      setOcrDialogOpen(false);
                      action.action();
                    }}
                  >
                    {action.label}
                  </AuraButton>
                ))}
              </Box>
            </FormSection>
          )}
        </DialogSection>
      </FormDialog>

      {/* Create Referral Dialog */}
      <FormDialog
        open={referralDialogOpen}
        onClose={() => setReferralDialogOpen(false)}
        title="Create Referral"
        maxWidth="md"
        onSubmit={handleSubmitReferral}
        submitLabel="Create Referral"
        submitDisabled={!referralForm.patientId || !referralForm.specialty}
      >
        <DialogSection>
          <FormSection
            title="Patient & Referral Type"
            description="Select the patient and type of referral"
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Autocomplete<Patient>
                  options={patients}
                  getOptionLabel={(option) =>
                    `${option.firstName} ${option.lastName}`
                  }
                  value={
                    patients.find(
                      (p: Patient) => p.id === referralForm.patientId,
                    ) || null
                  }
                  onChange={(_, patient) =>
                    setReferralForm({ ...referralForm, patientId: patient?.id })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Patient *" size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Referral Type *"
                  value={referralForm.type || "Specialist"}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      type: e.target.value as ReferralType,
                    })
                  }
                >
                  {REFERRAL_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Priority *"
                  value={referralForm.priority || "Routine"}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      priority: e.target.value as ReferralPriority,
                    })
                  }
                >
                  {REFERRAL_PRIORITIES.map((priority) => (
                    <MenuItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Autocomplete
                  freeSolo
                  options={COMMON_SPECIALTIES}
                  value={referralForm.specialty || ""}
                  onChange={(_, value) =>
                    setReferralForm({ ...referralForm, specialty: value || "" })
                  }
                  onInputChange={(_, value) =>
                    setReferralForm({ ...referralForm, specialty: value })
                  }
                  renderInput={(params) => (
                    <TextField {...params} label="Specialty *" size="small" />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Specific Service"
                  placeholder="e.g., MRI Lumbar Spine, Blood Panel"
                  value={referralForm.specificService || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      specificService: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection
            title="External Provider"
            description="Details of the specialist or service provider"
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Provider Name"
                  value={referralForm.externalProviderName || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      externalProviderName: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Phone"
                  value={referralForm.externalProviderPhone || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      externalProviderPhone: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Email"
                  value={referralForm.externalProviderEmail || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      externalProviderEmail: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Fax"
                  value={referralForm.externalProviderFax || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      externalProviderFax: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Address"
                  value={referralForm.externalProviderAddress || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      externalProviderAddress: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection
            title="Clinical Information"
            description="Relevant clinical details for the referral"
          >
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Reason for Referral"
                  multiline
                  rows={3}
                  value={referralForm.reasonForReferral || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      reasonForReferral: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Clinical History"
                  multiline
                  rows={3}
                  value={referralForm.clinicalHistory || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      clinicalHistory: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Current Medications"
                  multiline
                  rows={2}
                  value={referralForm.currentMedications || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      currentMedications: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Allergies"
                  multiline
                  rows={2}
                  value={referralForm.allergies || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      allergies: e.target.value,
                    })
                  }
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Specific Questions for Specialist"
                  multiline
                  rows={2}
                  value={referralForm.specificQuestions || ""}
                  onChange={(e) =>
                    setReferralForm({
                      ...referralForm,
                      specificQuestions: e.target.value,
                    })
                  }
                />
              </Grid>
            </Grid>
          </FormSection>

          {selectedDocument && (
            <Alert severity="info" sx={{ mt: 2 }}>
              This referral will be linked to document:{" "}
              <strong>{selectedDocument.fileName}</strong>
            </Alert>
          )}
        </DialogSection>
      </FormDialog>
    </Box>
  );
}
