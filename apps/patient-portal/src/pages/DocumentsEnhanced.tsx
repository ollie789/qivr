import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Alert,
  LinearProgress,
  Stack,
  Breadcrumbs,
  Link,
  Menu,
  Divider,
  Tooltip,
  Badge,
  CircularProgress,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Folder as FolderIcon,
  Description as FileIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Assignment as DocumentIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MoreVert as MoreIcon,
  CreateNewFolder as NewFolderIcon,
  Star as StarIcon,
  StarBorder as StarOutlineIcon,
  AccessTime as RecentIcon,
  Security as SecureIcon,
  CheckCircle as VerifiedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  LocalHospital as MedicalIcon,
  CreditCard as InsuranceIcon,
  Vaccines as VaccineIcon,
  Science as LabIcon,
  MedicalServices as PrescriptionIcon,
  Receipt as BillingIcon,
  FolderShared as SharedIcon,
  Lock as LockIcon,
  LockOpen as UnlockIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import apiClient from '../services/apiClient';

interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'image' | 'document' | 'spreadsheet' | 'other';
  category: 'medical' | 'insurance' | 'lab' | 'imaging' | 'prescription' | 'billing' | 'legal' | 'other';
  size: number;
  uploadedDate: string;
  modifiedDate: string;
  uploadedBy: string;
  sharedWith: string[];
  tags: string[];
  starred: boolean;
  verified: boolean;
  encrypted: boolean;
  description?: string;
  url?: string;
  thumbnailUrl?: string;
  folderId?: string;
}

interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdDate: string;
  documentCount: number;
  color?: string;
  icon?: string;
}

const DocumentsEnhanced: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ['documents', selectedFolder, filterCategory, searchTerm],
    queryFn: async () => {
      try {
        const params: any = {};
        if (selectedFolder) params.folderId = selectedFolder;
        if (filterCategory !== 'all') params.category = filterCategory;
        if (searchTerm) params.search = searchTerm;
        
        const response = await apiClient.get('/api/Documents', { params });
        return response.data;
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  // Fetch folders
  const { data: folders = [] } = useQuery({
    queryKey: ['folders'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/Documents/folders');
        return response.data;
      } catch {
        return [];
      }
    },
    retry: 1,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; category: string; tags: string[] }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('category', data.category);
      data.tags.forEach(tag => formData.append('tags[]', tag));
      
      const response = await apiClient.post('/api/Documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadDialogOpen(false);
      setUploadProgress(0);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(`/api/Documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Handle file upload
    acceptedFiles.forEach(file => {
      uploadMutation.mutate({
        file,
        category: 'other',
        tags: [],
      });
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <PdfIcon />;
      case 'image': return <ImageIcon />;
      case 'document': return <DocumentIcon />;
      default: return <FileIcon />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medical': return <MedicalIcon />;
      case 'insurance': return <InsuranceIcon />;
      case 'lab': return <LabIcon />;
      case 'imaging': return <ImageIcon />;
      case 'prescription': return <PrescriptionIcon />;
      case 'billing': return <BillingIcon />;
      default: return <FolderIcon />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'medical': return 'primary';
      case 'insurance': return 'info';
      case 'lab': return 'success';
      case 'imaging': return 'warning';
      case 'prescription': return 'secondary';
      case 'billing': return 'error';
      default: return 'default';
    }
  };

  const handleDocumentClick = (document: Document) => {
    setSelectedDocument(document);
    setPreviewDialogOpen(true);
  };

  const handleDownload = async (document: Document) => {
    // Implement download functionality
    window.open(document.url, '_blank');
  };

  const handleShare = (document: Document) => {
    setSelectedDocument(document);
    setShareDialogOpen(true);
  };

  const handleDelete = (document: Document) => {
    if (window.confirm(`Are you sure you want to delete "${document.name}"?`)) {
      deleteMutation.mutate(document.id);
    }
  };

  const handleToggleStar = async (document: Document) => {
    // Toggle star status
    await apiClient.patch(`/api/Documents/${document.id}/star`, {
      starred: !document.starred,
    });
    queryClient.invalidateQueries({ queryKey: ['documents'] });
  };

  // Statistics
  const stats = {
    total: documents?.length || 0,
    medical: documents?.filter((d: Document) => d.category === 'medical').length || 0,
    insurance: documents?.filter((d: Document) => d.category === 'insurance').length || 0,
    verified: documents?.filter((d: Document) => d.verified).length || 0,
    shared: documents?.filter((d: Document) => d.sharedWith.length > 0).length || 0,
  };

  return (
    <Box sx={{ p: 3 }} {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            My Documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Securely store and manage your health documents
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<NewFolderIcon />}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        </Stack>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Documents
                  </Typography>
                  <Typography variant="h5">{stats.total}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', width: 40, height: 40 }}>
                  <FolderIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Medical Records
                  </Typography>
                  <Typography variant="h5">{stats.medical}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'error.light', width: 40, height: 40 }}>
                  <MedicalIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Insurance
                  </Typography>
                  <Typography variant="h5">{stats.insurance}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', width: 40, height: 40 }}>
                  <InsuranceIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Verified
                  </Typography>
                  <Typography variant="h5">{stats.verified}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', width: 40, height: 40 }}>
                  <VerifiedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent sx={{ pb: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Shared
                  </Typography>
                  <Typography variant="h5">{stats.shared}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', width: 40, height: 40 }}>
                  <SharedIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Sidebar with Folders */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Folders
            </Typography>
            <List dense>
              <ListItem button selected={!selectedFolder} onClick={() => setSelectedFolder(null)}>
                <ListItemIcon>
                  <FolderIcon />
                </ListItemIcon>
                <ListItemText primary="All Documents" />
                <ListItemSecondaryAction>
                  <Chip label={stats.total} size="small" />
                </ListItemSecondaryAction>
              </ListItem>
              
              <Divider sx={{ my: 1 }} />
              
              {[
                { id: 'starred', name: 'Starred', icon: <StarIcon />, count: 5 },
                { id: 'recent', name: 'Recent', icon: <RecentIcon />, count: 10 },
                { id: 'shared', name: 'Shared with me', icon: <SharedIcon />, count: stats.shared },
              ].map(folder => (
                <ListItem
                  key={folder.id}
                  button
                  selected={selectedFolder === folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                >
                  <ListItemIcon>{folder.icon}</ListItemIcon>
                  <ListItemText primary={folder.name} />
                  <ListItemSecondaryAction>
                    <Chip label={folder.count} size="small" />
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              
              <Divider sx={{ my: 1 }} />
              
              <Typography variant="overline" sx={{ px: 2, py: 1 }} display="block">
                Categories
              </Typography>
              
              {[
                { id: 'medical', name: 'Medical Records', icon: <MedicalIcon />, color: 'primary' },
                { id: 'insurance', name: 'Insurance', icon: <InsuranceIcon />, color: 'info' },
                { id: 'lab', name: 'Lab Results', icon: <LabIcon />, color: 'success' },
                { id: 'imaging', name: 'Imaging', icon: <ImageIcon />, color: 'warning' },
                { id: 'prescription', name: 'Prescriptions', icon: <PrescriptionIcon />, color: 'secondary' },
                { id: 'billing', name: 'Billing', icon: <BillingIcon />, color: 'error' },
              ].map(category => (
                <ListItem
                  key={category.id}
                  button
                  selected={filterCategory === category.id}
                  onClick={() => setFilterCategory(category.id)}
                >
                  <ListItemIcon>
                    <Avatar sx={{ bgcolor: `${category.color}.light`, width: 30, height: 30 }}>
                      {category.icon}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText primary={category.name} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Main Content Area */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            {/* Search and Filters */}
            <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="date">Date</MenuItem>
                  <MenuItem value="name">Name</MenuItem>
                  <MenuItem value="size">Size</MenuItem>
                  <MenuItem value="type">Type</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Drag and Drop Zone */}
            {isDragActive && (
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'primary.main',
                  borderRadius: 2,
                  p: 4,
                  mb: 3,
                  textAlign: 'center',
                  bgcolor: 'primary.light',
                  opacity: 0.1,
                }}
              >
                <UploadIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                <Typography variant="h6" color="primary">
                  Drop files here to upload
                </Typography>
              </Box>
            )}

            {/* Documents Table */}
            {documentsLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : documents?.length === 0 ? (
              <Box textAlign="center" p={4}>
                <FolderIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No documents found
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Upload your first document to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                >
                  Upload Document
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell padding="checkbox">
                        <IconButton size="small">
                          <StarOutlineIcon />
                        </IconButton>
                      </TableCell>
                      <TableCell>Name</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Modified</TableCell>
                      <TableCell>Size</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents?.map((document: Document) => (
                      <TableRow
                        key={document.id}
                        hover
                        onClick={() => handleDocumentClick(document)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell padding="checkbox">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(document);
                            }}
                          >
                            {document.starred ? (
                              <StarIcon color="warning" />
                            ) : (
                              <StarOutlineIcon />
                            )}
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getFileIcon(document.type)}
                            <Box>
                              <Typography variant="body2">{document.name}</Typography>
                              {document.description && (
                                <Typography variant="caption" color="text.secondary">
                                  {document.description}
                                </Typography>
                              )}
                            </Box>
                            {document.encrypted && (
                              <Tooltip title="Encrypted">
                                <LockIcon fontSize="small" color="action" />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getCategoryIcon(document.category)}
                            label={document.category}
                            size="small"
                            color={getCategoryColor(document.category) as any}
                          />
                        </TableCell>
                        <TableCell>
                          {format(parseISO(document.modifiedDate), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>{formatFileSize(document.size)}</TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            {document.verified && (
                              <Tooltip title="Verified">
                                <VerifiedIcon color="success" fontSize="small" />
                              </Tooltip>
                            )}
                            {document.sharedWith.length > 0 && (
                              <Tooltip title={`Shared with ${document.sharedWith.length} people`}>
                                <Badge badgeContent={document.sharedWith.length} color="primary">
                                  <SharedIcon fontSize="small" />
                                </Badge>
                              </Tooltip>
                            )}
                          </Stack>
                        </TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDownload(document);
                              }}
                            >
                              <DownloadIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleShare(document);
                              }}
                            >
                              <ShareIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnchorEl(e.currentTarget);
                                setSelectedDocument(document);
                              }}
                            >
                              <MoreIcon />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box
              sx={{
                border: '2px dashed',
                borderColor: 'grey.300',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main',
                  bgcolor: 'action.hover',
                },
              }}
              onClick={() => document.getElementById('file-input')?.click()}
            >
              <input
                id="file-input"
                type="file"
                hidden
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    uploadMutation.mutate({
                      file,
                      category: 'other',
                      tags: [],
                    });
                  });
                }}
              />
              <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Click to browse or drag files here
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Supported formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB)
              </Typography>
            </Box>

            {uploadProgress > 0 && (
              <Box>
                <Typography variant="body2" gutterBottom>
                  Uploading... {uploadProgress}%
                </Typography>
                <LinearProgress variant="determinate" value={uploadProgress} />
              </Box>
            )}

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select value="medical" label="Category">
                <MenuItem value="medical">Medical Records</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="lab">Lab Results</MenuItem>
                <MenuItem value="imaging">Imaging</MenuItem>
                <MenuItem value="prescription">Prescriptions</MenuItem>
                <MenuItem value="billing">Billing</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Description (Optional)"
              multiline
              rows={2}
              placeholder="Add a description for this document..."
            />

            <Alert severity="info">
              <Typography variant="body2">
                Your documents are encrypted and stored securely. Only you and authorized healthcare providers can access them.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<UploadIcon />}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Share Document</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Alert severity="warning">
              <Typography variant="body2">
                You are about to share: <strong>{selectedDocument?.name}</strong>
              </Typography>
            </Alert>

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              placeholder="Enter provider's email address"
              helperText="The recipient will receive a secure link to access this document"
            />

            <FormControl fullWidth>
              <InputLabel>Access Duration</InputLabel>
              <Select value="7days" label="Access Duration">
                <MenuItem value="24hours">24 Hours</MenuItem>
                <MenuItem value="7days">7 Days</MenuItem>
                <MenuItem value="30days">30 Days</MenuItem>
                <MenuItem value="permanent">Permanent</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Message (Optional)"
              multiline
              rows={3}
              placeholder="Add a message for the recipient..."
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" startIcon={<ShareIcon />}>
            Share Securely
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => {
          setAnchorEl(null);
          handleDownload(selectedDocument!);
        }}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Download</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setAnchorEl(null);
          handleShare(selectedDocument!);
        }}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Share</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          setAnchorEl(null);
          // Handle rename
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          setAnchorEl(null);
          handleDelete(selectedDocument!);
        }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DocumentsEnhanced;