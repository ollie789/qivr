import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Alert,
} from "@mui/material";
import { CheckCircle, Warning, Error as ErrorIcon } from "@mui/icons-material";
import { LoadingSpinner } from "@qivr/design-system";
import { Document } from "../../services/documentApi";

interface OCRResultsViewerProps {
  document: Document;
}

export default function OCRResultsViewer({ document }: OCRResultsViewerProps) {
  const getStatusIcon = () => {
    if (document.status === "processing") {
      return <LoadingSpinner size={20} />;
    }
    if (
      document.status === "ready" &&
      document.confidenceScore &&
      document.confidenceScore > 80
    ) {
      return <CheckCircle color="success" />;
    }
    if (
      document.status === "ready" &&
      document.confidenceScore &&
      document.confidenceScore > 60
    ) {
      return <Warning color="warning" />;
    }
    if (document.status === "failed") {
      return <ErrorIcon color="error" />;
    }
    return <Warning color="warning" />;
  };

  const getStatusMessage = () => {
    if (document.status === "processing") {
      return "OCR processing in progress...";
    }
    if (document.status === "failed") {
      return "OCR processing failed. Please review manually.";
    }
    if (!document.confidenceScore) {
      return "OCR not yet completed";
    }
    if (document.confidenceScore > 80) {
      return "High confidence - Data extracted successfully";
    }
    if (document.confidenceScore > 60) {
      return "Medium confidence - Please verify extracted data";
    }
    return "Low confidence - Manual review recommended";
  };

  const getSeverity = (): "success" | "warning" | "error" | "info" => {
    if (document.status === "processing") return "info";
    if (document.status === "failed") return "error";
    if (!document.confidenceScore) return "info";
    if (document.confidenceScore > 80) return "success";
    if (document.confidenceScore > 60) return "warning";
    return "error";
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          {getStatusIcon()}
          <Typography variant="h6">OCR Results</Typography>
          {document.confidenceScore && (
            <Chip
              label={`${document.confidenceScore.toFixed(1)}% confidence`}
              size="small"
              color={
                document.confidenceScore > 80
                  ? "success"
                  : document.confidenceScore > 60
                    ? "warning"
                    : "error"
              }
            />
          )}
        </Box>

        <Alert severity={getSeverity()} sx={{ mb: 2 }}>
          {getStatusMessage()}
        </Alert>

        {document.status === "ready" && (
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Extracted Patient Name
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {document.extractedPatientName || "Not detected"}
              </Typography>
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary">
                Extracted Date of Birth
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {document.extractedDob
                  ? new Date(document.extractedDob).toLocaleDateString()
                  : "Not detected"}
              </Typography>
            </Grid>

            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Selected Patient
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {document.patientName || "Unknown"}
              </Typography>
            </Grid>

            {document.extractedPatientName &&
              document.patientName &&
              document.extractedPatientName.toLowerCase() !==
                document.patientName.toLowerCase() && (
                <Grid size={12}>
                  <Alert severity="warning">
                    ⚠️ Extracted name doesn&apos;t match selected patient.
                    Please verify.
                  </Alert>
                </Grid>
              )}

            {document.extractedText && (
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Extracted Text
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    p: 2,
                    bgcolor: "grey.50",
                    borderRadius: 1,
                    maxHeight: 300,
                    overflow: "auto",
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {document.extractedText}
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
