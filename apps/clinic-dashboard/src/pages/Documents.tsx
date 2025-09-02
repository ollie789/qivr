import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FolderOpen as FolderIcon,
  InsertDriveFile as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  MoreVert as MoreIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/sharedApiClient';
import FileUpload from '../components/FileUpload';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  category: string;
  patientId?: string;
  patientName?: string;
  uploadedBy: string;
  uploadedAt: Date;
  url: string;
  thumbnailUrl?: string;
}

const Documents: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Fetch documents
  const { data: documents = [], isLoading, error } = useQuery({
    queryKey: ['documents', selectedCategory],
    queryFn: async () => {
      const response = await apiClient.get('/api/v1/documents', {
        params: {
          category: selectedCategory === 'all' ? undefined : selectedCategory,
          limit: 100,
        }
      });
      return response.data.map((d: any) => ({
        ...d,
        uploadedAt: new Date(d.uploadedAt),
      }));
    },
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(`/api/v1/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      handleMenuClose();
    },
  });

  const filteredDocuments = documents.filter((d: Document) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.patientName && d.patientName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = [
    { value: 'all', label: 'All Documents' },
    { value: 'medical-records', label: 'Medical Records' },
    { value: 'lab-results', label: 'Lab Results' },
    { value: 'imaging', label: 'Imaging' },
    { value: 'prescriptions', label: 'Prescriptions' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'consent-forms', label: 'Consent Forms' },
    { value: 'other', label: 'Other' },
  ];

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <PdfIcon />;
    if (type.includes('image')) return <ImageIcon />;
    if (type.includes('doc')) return <DocIcon />;
    return <FileIcon />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(doc);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleView = () => {
    setViewDialogOpen(true);
    handleMenuClose();
  };

  const handleDownload = async () => {
    if (selectedDocument) {
      window.open(selectedDocument.url, '_blank');
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedDocument) {
      if (window.confirm(`Are you sure you want to delete ${selectedDocument.name}?`)) {
        deleteMutation.mutate(selectedDocument.id);
      }
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={600}>
          Documents
        </Typography>
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Documents
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <Chip
                  key={cat.value}
                  label={cat.label}
                  onClick={() => setSelectedCategory(cat.value)}
                  color={selectedCategory === cat.value ? 'primary' : 'default'}
                  variant={selectedCategory === cat.value ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">Failed to load documents</Alert>
      ) : filteredDocuments.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No documents found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery ? 'Try adjusting your search criteria' : 'Upload your first document to get started'}
          </Typography>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredDocuments.map((doc: Document) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      {getFileIcon(doc.type)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body1"
                        fontWeight={500}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {doc.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatFileSize(doc.size)}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, doc)}
                    >
                      <MoreIcon />
                    </IconButton>
                  </Box>

                  {doc.patientName && (
                    <Chip
                      label={doc.patientName}
                      size="small"
                      variant="outlined"
                      sx={{ mb: 1 }}
                    />
                  )}

                  <Typography variant="body2" color="text.secondary">
                    Uploaded by {doc.uploadedBy}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDistanceToNow(doc.uploadedAt, { addSuffix: true })}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    size="small"
                    startIcon={<ViewIcon />}
                    onClick={() => {
                      setSelectedDocument(doc);
                      setViewDialogOpen(true);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => window.open(doc.url, '_blank')}
                  >
                    Download
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Upload Documents</DialogTitle>
        <DialogContent>
          <FileUpload
            category={selectedCategory === 'all' ? 'general' : selectedCategory}
            onUpload={(files) => {
              console.log('Uploaded files:', files);
              queryClient.invalidateQueries({ queryKey: ['documents'] });
              setUploadDialogOpen(false);
            }}
            onError={(error) => {
              console.error('Upload error:', error);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {selectedDocument?.name}
            <Box>
              <IconButton onClick={() => selectedDocument && window.open(selectedDocument.url, '_blank')}>
                <DownloadIcon />
              </IconButton>
              <IconButton>
                <ShareIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDocument?.type.includes('image') ? (
            <img
              src={selectedDocument.url}
              alt={selectedDocument.name}
              style={{ width: '100%', height: 'auto' }}
            />
          ) : selectedDocument?.type.includes('pdf') ? (
            <iframe
              src={selectedDocument.url}
              title={selectedDocument.name}
              style={{ width: '100%', height: '600px', border: 'none' }}
            />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Preview not available
              </Typography>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={() => selectedDocument && window.open(selectedDocument.url, '_blank')}
              >
                Download to view
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleView}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDownload}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Documents;
