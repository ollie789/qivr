import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import apiClient from '../lib/api-client';

interface FileUploadProps {
  patientId?: string;
  category?: string;
  onUpload?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  accept?: Record<string, string[]>;
  maxFiles?: number;
  maxSize?: number; // in bytes
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
}

interface FileWithProgress extends File {
  progress?: number;
  status?: 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const FileUpload: React.FC<FileUploadProps> = ({
  patientId,
  category = 'general',
  onUpload,
  onError,
  accept = {
    'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  },
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);

  const uploadFile = useCallback(async (file: FileWithProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    if (patientId) formData.append('patientId', patientId);
    formData.append('category', category);

    try {
      // Update file status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.name === file.name
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      );

      const response = await apiClient.post('/api/Documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          
          setFiles(prev =>
            prev.map(f =>
              f.name === file.name
                ? { ...f, progress }
                : f
            )
          );
        },
      });

      const uploadedFile: UploadedFile = {
        id: response.data.id,
        name: response.data.name,
        size: response.data.size,
        type: response.data.contentType,
        url: response.data.url,
        uploadedAt: new Date(response.data.uploadedAt),
      };

      // Update file status to success
      setFiles(prev =>
        prev.map(f =>
          f.name === file.name
            ? { ...f, status: 'success' as const, progress: 100, uploadedFile }
            : f
        )
      );

      return uploadedFile;
    } catch (error) {
      // Update file status to error
      const errorMessage = error instanceof Error 
        ? error.message 
        : (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed';
      setFiles(prev =>
        prev.map(f =>
          f.name === file.name
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        )
      );
      throw error;
    }
  }, [patientId, category]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      progress: 0,
      status: 'uploading' as const,
    }));

    setFiles(prev => [...prev, ...newFiles]);

    const uploadedFiles: UploadedFile[] = [];
    const errors: string[] = [];

    for (const file of newFiles) {
      try {
        const uploaded = await uploadFile(file as FileWithProgress);
        uploadedFiles.push(uploaded);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`${file.name}: ${errorMessage}`);
      }
    }

    if (uploadedFiles.length > 0 && onUpload) {
      onUpload(uploadedFiles);
    }

    if (errors.length > 0 && onError) {
      onError(errors.join(', '));
    }
  }, [uploadFile, onUpload, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxFiles,
    maxSize,
  });

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Box>
      <Paper
        {...getRootProps()}
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          '&:hover': {
            borderColor: 'primary.main',
            backgroundColor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <Box sx={{ textAlign: 'center' }}>
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to select'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supported formats: Images, PDF, Word documents
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Max file size: {formatFileSize(maxSize)} | Max files: {maxFiles}
          </Typography>
        </Box>
      </Paper>

      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((file) => (
            <ListItem
              key={file.name}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => removeFile(file.name)}
                  disabled={file.status === 'uploading'}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemIcon>
                {file.status === 'success' ? (
                  <SuccessIcon color="success" />
                ) : file.status === 'error' ? (
                  <ErrorIcon color="error" />
                ) : (
                  <FileIcon />
                )}
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{file.name}</Typography>
                    <Chip
                      label={formatFileSize(file.size)}
                      size="small"
                      variant="outlined"
                    />
                    {file.status === 'uploading' && (
                      <Chip
                        label={`${file.progress}%`}
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                }
                secondary={
                  file.status === 'uploading' ? (
                    <LinearProgress
                      variant="determinate"
                      value={file.progress || 0}
                      sx={{ mt: 1 }}
                    />
                  ) : file.error ? (
                    <Alert severity="error" sx={{ mt: 1, py: 0 }}>
                      {file.error}
                    </Alert>
                  ) : null
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default FileUpload;
