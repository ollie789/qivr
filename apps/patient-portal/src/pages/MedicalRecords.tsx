import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  InputAdornment,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  CircularProgress,
  Alert,
  Menu,
  MenuItem,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Description as DescriptionIcon,
  LocalHospital as LocalHospitalIcon,
  Assignment as AssignmentIcon,
  Science as ScienceIcon,
  Vaccines as VaccinesIcon,
  MedicalServices as MedicalServicesIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  CalendarToday as CalendarTodayIcon,
  Person as PersonIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Image as ImageIcon,
  Article as ArticleIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

interface MedicalRecord {
  id: string;
  title: string;
  category: 'lab-results' | 'imaging' | 'prescriptions' | 'procedures' | 'vaccinations' | 'consultations' | 'discharge-summaries';
  date: string;
  provider: string;
  facility: string;
  fileType: 'pdf' | 'image' | 'document';
  fileSize: string;
  status: 'available' | 'pending' | 'processing';
  tags: string[];
  description?: string;
  attachments?: number;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const mockRecords: MedicalRecord[] = [
  {
    id: '1',
    title: 'Complete Blood Count (CBC)',
    category: 'lab-results',
    date: '2024-01-20T10:00:00',
    provider: 'Dr. Sarah Johnson',
    facility: 'Central Medical Lab',
    fileType: 'pdf',
    fileSize: '245 KB',
    status: 'available',
    tags: ['Blood Test', 'Routine'],
    description: 'Annual health checkup blood work'
  },
  {
    id: '2',
    title: 'Knee MRI Scan',
    category: 'imaging',
    date: '2024-01-18T14:00:00',
    provider: 'Dr. Michael Chen',
    facility: 'Imaging Center',
    fileType: 'image',
    fileSize: '12.5 MB',
    status: 'available',
    tags: ['MRI', 'Knee', 'Orthopedic'],
    attachments: 8
  },
  {
    id: '3',
    title: 'Prescription - Pain Management',
    category: 'prescriptions',
    date: '2024-01-15T09:00:00',
    provider: 'Dr. Emily Rodriguez',
    facility: 'Primary Care Clinic',
    fileType: 'document',
    fileSize: '156 KB',
    status: 'available',
    tags: ['Medication', 'Active']
  },
  {
    id: '4',
    title: 'COVID-19 Vaccination Record',
    category: 'vaccinations',
    date: '2023-12-10T11:00:00',
    provider: 'Nurse Williams',
    facility: 'Community Health Center',
    fileType: 'pdf',
    fileSize: '89 KB',
    status: 'available',
    tags: ['Vaccine', 'COVID-19', 'Booster']
  },
  {
    id: '5',
    title: 'Cardiology Consultation',
    category: 'consultations',
    date: '2024-01-05T15:30:00',
    provider: 'Dr. Robert Kim',
    facility: 'Heart Health Specialists',
    fileType: 'pdf',
    fileSize: '512 KB',
    status: 'available',
    tags: ['Cardiology', 'Consultation', 'Follow-up'],
    description: 'Follow-up consultation for heart health assessment'
  },
  {
    id: '6',
    title: 'Lipid Panel Results',
    category: 'lab-results',
    date: '2024-01-22T08:00:00',
    provider: 'Dr. Sarah Johnson',
    facility: 'Central Medical Lab',
    fileType: 'pdf',
    fileSize: '198 KB',
    status: 'pending',
    tags: ['Cholesterol', 'Lab Test']
  }
];

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`medical-records-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const MedicalRecords = () => {
  const navigate = useNavigate();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    fetchMedicalRecords();
  }, []);

  const fetchMedicalRecords = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/medical-records', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch medical records');
      }
      
      const data = await response.json();
      setRecords(data);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      // Fallback to mock data if API fails
      setRecords(mockRecords);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCategoryChange = (event: SelectChangeEvent) => {
    setSelectedCategory(event.target.value);
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, record: MedicalRecord) => {
    setAnchorEl(event.currentTarget);
    setSelectedRecord(record);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRecord(null);
  };

  const handleViewRecord = (recordId: string) => {
    navigate(`/medical-records/${recordId}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'lab-results': return <ScienceIcon />;
      case 'imaging': return <ImageIcon />;
      case 'prescriptions': return <MedicalServicesIcon />;
      case 'procedures': return <LocalHospitalIcon />;
      case 'vaccinations': return <VaccinesIcon />;
      case 'consultations': return <AssignmentIcon />;
      case 'discharge-summaries': return <DescriptionIcon />;
      default: return <FolderIcon />;
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return <PictureAsPdfIcon sx={{ color: '#d32f2f' }} />;
      case 'image': return <ImageIcon sx={{ color: '#1976d2' }} />;
      case 'document': return <ArticleIcon sx={{ color: '#388e3c' }} />;
      default: return <DescriptionIcon />;
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.provider.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.facility.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || record.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const recordsByCategory = {
    'lab-results': filteredRecords.filter(r => r.category === 'lab-results'),
    'imaging': filteredRecords.filter(r => r.category === 'imaging'),
    'prescriptions': filteredRecords.filter(r => r.category === 'prescriptions'),
    'vaccinations': filteredRecords.filter(r => r.category === 'vaccinations'),
    'consultations': filteredRecords.filter(r => r.category === 'consultations')
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={600}>
          Medical Records
        </Typography>
        <Button
          variant="contained"
          startIcon={<CloudUploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Record
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.light' }}>
                  <FolderIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {records.length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Records
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'error.light' }}>
                  <ScienceIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {recordsByCategory['lab-results'].length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Lab Results
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'info.light' }}>
                  <ImageIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {recordsByCategory['imaging'].length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Imaging
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'success.light' }}>
                  <MedicalServicesIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {recordsByCategory['prescriptions'].length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Prescriptions
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'warning.light' }}>
                  <VaccinesIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold">
                    {recordsByCategory['vaccinations'].length}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Vaccinations
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search medical records..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Category"
            onChange={handleCategoryChange}
          >
            <MenuItem value="all">All Categories</MenuItem>
            <MenuItem value="lab-results">Lab Results</MenuItem>
            <MenuItem value="imaging">Imaging</MenuItem>
            <MenuItem value="prescriptions">Prescriptions</MenuItem>
            <MenuItem value="procedures">Procedures</MenuItem>
            <MenuItem value="vaccinations">Vaccinations</MenuItem>
            <MenuItem value="consultations">Consultations</MenuItem>
            <MenuItem value="discharge-summaries">Discharge Summaries</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Tabs View */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="All Records" />
          <Tab label="Recent" />
          <Tab label="By Category" />
          <Tab label="Timeline" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* All Records Table */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Type</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Provider</TableCell>
                  <TableCell>Facility</TableCell>
                  <TableCell>Tags</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((record) => (
                    <TableRow
                      key={record.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleViewRecord(record.id)}
                    >
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          {getFileIcon(record.fileType)}
                          <Typography variant="caption" color="textSecondary">
                            {record.fileSize}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {record.title}
                          </Typography>
                          {record.description && (
                            <Typography variant="caption" color="textSecondary">
                              {record.description}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(record.date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>{record.provider}</TableCell>
                      <TableCell>{record.facility}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {record.tags.slice(0, 2).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                          {record.tags.length > 2 && (
                            <Chip label={`+${record.tags.length - 2}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMenuClick(e, record);
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredRecords.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Recent Records */}
          <List>
            {filteredRecords.slice(0, 5).map((record) => (
              <React.Fragment key={record.id}>
                <ListItem button onClick={() => handleViewRecord(record.id)}>
                  <ListItemIcon>
                    {getCategoryIcon(record.category)}
                  </ListItemIcon>
                  <ListItemText
                    primary={record.title}
                    secondary={
                      <Box>
                        <Typography variant="caption" display="block">
                          {format(new Date(record.date), 'MMM dd, yyyy')} • {record.provider}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                          {record.tags.map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" onClick={() => handleViewRecord(record.id)}>
                      <VisibilityIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          {/* Records by Category */}
          {Object.entries(recordsByCategory).map(([category, categoryRecords]) => (
            <Accordion key={category}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box display="flex" alignItems="center" gap={2} width="100%">
                  {getCategoryIcon(category)}
                  <Typography sx={{ flexGrow: 1 }}>
                    {category.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                  </Typography>
                  <Chip label={categoryRecords.length} size="small" />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {categoryRecords.map((record) => (
                    <ListItem key={record.id} button onClick={() => handleViewRecord(record.id)}>
                      <ListItemIcon>
                        {getFileIcon(record.fileType)}
                      </ListItemIcon>
                      <ListItemText
                        primary={record.title}
                        secondary={`${format(new Date(record.date), 'MMM dd, yyyy')} • ${record.provider}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end">
                          <DownloadIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </AccordionDetails>
            </Accordion>
          ))}
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          {/* Timeline View */}
          <Box sx={{ position: 'relative', pl: 4 }}>
            <Box
              sx={{
                position: 'absolute',
                left: '20px',
                top: 0,
                bottom: 0,
                width: '2px',
                bgcolor: 'divider'
              }}
            />
            {filteredRecords.map((record, index) => (
              <Box key={record.id} sx={{ mb: 3, position: 'relative' }}>
                <Box
                  sx={{
                    position: 'absolute',
                    left: '-24px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    border: '2px solid',
                    borderColor: 'background.paper'
                  }}
                />
                <Card>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="start">
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary">
                          {format(new Date(record.date), 'MMMM dd, yyyy')}
                        </Typography>
                        <Typography variant="h6">
                          {record.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {record.provider} • {record.facility}
                        </Typography>
                        <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                          {record.tags.map((tag, idx) => (
                            <Chip key={idx} label={tag} size="small" />
                          ))}
                        </Box>
                      </Box>
                      <Button
                        size="small"
                        startIcon={<VisibilityIcon />}
                        onClick={() => handleViewRecord(record.id)}
                      >
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        </TabPanel>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          if (selectedRecord) {
            handleViewRecord(selectedRecord.id);
          }
        }}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 20 }} />
          View
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Download
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PrintIcon sx={{ mr: 1, fontSize: 20 }} />
          Print
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon sx={{ mr: 1, fontSize: 20 }} />
          Share
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleMenuClose}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Medical Record</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Select files to upload or drag and drop
            </Typography>
            <Box
              sx={{
                mt: 2,
                p: 4,
                border: '2px dashed',
                borderColor: 'divider',
                borderRadius: 2,
                textAlign: 'center',
                cursor: 'pointer',
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1">
                Click to browse or drag files here
              </Typography>
              <Typography variant="caption" color="textSecondary">
                PDF, JPG, PNG up to 10MB
              </Typography>
            </Box>
          </Box>
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
