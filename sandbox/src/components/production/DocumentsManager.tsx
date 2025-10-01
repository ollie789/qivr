// Production Component - Documents Manager with Enhanced Medical UI Styling
import React, { useState, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Stack,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Checkbox,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  alpha,
  useTheme,
  Fade,
  Zoom,
  Badge,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Delete as DeleteIcon,
  Share as ShareIcon,
  MoreVert as MoreIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  Image as ImageIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Star as StarIcon,
  StarBorder as StarOutlineIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  CloudUpload as CloudUploadIcon,
  GridView as GridViewIcon,
  ViewList as ListViewIcon,
  DateRange as DateRangeIcon,
  LocalHospital as MedicalIcon,
  Assignment as ReportIcon,
  Receipt as BillingIcon,
  Science as LabIcon,
  MonitorHeart as VitalIcon,
  MedicalServices as PrescriptionIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { customStyles } from '../../theme/theme';

// Types
interface Document {
  id: string;
  name: string;
  type: 'pdf' | 'doc' | 'image' | 'lab' | 'prescription' | 'report' | 'billing';
  category: 'medical-records' | 'lab-results' | 'prescriptions' | 'billing' | 'insurance' | 'consent' | 'other';
  size: string;
  uploadedBy: string;
  uploadedDate: Date;
  lastModified: Date;
  status: 'active' | 'archived' | 'pending-review';
  tags: string[];
  patientId?: string;
  patientName?: string;
  isStarred: boolean;
  isShared: boolean;
  permissions: string[];
  version: number;
  thumbnail?: string;
}

interface DocumentFolder {
  id: string;
  name: string;
  documentCount: number;
  icon: React.ReactNode;
  color: string;
}

const DocumentsManager: React.FC = () => {
  const theme = useTheme();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterAnchor, setFilterAnchor] = useState<null | HTMLElement>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data
  const documents: Document[] = [
    {
      id: '1',
      name: 'Blood Test Results - March 2024.pdf',
      type: 'lab',
      category: 'lab-results',
      size: '2.4 MB',
      uploadedBy: 'Dr. Emily Williams',
      uploadedDate: new Date(2024, 2, 15),
      lastModified: new Date(2024, 2, 15),
      status: 'active',
      tags: ['CBC', 'Cholesterol', 'Thyroid'],
      patientName: 'Sarah Johnson',
      isStarred: true,
      isShared: false,
      permissions: ['view', 'download', 'share'],
      version: 1,
    },
    {
      id: '2',
      name: 'Prescription - Antibiotics.pdf',
      type: 'prescription',
      category: 'prescriptions',
      size: '156 KB',
      uploadedBy: 'Dr. Michael Chen',
      uploadedDate: new Date(2024, 2, 10),
      lastModified: new Date(2024, 2, 10),
      status: 'active',
      tags: ['Antibiotics', 'Infection'],
      patientName: 'John Doe',
      isStarred: false,
      isShared: true,
      permissions: ['view', 'download'],
      version: 1,
    },
    {
      id: '3',
      name: 'X-Ray - Chest.jpg',
      type: 'image',
      category: 'medical-records',
      size: '5.1 MB',
      uploadedBy: 'Radiology Dept',
      uploadedDate: new Date(2024, 2, 5),
      lastModified: new Date(2024, 2, 5),
      status: 'pending-review',
      tags: ['X-Ray', 'Chest', 'Radiology'],
      patientName: 'Michael Chen',
      isStarred: false,
      isShared: false,
      permissions: ['view'],
      version: 2,
    },
    {
      id: '4',
      name: 'Insurance Claim Form.pdf',
      type: 'billing',
      category: 'insurance',
      size: '892 KB',
      uploadedBy: 'Admin Staff',
      uploadedDate: new Date(2024, 2, 1),
      lastModified: new Date(2024, 2, 3),
      status: 'active',
      tags: ['Insurance', 'Claim', 'Billing'],
      patientName: 'Sarah Johnson',
      isStarred: false,
      isShared: false,
      permissions: ['view', 'download', 'edit'],
      version: 3,
    },
  ];

  const folders: DocumentFolder[] = [
    {
      id: '1',
      name: 'Medical Records',
      documentCount: 145,
      icon: <MedicalIcon />,
      color: theme.palette.primary.main,
    },
    {
      id: '2',
      name: 'Lab Results',
      documentCount: 82,
      icon: <LabIcon />,
      color: theme.palette.error.main,
    },
    {
      id: '3',
      name: 'Prescriptions',
      documentCount: 56,
      icon: <PrescriptionIcon />,
      color: theme.palette.success.main,
    },
    {
      id: '4',
      name: 'Billing & Insurance',
      documentCount: 34,
      icon: <BillingIcon />,
      color: theme.palette.warning.main,
    },
  ];

  const getDocumentIcon = (type: Document['type']) => {
    switch (type) {
      case 'pdf': return <PdfIcon sx={{ fontSize: 40, color: '#d32f2f' }} />;
      case 'doc': return <DocIcon sx={{ fontSize: 40, color: '#1976d2' }} />;
      case 'image': return <ImageIcon sx={{ fontSize: 40, color: '#388e3c' }} />;
      case 'lab': return <LabIcon sx={{ fontSize: 40, color: '#9c27b0' }} />;
      case 'prescription': return <PrescriptionIcon sx={{ fontSize: 40, color: '#ff6f00' }} />;
      case 'report': return <ReportIcon sx={{ fontSize: 40, color: '#00838f' }} />;
      case 'billing': return <BillingIcon sx={{ fontSize: 40, color: '#f57c00' }} />;
      default: return <DocIcon sx={{ fontSize: 40 }} />;
    }
  };

  const getCategoryColor = (category: Document['category']) => {
    switch (category) {
      case 'medical-records': return theme.palette.primary;
      case 'lab-results': return theme.palette.error;
      case 'prescriptions': return theme.palette.success;
      case 'billing': return theme.palette.warning;
      case 'insurance': return theme.palette.info;
      default: return { main: theme.palette.grey[500] };
    }
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'active': return theme.palette.success;
      case 'archived': return { main: theme.palette.grey[500] };
      case 'pending-review': return theme.palette.warning;
      default: return { main: theme.palette.grey[500] };
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (selectedCategory !== 'all' && doc.category !== selectedCategory) return false;
    if (searchQuery) {
      return doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             doc.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
             doc.patientName?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const sortedDocuments = [...filteredDocuments].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'date':
        comparison = a.uploadedDate.getTime() - b.uploadedDate.getTime();
        break;
      case 'size':
        comparison = parseFloat(a.size) - parseFloat(b.size);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleToggleSelect = (id: string) => {
    setSelectedDocuments(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocuments.length === sortedDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(sortedDocuments.map(d => d.id));
    }
  };

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          ...customStyles.glassmorphism,
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight={600}>
            Documents
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Upload Document
            </Button>
          </Stack>
        </Stack>

        {/* Search and Filters */}
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            fullWidth
            size="small"
            placeholder="Search documents, tags, or patients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                backgroundColor: alpha(theme.palette.background.paper, 0.8),
              },
            }}
          />
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={(e) => setFilterAnchor(e.currentTarget)}
            sx={{ borderRadius: 2, minWidth: 120 }}
          >
            Filter
          </Button>
          <IconButton
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
            }}
          >
            {viewMode === 'grid' ? <ListViewIcon /> : <GridViewIcon />}
          </IconButton>
        </Stack>
      </Paper>

      {/* Folders */}
      <Grid container spacing={2} mb={3}>
        {folders.map((folder, index) => (
          <Grid item xs={12} sm={6} md={3} key={folder.id}>
            <Zoom in timeout={200 * (index + 1)}>
              <Card
                sx={{
                  cursor: 'pointer',
                  ...customStyles.glassmorphism,
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    borderColor: folder.color,
                  },
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: alpha(folder.color, 0.1),
                        color: folder.color,
                      }}
                    >
                      {folder.icon}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {folder.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {folder.documentCount} documents
                      </Typography>
                    </Box>
                    <FolderOpenIcon sx={{ color: alpha(folder.color, 0.5) }} />
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      {/* Documents View */}
      {viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {sortedDocuments.map((doc, index) => {
            const categoryColor = getCategoryColor(doc.category);
            const statusColor = getStatusColor(doc.status);
            
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
                <Fade in timeout={300 * (index + 1)}>
                  <Card
                    sx={{
                      height: '100%',
                      ...customStyles.glassmorphism,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[4],
                        '& .document-actions': {
                          opacity: 1,
                        },
                      },
                    }}
                  >
                    <Box sx={{ position: 'relative' }}>
                      <Checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => handleToggleSelect(doc.id)}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          zIndex: 1,
                          bgcolor: alpha(theme.palette.background.paper, 0.9),
                          '&:hover': { bgcolor: alpha(theme.palette.background.paper, 1) },
                        }}
                      />
                      {doc.isStarred && (
                        <StarIcon
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            color: theme.palette.warning.main,
                          }}
                        />
                      )}
                    </Box>
                    
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, mt: 2 }}>
                        {getDocumentIcon(doc.type)}
                      </Box>
                      
                      <Typography
                        variant="subtitle2"
                        fontWeight={600}
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 1,
                        }}
                      >
                        {doc.name}
                      </Typography>
                      
                      {doc.patientName && (
                        <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                          Patient: {doc.patientName}
                        </Typography>
                      )}
                      
                      <Stack direction="row" spacing={0.5} mb={1} flexWrap="wrap">
                        {doc.tags.slice(0, 2).map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(categoryColor.main, 0.1),
                              color: categoryColor.main,
                            }}
                          />
                        ))}
                        {doc.tags.length > 2 && (
                          <Chip
                            label={`+${doc.tags.length - 2}`}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                            }}
                          />
                        )}
                      </Stack>
                      
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {doc.size}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {format(doc.uploadedDate, 'MMM d, yyyy')}
                        </Typography>
                      </Stack>
                    </CardContent>
                    
                    <CardActions
                      className="document-actions"
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s ease',
                        bgcolor: alpha(theme.palette.background.paper, 0.95),
                      }}
                    >
                      <IconButton size="small">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small">
                        <DownloadIcon />
                      </IconButton>
                      <IconButton size="small">
                        <ShareIcon />
                      </IconButton>
                      <IconButton size="small">
                        <MoreIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Fade>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <TableContainer component={Paper} sx={{ ...customStyles.glassmorphism }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedDocuments.length > 0 && selectedDocuments.length < sortedDocuments.length}
                    checked={selectedDocuments.length === sortedDocuments.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'name'}
                    direction={sortBy === 'name' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Name
                  </TableSortLabel>
                </TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Patient</TableCell>
                <TableCell>Tags</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'size'}
                    direction={sortBy === 'size' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('size');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Size
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortBy === 'date'}
                    direction={sortBy === 'date' ? sortOrder : 'asc'}
                    onClick={() => {
                      setSortBy('date');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedDocuments.map((doc) => {
                const categoryColor = getCategoryColor(doc.category);
                const statusColor = getStatusColor(doc.status);
                
                return (
                  <TableRow
                    key={doc.id}
                    hover
                    selected={selectedDocuments.includes(doc.id)}
                    sx={{
                      '&:hover .row-actions': {
                        opacity: 1,
                      },
                    }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedDocuments.includes(doc.id)}
                        onChange={() => handleToggleSelect(doc.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {doc.isStarred && (
                          <StarIcon sx={{ fontSize: 16, color: theme.palette.warning.main }} />
                        )}
                        <Typography variant="body2" fontWeight={500}>
                          {doc.name}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={doc.type.toUpperCase()}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                        }}
                      />
                    </TableCell>
                    <TableCell>{doc.patientName || '-'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {doc.tags.slice(0, 2).map(tag => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(categoryColor.main, 0.1),
                              color: categoryColor.main,
                            }}
                          />
                        ))}
                        {doc.tags.length > 2 && (
                          <Chip
                            label={`+${doc.tags.length - 2}`}
                            size="small"
                            sx={{ height: 20, fontSize: '0.7rem' }}
                          />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>{doc.size}</TableCell>
                    <TableCell>{format(doc.uploadedDate, 'MMM d, yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={doc.status.replace('-', ' ')}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: '0.75rem',
                          bgcolor: alpha(statusColor.main, 0.1),
                          color: statusColor.main,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={0}
                        className="row-actions"
                        sx={{
                          opacity: 0,
                          transition: 'opacity 0.2s ease',
                        }}
                      >
                        <Tooltip title="View">
                          <IconButton size="small">
                            <ViewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small">
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Share">
                          <IconButton size="small">
                            <ShareIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <IconButton
                          size="small"
                          onClick={(e) => setAnchorEl(e.currentTarget)}
                        >
                          <MoreIcon fontSize="small" />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterAnchor}
        open={Boolean(filterAnchor)}
        onClose={() => setFilterAnchor(null)}
      >
        <MenuItem onClick={() => { setSelectedCategory('all'); setFilterAnchor(null); }}>
          All Documents
        </MenuItem>
        <MenuItem onClick={() => { setSelectedCategory('medical-records'); setFilterAnchor(null); }}>
          Medical Records
        </MenuItem>
        <MenuItem onClick={() => { setSelectedCategory('lab-results'); setFilterAnchor(null); }}>
          Lab Results
        </MenuItem>
        <MenuItem onClick={() => { setSelectedCategory('prescriptions'); setFilterAnchor(null); }}>
          Prescriptions
        </MenuItem>
        <MenuItem onClick={() => { setSelectedCategory('billing'); setFilterAnchor(null); }}>
          Billing
        </MenuItem>
        <MenuItem onClick={() => { setSelectedCategory('insurance'); setFilterAnchor(null); }}>
          Insurance
        </MenuItem>
      </Menu>

      {/* More Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <PrintIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Print</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <EmailIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Email</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Upload Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent>
          <Box
            sx={{
              border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              bgcolor: alpha(theme.palette.primary.main, 0.02),
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                bgcolor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag and drop files here
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or
            </Typography>
            <Button variant="contained" sx={{ mt: 1 }}>
              Browse Files
            </Button>
            <Typography variant="caption" display="block" color="text.secondary" mt={2}>
              Supported formats: PDF, DOC, DOCX, PNG, JPG, DICOM
            </Typography>
          </Box>
          
          <Stack spacing={2} mt={3}>
            <FormControl fullWidth>
              <InputLabel>Document Category</InputLabel>
              <Select label="Document Category" defaultValue="">
                <MenuItem value="medical-records">Medical Records</MenuItem>
                <MenuItem value="lab-results">Lab Results</MenuItem>
                <MenuItem value="prescriptions">Prescriptions</MenuItem>
                <MenuItem value="billing">Billing</MenuItem>
                <MenuItem value="insurance">Insurance</MenuItem>
                <MenuItem value="consent">Consent Forms</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Patient</InputLabel>
              <Select label="Patient" defaultValue="">
                <MenuItem value="1">Sarah Johnson</MenuItem>
                <MenuItem value="2">John Doe</MenuItem>
                <MenuItem value="3">Michael Chen</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Tags"
              placeholder="Enter tags separated by commas"
              helperText="E.g., X-Ray, Chest, 2024"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setUploadDialogOpen(false)}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Export as both named and default
export { DocumentsManager };
export default DocumentsManager;