import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Divider,
} from '@mui/material';
import { CloudUpload as UploadIcon, Star as StarIcon, StarBorder as StarBorderIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import type { DocumentCategory, DocumentSummary, UploadDocumentInput } from '../../../types';
import { fetchDocuments, toggleStar, deleteDocument, uploadDocument } from '../../../services/documentsApi';

interface UploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: UploadDocumentInput) => void;
  uploadProgress: number;
  uploading: boolean;
}

const categories: DocumentCategory[] = [
  'medical',
  'insurance',
  'lab',
  'imaging',
  'prescription',
  'billing',
  'legal',
  'other',
];

const UploadDialog: React.FC<UploadDialogProps> = ({ open, onClose, onSubmit, uploadProgress, uploading }) => {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>('medical');
  const [tags, setTags] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.files?.[0] ?? null;
    setFile(next);
  };

  useEffect(() => {
    if (!open) {
      setFile(null);
      setTags('');
      setCategory('medical');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!file) return;
    const tagList = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    onSubmit({ file, category, tags: tagList });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Upload Document</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Button component="label" variant="outlined" startIcon={<UploadIcon />}>
            {file ? file.name : 'Select File'}
            <input type="file" hidden onChange={handleFileChange} />
          </Button>

          <FormControl fullWidth>
            <InputLabel id="document-category-label">Category</InputLabel>
            <Select
              labelId="document-category-label"
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value as DocumentCategory)}
            >
              {categories.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Tags (comma separated)"
            value={tags}
            onChange={(event) => setTags(event.target.value)}
            fullWidth
          />

          {uploading && <LinearProgress variant="determinate" value={uploadProgress} />}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={!file || uploading} variant="contained">
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const EMPTY_SUMMARY: DocumentSummary[] = [];

const DocumentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const filters = useMemo(() => ({
    category,
    search: searchTerm || undefined,
  }), [category, searchTerm]);

  const { data: documents = EMPTY_SUMMARY, isLoading: documentsLoading } = useQuery<DocumentSummary[]>({
    queryKey: ['documents', filters.category, filters.search],
    queryFn: () =>
      fetchDocuments({
        category: filters.category === 'all' ? undefined : (filters.category as DocumentCategory),
        search: filters.search,
      }),
  });

  const uploadMutation = useMutation({
    mutationFn: (input: UploadDocumentInput) => uploadDocument(input, (percent) => setUploadProgress(percent ?? 0)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadDialogOpen(false);
      setUploadProgress(0);
    },
    onSettled: () => setUploadProgress(0),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const starMutation = useMutation({
    mutationFn: ({ id, starred }: { id: string; starred: boolean }) => toggleStar(id, starred),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const stats = useMemo(() => ({
    total: documents.length,
    medical: documents.filter((doc) => doc.category === 'medical').length,
    insurance: documents.filter((doc) => doc.category === 'insurance').length,
    verified: documents.filter((doc) => doc.verified).length,
    shared: documents.filter((doc) => doc.sharedWith.length > 0).length,
  }), [documents]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const matchesCategory = category === 'all' || document.category === category;
      const matchesSearch = !filters.search || document.name.toLowerCase().includes(filters.search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [documents, category, filters.search]);

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }} justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Securely manage uploaded files and quickly access recent records.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <TextField
            size="small"
            placeholder="Search documents"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <FormControl size="small">
            <InputLabel id="documents-category-label">Category</InputLabel>
            <Select
              labelId="documents-category-label"
              value={category}
              label="Category"
              onChange={(event) => setCategory(event.target.value as DocumentCategory | 'all')}
            >
              <MenuItem value="all">All</MenuItem>
              {categories.map((option) => (
                <MenuItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload
          </Button>
        </Stack>
      </Stack>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Total</Typography>
              <Typography variant="h5">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Medical</Typography>
              <Typography variant="h5">{stats.medical}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Verified</Typography>
              <Typography variant="h5">{stats.verified}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>Shared</Typography>
              <Typography variant="h5">{stats.shared}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Document Library
          </Typography>
          {documentsLoading ? (
            <LinearProgress />
          ) : filteredDocuments.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No documents found.
            </Typography>
          ) : (
            <List>
              {filteredDocuments.map((document) => (
                <React.Fragment key={document.id}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={document.name}
                      secondary={`Uploaded ${format(parseISO(document.uploadedDate), 'MMM dd, yyyy')} • ${document.category}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() =>
                          starMutation.mutate({ id: document.id, starred: !document.starred })
                        }
                        aria-label={document.starred ? 'Unstar' : 'Star'}
                      >
                        {document.starred ? <StarIcon color="warning" /> : <StarBorderIcon />}
                      </IconButton>
                      <IconButton
                        edge="end"
                        sx={{ ml: 1 }}
                        onClick={() => deleteMutation.mutate(document.id)}
                        aria-label="Delete"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <UploadDialog
        open={uploadDialogOpen}
        onClose={() => {
          setUploadDialogOpen(false);
          setUploadProgress(0);
        }}
        onSubmit={(input) => uploadMutation.mutate(input)}
        uploadProgress={uploadProgress}
        uploading={uploadMutation.isPending}
      />
    </Box>
  );
};

export default DocumentsPage;
