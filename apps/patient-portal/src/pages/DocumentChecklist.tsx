import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  CloudUpload,
  Info
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { documentApi, RequiredDocument } from '../services/documentApi';
import { FormDialog } from '@qivr/design-system';

export default function DocumentChecklist() {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<RequiredDocument | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch required documents
  const { data: requiredDocs = [], isLoading } = useQuery({
    queryKey: ['required-documents'],
    queryFn: () => documentApi.getRequiredDocuments()
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile || !selectedDocType) {
        throw new Error('File and document type required');
      }
      return documentApi.upload(selectedFile, selectedDocType.type);
    },
    onSuccess: () => {
      enqueueSnackbar('Document uploaded successfully!', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['required-documents'] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedDocType(null);
    },
    onError: () => {
      enqueueSnackbar('Upload failed', { variant: 'error' });
    }
  });

  const handleUploadClick = (doc: RequiredDocument) => {
    setSelectedDocType(doc);
    setUploadDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    uploadMutation.mutate();
  };

  const completedCount = requiredDocs.filter(d => d.uploaded).length;
  const requiredCount = requiredDocs.filter(d => d.required).length;
  const requiredCompleted = requiredDocs.filter(d => d.required && d.uploaded).length;
  const progress = requiredCount > 0 ? (requiredCompleted / requiredCount) * 100 : 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={600} gutterBottom>
          📋 Document Checklist
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload required documents before your appointment
        </Typography>
      </Box>

      <Paper sx={{ p: 4, mb: 3, borderRadius: 2, boxShadow: 3, bgcolor: 'primary.50', border: '2px solid', borderColor: 'primary.200' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Progress: {requiredCompleted} of {requiredCount} required documents
          </Typography>
          <Chip
            label={progress === 100 ? '✓ Complete' : 'In Progress'}
            color={progress === 100 ? 'success' : 'warning'}
            sx={{ fontWeight: 600, px: 2 }}
          />
        </Box>
        <LinearProgress 
          variant="determinate" 
          value={progress} 
          sx={{ 
            height: 10, 
            borderRadius: 2,
            bgcolor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              borderRadius: 2
            }
          }} 
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {completedCount} of {requiredDocs.length} total documents uploaded
        </Typography>
      </Paper>

      {progress < 100 && (
        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }} icon={<Info />}>
          <strong>Important:</strong> Please upload all required documents at least 24 hours before your appointment.
        </Alert>
      )}

      <Paper sx={{ borderRadius: 2, boxShadow: 2 }}>
        <List>
          {isLoading ? (
            <ListItem>
              <ListItemText primary="Loading..." />
            </ListItem>
          ) : (
            requiredDocs.map((doc, index) => (
              <ListItem
                key={doc.type}
                divider={index < requiredDocs.length - 1}
                sx={{
                  py: 3,
                  bgcolor: doc.uploaded ? 'success.50' : 'inherit',
                  borderLeft: doc.uploaded ? '4px solid' : 'none',
                  borderColor: 'success.main',
                  transition: 'all 0.2s',
                  '&:hover': { 
                    bgcolor: doc.uploaded ? 'success.100' : 'grey.50',
                    transform: 'translateX(4px)'
                  }
                }}
              >
                <ListItemIcon>
                  {doc.uploaded ? (
                    <CheckCircle color="success" sx={{ fontSize: 32 }} />
                  ) : (
                    <RadioButtonUnchecked color="action" sx={{ fontSize: 32 }} />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {doc.label}
                      </Typography>
                      {doc.required && (
                        <Chip label="Required" size="small" color="error" sx={{ fontWeight: 600 }} />
                      )}
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {doc.description}
                    </Typography>
                  }
                />
                {!doc.uploaded && (
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<CloudUpload />}
                    onClick={() => handleUploadClick(doc)}
                    sx={{ px: 3, fontWeight: 600 }}
                  >
                    Upload
                  </Button>
                )}
                {doc.uploaded && (
                  <Chip 
                    label="✓ Uploaded" 
                    color="success" 
                    sx={{ fontWeight: 600, px: 2 }}
                  />
                )}
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.50', borderRadius: 2, border: '1px solid', borderColor: 'info.200' }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
          <Info color="info" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Need Help?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              If you have questions about which documents to upload or need assistance, please contact our office at <strong>(555) 123-4567</strong> or email <strong>support@clinic.com</strong>
            </Typography>
          </Box>
        </Box>
      </Paper>

      <FormDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        title={`Upload ${selectedDocType?.label}`}
        onSubmit={handleUpload}
        submitLabel={uploadMutation.isPending ? 'Uploading...' : 'Upload'}
        submitDisabled={!selectedFile || uploadMutation.isPending}
        loading={uploadMutation.isPending}
        maxWidth="sm"
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {selectedDocType?.description}
        </Typography>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          id="file-upload-input"
        />
        <label htmlFor="file-upload-input">
          <Button
            variant="outlined"
            component="span"
            fullWidth
            startIcon={<CloudUpload />}
            sx={{ mb: 2 }}
          >
            Choose File
          </Button>
        </label>

        {selectedFile && (
          <Alert severity="success">
            Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
          </Alert>
        )}

        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
          Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 50MB)
        </Typography>
      </FormDialog>
    </Box>
  );
}
