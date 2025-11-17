import { useState } from 'react';
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
  Alert
} from '@mui/material';
import { CloudUpload, CheckCircle } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import DocumentUploader from '../components/DocumentUploader';
import OCRResultsViewer from '../components/OCRResultsViewer';
import { documentApi, Document } from '../services/documentApi';
import { patientApi } from '../services/patientApi';

const DOCUMENT_TYPES = [
  { value: 'referral', label: 'Referral' },
  { value: 'consent', label: 'Consent Form' },
  { value: 'progress_note', label: 'Progress Note' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'other', label: 'Other' }
];

export default function DocumentUpload() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [documentType, setDocumentType] = useState('referral');
  const [notes, setNotes] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);

  // Fetch patients for autocomplete
  const { data: patients = [], isLoading: loadingPatients } = useQuery({
    queryKey: ['patients'],
    queryFn: async () => {
      const response = await patientApi.getAll();
      return response.data || [];
    }
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedPatient) {
        throw new Error('File and patient are required');
      }

      return documentApi.upload({
        file: selectedFile,
        patientId: selectedPatient.id,
        documentType,
        notes: notes || undefined,
        isUrgent
      });
    },
    onSuccess: (document) => {
      enqueueSnackbar('Document uploaded successfully! OCR processing started.', { variant: 'success' });
      setUploadedDocument(document);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      
      // Poll for OCR results
      const pollInterval = setInterval(async () => {
        try {
          const updated = await documentApi.getById(document.id);
          setUploadedDocument(updated);
          
          if (updated.status === 'ready' || updated.status === 'failed') {
            clearInterval(pollInterval);
          }
        } catch (error) {
          clearInterval(pollInterval);
        }
      }, 3000);

      // Stop polling after 30 seconds
      setTimeout(() => clearInterval(pollInterval), 30000);
    },
    onError: (error: any) => {
      enqueueSnackbar(error.message || 'Upload failed', { variant: 'error' });
    }
  });

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  const handleReset = () => {
    setSelectedFile(null);
    setSelectedPatient(null);
    setDocumentType('referral');
    setNotes('');
    setIsUrgent(false);
    setUploadedDocument(null);
  };

  const canUpload = selectedFile && selectedPatient && !uploadMutation.isPending;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Upload Document
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload patient documents with automatic OCR extraction
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {uploadedDocument ? (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <CheckCircle color="success" />
                  <Typography variant="h6">Upload Complete</Typography>
                </Box>

                <OCRResultsViewer document={uploadedDocument} />

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/documents')}
                  >
                    View All Documents
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleReset}
                  >
                    Upload Another
                  </Button>
                </Box>
              </Box>
            ) : (
              <>
                <Typography variant="h6" gutterBottom>
                  1. Select Patient
                </Typography>
                <Autocomplete
                  options={patients}
                  getOptionLabel={(option) => `${option.firstName} ${option.lastName} - ${option.email}`}
                  value={selectedPatient}
                  onChange={(_, newValue) => setSelectedPatient(newValue)}
                  loading={loadingPatients}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Search Patient"
                      placeholder="Type to search..."
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingPatients ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                    />
                  )}
                  sx={{ mb: 3 }}
                />

                <Typography variant="h6" gutterBottom>
                  2. Upload File
                </Typography>
                <DocumentUploader
                  onFileSelect={setSelectedFile}
                  disabled={!selectedPatient}
                />

                {selectedFile && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      3. Document Details
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
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

                      <Grid item xs={12} sm={6}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={isUrgent}
                              onChange={(e) => setIsUrgent(e.target.checked)}
                            />
                          }
                          label="Mark as Urgent"
                        />
                      </Grid>

                      <Grid item xs={12}>
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

                    <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        startIcon={uploadMutation.isPending ? <CircularProgress size={20} /> : <CloudUpload />}
                        onClick={handleUpload}
                        disabled={!canUpload}
                      >
                        {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={handleReset}
                        disabled={uploadMutation.isPending}
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

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, bgcolor: 'info.50' }}>
            <Typography variant="h6" gutterBottom>
              📋 Upload Guidelines
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Supported Formats:</strong><br />
              PDF, JPG, PNG, DOC, DOCX
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Max File Size:</strong><br />
              50 MB per file
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>OCR Processing:</strong><br />
              Documents are automatically scanned to extract patient information, dates, and identifiers.
            </Typography>
            <Typography variant="body2" paragraph>
              <strong>Security:</strong><br />
              All files are encrypted at rest and in transit. Access is logged for audit purposes.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
