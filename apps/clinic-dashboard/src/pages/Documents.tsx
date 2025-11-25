import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
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
  Grid
} from '@mui/material';
import {
  Add,
  MoreVert,
  Download,
  Visibility,
  Delete,
  FilterList,
  ViewModule,
  ViewList,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import { documentApi, Document } from '../services/documentApi';
import { 
  SearchBar, 
  ConfirmDialog,
  PageHeader,
  AuraButton,
  AuraEmptyState,
  FilterChips,
} from '@qivr/design-system';
import { AuraDocumentCard } from '../components/aura/AuraDocumentCard';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const DOCUMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'referral', label: 'Referral' },
  { value: 'consent', label: 'Consent' },
  { value: 'progress_note', label: 'Progress Note' },
  { value: 'assessment', label: 'Assessment' },
  { value: 'lab_report', label: 'Lab Report' },
  { value: 'imaging', label: 'Imaging/X-Ray' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'treatment_plan', label: 'Treatment Plan' },
  { value: 'invoice', label: 'Invoice/Receipt' },
  { value: 'correspondence', label: 'Correspondence' },
  { value: 'other', label: 'Other' }
];

const STATUS_COLORS: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
  processing: 'primary',
  ready: 'success',
  failed: 'error'
};

export default function Documents() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState('');
  const [status, setStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ocrDialogOpen, setOcrDialogOpen] = useState(false);

  // Fetch documents
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', documentType, status],
    queryFn: () => documentApi.list({
      documentType: documentType || undefined,
      status: status || undefined
    }),
    refetchInterval: 30000 // Auto-refresh every 30s
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => documentApi.delete(id),
    onSuccess: () => {
      enqueueSnackbar('Document deleted successfully', { variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setDeleteDialogOpen(false);
    },
    onError: () => {
      enqueueSnackbar('Failed to delete document', { variant: 'error' });
    }
  });

  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async (id: string) => {
      const { url } = await documentApi.getDownloadUrl(id);
      window.open(url, '_blank');
    },
    onError: () => {
      enqueueSnackbar('Failed to download document', { variant: 'error' });
    }
  });

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, document: Document) => {
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

  const filteredDocuments = documents.filter(doc => {
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
    page * rowsPerPage + rowsPerPage
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1600, mx: 'auto' }}>
      <PageHeader
        title="Documents"
        description="Manage and organize patient documents"
        actions={
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 0.5, bgcolor: 'action.hover', borderRadius: 1, p: 0.5 }}>
              <IconButton
                size="small"
                onClick={() => setViewMode('grid')}
                sx={{
                  bgcolor: viewMode === 'grid' ? 'primary.main' : 'transparent',
                  color: viewMode === 'grid' ? 'white' : 'text.secondary',
                  '&:hover': { bgcolor: viewMode === 'grid' ? 'primary.dark' : 'action.hover' },
                }}
              >
                <ViewModule fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setViewMode('list')}
                sx={{
                  bgcolor: viewMode === 'list' ? 'primary.main' : 'transparent',
                  color: viewMode === 'list' ? 'white' : 'text.secondary',
                  '&:hover': { bgcolor: viewMode === 'list' ? 'primary.dark' : 'action.hover' },
                }}
              >
                <ViewList fontSize="small" />
              </IconButton>
            </Box>
            <AuraButton
              variant="contained"
              size="large"
              startIcon={<Add />}
              onClick={() => navigate('/documents/upload')}
              sx={{ px: 3, py: 1.5, fontWeight: 600 }}
            >
              Upload Document
            </AuraButton>
          </Box>
        }
      />

      <Paper sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: 2 }}>
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
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
          </Grid>
        </Grid>

        {/* Active Filters */}
        {(searchTerm || documentType || status) && (
          <Box sx={{ mt: 2 }}>
            <FilterChips
              filters={[
                ...(searchTerm ? [{ key: "search", label: `Search: ${searchTerm}` }] : []),
                ...(documentType ? [{ key: "type", label: `Type: ${DOCUMENT_TYPES.find(t => t.value === documentType)?.label}` }] : []),
                ...(status ? [{ key: "status", label: `Status: ${status}` }] : []),
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

      {viewMode === 'grid' ? (
        <Box>
          {isLoading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ height: 200, bgcolor: 'action.hover', borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : paginatedDocuments.length === 0 ? (
            <Paper sx={{ p: 4, borderRadius: 2 }}>
              <AuraEmptyState
                title="No documents found"
                description={searchTerm || documentType || status ? "Try adjusting your filters" : "No documents have been uploaded yet"}
              />
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {paginatedDocuments.map((doc) => (
                <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                  <AuraDocumentCard
                    id={doc.id}
                    name={doc.fileName}
                    type={doc.fileName.split('.').pop() || 'file'}
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
                </Grid>
              ))}
            </Grid>
          )}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
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
            />
          </Box>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>File Name</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Size</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="body2" color="text.secondary">
                    Loading documents…
                  </Typography>
                </TableCell>
              </TableRow>
            ) : paginatedDocuments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ border: 0, p: 0 }}>
                  <AuraEmptyState
                    title="No documents found"
                    description={searchTerm || documentType || status ? "Try adjusting your filters" : "No documents have been uploaded yet"}
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
                        <Chip label="Urgent" size="small" color="error" sx={{ mt: 0.5 }} />
                      )}
                      {doc.extractedText && (
                        <Chip label="OCR Available" size="small" color="info" sx={{ mt: 0.5, ml: 1 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{doc.patientName || 'Unknown'}</TableCell>
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
                      color={STATUS_COLORS[doc.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(doc.createdAt).toLocaleDateString()}
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
        />
      </TableContainer>
      )}

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
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <Visibility fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

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
      <Dialog
        open={ocrDialogOpen}
        onClose={() => setOcrDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Extracted Text - {selectedDocument?.fileName}
          {selectedDocument?.confidenceScore && (
            <Chip
              label={`${Math.round(selectedDocument.confidenceScore)}% confidence`}
              size="small"
              color="success"
              sx={{ ml: 2 }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Paper
            sx={{
              p: 2,
              bgcolor: 'grey.50',
              maxHeight: 500,
              overflow: 'auto',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              fontSize: '0.875rem'
            }}
          >
            {selectedDocument?.extractedText || 'No text extracted'}
          </Paper>
          {selectedDocument?.extractedPatientName && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Extracted Information:
              </Typography>
              <Typography variant="body2">
                Patient Name: {selectedDocument.extractedPatientName}
              </Typography>
              {selectedDocument.extractedDob && (
                <Typography variant="body2">
                  Date of Birth: {selectedDocument.extractedDob}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOcrDialogOpen(false)}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              navigator.clipboard.writeText(selectedDocument?.extractedText || '');
              enqueueSnackbar('Text copied to clipboard', { variant: 'success' });
            }}
          >
            Copy Text
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
