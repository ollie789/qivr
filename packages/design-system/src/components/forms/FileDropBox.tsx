import { useState, useCallback, DragEvent, ChangeEvent } from 'react';
import { Box, Stack, Typography, IconButton, Avatar } from '@mui/material';
import { CloudUpload, Close, InsertDriveFile } from '@mui/icons-material';
import { auraTokens } from '../../theme/auraTokens';

export interface FileDropBoxProps {
  onFilesChange: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  error?: boolean;
  helperText?: string;
}

export const FileDropBox = ({
  onFilesChange,
  accept = '*',
  multiple = true,
  maxFiles = 5,
  error = false,
  helperText,
}: FileDropBoxProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback((newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles).slice(0, maxFiles);
    setFiles(fileArray);
    onFilesChange(fileArray);
  }, [maxFiles, onFilesChange]);

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    onFilesChange(newFiles);
  };

  return (
    <Stack spacing={1}>
      <Box
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        sx={{
          p: auraTokens.spacing.lg,
          border: '2px dashed',
          borderColor: error ? 'error.main' : dragActive ? 'primary.main' : 'divider',
          borderRadius: auraTokens.borderRadius.lg,
          bgcolor: dragActive ? 'primary.lighter' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: auraTokens.transitions.default,
          '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
        }}
        component="label"
      >
        <input type="file" hidden accept={accept} multiple={multiple} onChange={handleChange} />
        <CloudUpload sx={{ fontSize: auraTokens.iconSize.xl, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Drop files here or click to upload
        </Typography>
        {helperText && (
          <Typography variant="caption" color={error ? 'error' : 'text.secondary'}>
            {helperText}
          </Typography>
        )}
      </Box>

      {files.length > 0 && (
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {files.map((file, index) => (
            <Box key={index} sx={{ position: 'relative' }}>
              <Avatar variant="rounded" sx={{ width: 56, height: 56, bgcolor: 'grey.100' }}>
                {file.type.startsWith('image/') ? (
                  <Box component="img" src={URL.createObjectURL(file)} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <InsertDriveFile />
                )}
              </Avatar>
              <IconButton
                size="small"
                onClick={() => removeFile(index)}
                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'background.paper', boxShadow: 1 }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  );
};
