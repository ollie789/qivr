import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  Autocomplete,
  CircularProgress,
} from "@mui/material";
import { CloudUpload, CheckCircle } from "@mui/icons-material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useNavigate } from "react-router-dom";
import { DocumentUploader, OCRResultsViewer } from "../components/documents";
import { documentApi, Document } from "../services/documentApi";
import { patientApi } from "../services/patientApi";
import { PageHeader } from "@qivr/design-system";

const DOCUMENT_TYPES = [
  { value: "referral", label: "Referral" },
  { value: "consent", label: "Consent Form" },
  { value: "progress_note", label: "Progress Note" },
  { value: "assessment", label: "Assessment" },
  { value: "lab_report", label: "Lab Report" },
  { value: "imaging", label: "Imaging/X-Ray" },
  { value: "prescription", label: "Prescription" },
  { value: "insurance", label: "Insurance Document" },
  { value: "discharge_summary", label: "Discharge Summary" },
  { value: "treatment_plan", label: "Treatment Plan" },
  { value: "invoice", label: "Invoice/Receipt" },
  { value: "correspondence", label: "Correspondence" },
  { value: "other", label: "Other" },
];

export default function DocumentUpload() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [documentType, setDocumentType] = useState("referral");
  const [notes, setNotes] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(
    null,
  );

  // Fetch patients for autocomplete
  const { data: patientsResponse, isLoading: loadingPatients } = useQuery({
    queryKey: ["patients"],
    queryFn: () => patientApi.getPatients({ limit: 200 }),
  });

  const patients = patientsResponse?.data || [];

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedPatient) {
        throw new Error("File and patient are required");
      }

      return documentApi.upload({
        file: selectedFile,
        patientId: selectedPatient.id,
        documentType,
        notes: notes || undefined,
        isUrgent,
      });
    },
    onSuccess: (document) => {
      console.log("[DocumentUpload] Upload success:", document);
      enqueueSnackbar(
        "Document uploaded successfully! OCR processing started.",
        { variant: "success" },
      );
      setUploadedDocument(document);
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      // Poll for OCR results
      console.log(
        "[DocumentUpload] Starting OCR polling for document:",
        document.id,
      );
      const pollInterval = setInterval(async () => {
        try {
          console.log("[DocumentUpload] Polling document status...");
          const updated = await documentApi.getById(document.id);
          console.log(
            "[DocumentUpload] Document status:",
            updated.status,
            updated,
          );
          setUploadedDocument(updated);

          if (updated.status === "ready" || updated.status === "failed") {
            console.log(
              "[DocumentUpload] OCR complete, stopping poll. Status:",
              updated.status,
            );
            clearInterval(pollInterval);
          }
        } catch (error) {
          console.error("[DocumentUpload] Polling error:", error);
          clearInterval(pollInterval);
        }
      }, 3000);

      // Stop polling after 30 seconds
      setTimeout(() => {
        console.log("[DocumentUpload] Polling timeout reached");
        clearInterval(pollInterval);
      }, 30000);
    },
    onError: (error: any) => {
      enqueueSnackbar(error.message || "Upload failed", { variant: "error" });
    },
  });

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedPatient(null);
    setDocumentType("referral");
    setNotes("");
    setIsUrgent(false);
    setUploadedDocument(null);
  };

  const canUpload =
    selectedFile && selectedPatient && !uploadMutation.isPending;

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: "auto" }}>
      <PageHeader
        title="Upload Document"
        description="Upload patient documents with automatic OCR extraction and intelligent classification"
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
            {uploadedDocument ? (
              <Box>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 3,
                    p: 2,
                    bgcolor: "success.50",
                    borderRadius: 2,
                    border: "2px solid",
                    borderColor: "success.main",
                  }}
                >
                  <CheckCircle color="success" sx={{ fontSize: 40 }} />
                  <Box>
                    <Typography variant="h5" fontWeight={600}>
                      Upload Complete!
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Document processed successfully
                    </Typography>
                  </Box>
                </Box>

                <OCRResultsViewer document={uploadedDocument} />

                <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate("/documents")}
                  >
                    View All Documents
                  </Button>
                  <Button variant="outlined" size="large" onClick={handleReset}>
                    Upload Another
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Box
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      1
                    </Box>
                    Select Patient
                  </Typography>
                  <Autocomplete
                    options={patients}
                    getOptionLabel={(option) =>
                      `${option.firstName} ${option.lastName} - ${option.email}`
                    }
                    value={selectedPatient}
                    onChange={(_, newValue) => setSelectedPatient(newValue)}
                    loading={loadingPatients}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Search Patient"
                        placeholder="Type name or email to search..."
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {loadingPatients ? (
                                <CircularProgress size={20} />
                              ) : null}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    sx={{ mt: 2 }}
                  />
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <Box
                      sx={{
                        bgcolor: selectedPatient ? "primary.main" : "grey.300",
                        color: "white",
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                      }}
                    >
                      2
                    </Box>
                    Upload File
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <DocumentUploader
                      onFileSelect={setSelectedFile}
                      disabled={!selectedPatient}
                    />
                  </Box>
                </Box>

                {selectedFile && (
                  <Box>
                    <Typography
                      variant="h6"
                      fontWeight={600}
                      gutterBottom
                      sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                      <Box
                        sx={{
                          bgcolor: "primary.main",
                          color: "white",
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                        }}
                      >
                        3
                      </Box>
                      Document Details
                    </Typography>

                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          select
                          fullWidth
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

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isUrgent}
                              onChange={(e) => setIsUrgent(e.target.checked)}
                              color="error"
                            />
                          }
                          label="Mark as Urgent"
                        />
                      </Grid>

                      <Grid size={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Notes (Optional)"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any additional notes about this document..."
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={
                          uploadMutation.isPending ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <CloudUpload />
                          )
                        }
                        onClick={handleUpload}
                        disabled={!canUpload}
                        sx={{ px: 4, py: 1.5, fontWeight: 600 }}
                      >
                        {uploadMutation.isPending
                          ? "Uploading..."
                          : "Upload Document"}
                      </Button>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={handleReset}
                        disabled={uploadMutation.isPending}
                        sx={{ px: 4, py: 1.5 }}
                      >
                        Reset
                      </Button>
                    </Box>
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper
            sx={{
              p: 3,
              bgcolor: "primary.50",
              borderRadius: 2,
              boxShadow: 2,
              border: "1px solid",
              borderColor: "primary.100",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={600}
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              Upload Guidelines
            </Typography>
            <Box sx={{ mt: 2, "& > *": { mb: 2 } }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Supported Formats
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  PDF, JPG, PNG, DOC, DOCX
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Max File Size
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  50 MB per file
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  OCR Processing
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Documents are automatically scanned to extract patient
                  information, dates, and identifiers.
                </Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Security
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All files are encrypted at rest and in transit. Access is
                  logged for audit purposes.
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
