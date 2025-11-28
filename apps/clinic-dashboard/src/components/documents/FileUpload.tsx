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
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { documentsApi, type Document } from '../../services/documentsApi';
import { AuraEmptyState, Callout } from '@qivr/design-system';

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
    try {
      // Update file status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.name === file.name
            ? { ...f, status: 'uploading' as const, progress: 0 }
            : f
        )
      );

      const document: Document = await documentsApi.upload(
        {
          file,
          category,
          patientId,
        },
        (progress) => {
          setFiles(prev =>
            prev.map(f =>
              f.name === file.name
                ? { ...f, progress }
                : f
            )
          );
        },
      );

      const uploadedFile: UploadedFile = {
        id: document.id,
        name: document.fileName,
        size: document.fileSize,
        type: document.mimeType,
        url: document.url ?? '',
        uploadedAt: new Date(document.uploadedAt),
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
      let errorMessage = 'Upload failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        const maybe = error as { problem?: { detail?: string; title?: string }; message?: string };
        errorMessage = maybe.problem?.detail || maybe.problem?.title || maybe.message || errorMessage;
      }
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
          border: 2,
          borderStyle: 'dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <AuraEmptyState
          icon={<UploadIcon />}
          title={isDragActive ? 'Drop files here...' : 'Drag & drop files here'}
          description={`Supported formats: Images, PDF, Word documents. Max file size: ${formatFileSize(maxSize)} | Max files: ${maxFiles}`}
        />
      </Paper>

      {files.length > 0 && (
        <List sx={{ mt: 2 }}>
          {files.map((file) => (
            <ListItem
              key={file.name}
              secondaryAction={
                <IconButton
                  edge="end"
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
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                    <Typography variant="body2">{file.name}</Typography>
                    <Chip label={formatFileSize(file.size)} size="small" variant="outlined" />
                    {file.status === 'uploading' && (
                      <Chip label={`${file.progress}%`} size="small" color="primary" />
                    )}
                  </Box>
                }
                secondary={
                  file.status === 'uploading' ? (
                    <LinearProgress variant="determinate" value={file.progress || 0} sx={{ mt: 1 }} />
                  ) : file.error ? (
                    <Callout variant="error">
                      {file.error}
                    </Callout>
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
