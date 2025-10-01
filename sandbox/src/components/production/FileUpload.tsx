import React, { useCallback, useState } from 'react';
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
  Button,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CheckCircle as SuccessIcon,
  CheckCircle,
  Error as ErrorIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Description as DocIcon,
  AttachFile as AttachIcon,
} from '@mui/icons-material';

interface FileUploadProps {
  patientId?: string;
  category?: string;
  onUpload?: (files: UploadedFile[]) => void;
  onError?: (error: string) => void;
  accept?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  multiple?: boolean;
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadedAt: Date;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  uploadedFile?: UploadedFile;
}

const FileUpload: React.FC<FileUploadProps> = ({
  patientId,
  category = 'general',
  onUpload,
  onError,
  accept = ['.pdf', '.png', '.jpg', '.jpeg', '.doc', '.docx'],
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB
  multiple = true,
}) => {
  const theme = useTheme();
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PdfIcon sx={{ color: '#d32f2f' }} />;
    if (fileType.includes('image')) return <ImageIcon sx={{ color: '#388e3c' }} />;
    if (fileType.includes('doc')) return <DocIcon sx={{ color: '#1976d2' }} />;
    return <FileIcon sx={{ color: theme.palette.text.secondary }} />;
  };

  const simulateUpload = async (fileWithProgress: FileWithProgress): Promise<UploadedFile> => {
    return new Promise((resolve, reject) => {
      const interval = setInterval(() => {
        setFiles(prev =>
          prev.map(f =>
            f.file.name === fileWithProgress.file.name
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        );
      }, 200);

      setTimeout(() => {
        clearInterval(interval);
        
        // Simulate random success/failure
        if (Math.random() > 0.1) {
          const uploadedFile: UploadedFile = {
            id: Math.random().toString(36).substr(2, 9),
            name: fileWithProgress.file.name,
            size: fileWithProgress.file.size,
            type: fileWithProgress.file.type,
            url: URL.createObjectURL(fileWithProgress.file),
            uploadedAt: new Date(),
          };
          
          setFiles(prev =>
            prev.map(f =>
              f.file.name === fileWithProgress.file.name
                ? { ...f, status: 'success', progress: 100, uploadedFile }
                : f
            )
          );
          
          resolve(uploadedFile);
        } else {
          setFiles(prev =>
            prev.map(f =>
              f.file.name === fileWithProgress.file.name
                ? { ...f, status: 'error', error: 'Upload failed' }
                : f
            )
          );
          reject(new Error('Upload failed'));
        }
      }, 2000);
    });
  };

  const handleFiles = useCallback(async (acceptedFiles: File[]) => {
    // Validate file count
    if (files.length + acceptedFiles.length > maxFiles) {
      onError?.(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate and prepare files
    const validFiles: FileWithProgress[] = [];
    const errors: string[] = [];

    for (const file of acceptedFiles) {
      if (file.size > maxSize) {
        errors.push(`${file.name}: File size exceeds ${formatFileSize(maxSize)}`);
        continue;
      }
      
      validFiles.push({
        file,
        progress: 0,
        status: 'pending',
      });
    }

    if (errors.length > 0 && onError) {
      onError(errors.join(', '));
    }

    if (validFiles.length === 0) return;

    // Add files to state
    setFiles(prev => [...prev, ...validFiles]);

    // Start uploading
    const uploadedFiles: UploadedFile[] = [];
    
    for (const fileWithProgress of validFiles) {
      setFiles(prev =>
        prev.map(f =>
          f.file.name === fileWithProgress.file.name
            ? { ...f, status: 'uploading', progress: 0 }
            : f
        )
      );

      try {
        const uploaded = await simulateUpload(fileWithProgress);
        uploadedFiles.push(uploaded);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }

    if (uploadedFiles.length > 0 && onUpload) {
      onUpload(uploadedFiles);
    }
  }, [files.length, maxFiles, maxSize, onError, onUpload]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.file.name !== fileName));
  };

  const getStatusColor = (status: FileWithProgress['status']) => {
    switch (status) {
      case 'success': return theme.palette.success.main;
      case 'error': return theme.palette.error.main;
      case 'uploading': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  return (
    <Box>
      {/* Drop Zone */}
      <Paper
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        sx={{
          p: 4,
          mb: 3,
          border: '2px dashed',
          borderColor: isDragging ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3),
          backgroundColor: isDragging 
            ? alpha(theme.palette.primary.main, 0.05)
            : alpha(theme.palette.background.paper, 0.5),
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <input
          type="file"
          multiple={multiple}
          accept={accept.join(',')}
          onChange={handleFileSelect}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0,
            cursor: 'pointer',
          }}
        />
        
        <UploadIcon sx={{ fontSize: 48, color: theme.palette.primary.main, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragging ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Supported formats: {accept.join(', ')}
          </Typography>
          <br />
          <Typography variant="caption" color="text.secondary">
            Max file size: {formatFileSize(maxSize)}
          </Typography>
        </Box>
      </Paper>

      {/* File List */}
      {files.length > 0 && (
        <Paper sx={{ p: 2, ...{ backdropFilter: 'blur(10px)' } }}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Files ({files.length}/{maxFiles})
          </Typography>
          <List>
            {files.map((fileWithProgress) => (
              <ListItem
                key={fileWithProgress.file.name}
                sx={{
                  mb: 1,
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  borderRadius: 1,
                  border: `1px solid ${alpha(getStatusColor(fileWithProgress.status), 0.2)}`,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <ListItemIcon>
                  {fileWithProgress.status === 'success' ? (
                    <SuccessIcon sx={{ color: theme.palette.success.main }} />
                  ) : fileWithProgress.status === 'error' ? (
                    <ErrorIcon sx={{ color: theme.palette.error.main }} />
                  ) : (
                    getFileIcon(fileWithProgress.file.type)
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {fileWithProgress.file.name}
                      </Typography>
                      <Chip
                        label={formatFileSize(fileWithProgress.file.size)}
                        size="small"
                        variant="outlined"
                      />
                      {fileWithProgress.status === 'success' && (
                        <Chip
                          label="Uploaded"
                          size="small"
                          color="success"
                          sx={{ height: 20 }}
                        />
                      )}
                      {fileWithProgress.status === 'error' && (
                        <Chip
                          label={fileWithProgress.error || 'Failed'}
                          size="small"
                          color="error"
                          sx={{ height: 20 }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    fileWithProgress.status === 'uploading' && (
                      <Box sx={{ mt: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={fileWithProgress.progress}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption" color="text.secondary">
                            {fileWithProgress.progress}%
                          </Typography>
                        </Box>
                      </Box>
                    )
                  }
                />
                <IconButton
                  size="small"
                  onClick={() => removeFile(fileWithProgress.file.name)}
                  disabled={fileWithProgress.status === 'uploading'}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
                
                {/* Background progress indicator */}
                {fileWithProgress.status === 'uploading' && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${fileWithProgress.progress}%`,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      transition: 'width 0.3s ease',
                      zIndex: 0,
                    }}
                  />
                )}
              </ListItem>
            ))}
          </List>
          
          {files.some(f => f.status === 'success') && (
            <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<CheckCircle />}
                onClick={() => setFiles([])}
              >
                Clear All
              </Button>
              <Button
                variant="outlined"
                onClick={() => setFiles(prev => prev.filter(f => f.status !== 'success'))}
              >
                Remove Uploaded
              </Button>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default FileUpload;