import { useState, useCallback } from "react";
import { Box, Typography, Alert, IconButton } from "@mui/material";
import { CloudUpload, Close, InsertDriveFile } from "@mui/icons-material";

interface DocumentUploaderProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number; // in MB
  disabled?: boolean;
}

export default function DocumentUploader({
  onFileSelect,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSize = 50,
  disabled = false,
}: DocumentUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const validateFile = (file: File): string | null => {
    const maxBytes = maxSize * 1024 * 1024;
    if (file.size > maxBytes) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    const acceptedTypes = accept.split(",").map((t) => t.trim());
    if (!acceptedTypes.includes(extension)) {
      return `File type ${extension} not accepted`;
    }

    return null;
  };

  const handleFile = (file: File) => {
    setError(null);
    const validationError = validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        handleFile(files[0]);
      }
    },
    [disabled],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (disabled) return;

    const files = e.target.files;
    if (files && files[0]) {
      handleFile(files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setError(null);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {selectedFile ? (
        <Box
          sx={{
            border: "2px solid",
            borderColor: "primary.main",
            borderRadius: 2,
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            bgcolor: "primary.50",
          }}
        >
          <InsertDriveFile color="primary" />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" fontWeight={500}>
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatFileSize(selectedFile.size)}
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleClear} disabled={disabled}>
            <Close />
          </IconButton>
        </Box>
      ) : (
        <Box
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          sx={{
            border: "2px dashed",
            borderColor: dragActive ? "primary.main" : "grey.300",
            borderRadius: 2,
            p: 4,
            textAlign: "center",
            bgcolor: dragActive ? "primary.50" : "grey.50",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            "&:hover": disabled
              ? {}
              : {
                  borderColor: "primary.main",
                  bgcolor: "primary.50",
                },
          }}
        >
          <input
            type="file"
            id="file-upload"
            accept={accept}
            onChange={handleChange}
            disabled={disabled}
            style={{ display: "none" }}
          />
          <label
            htmlFor="file-upload"
            style={{ cursor: disabled ? "not-allowed" : "pointer" }}
          >
            <CloudUpload sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Drag and drop file here
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              sx={{ mt: 1 }}
            >
              Accepted: {accept} (Max {maxSize}MB)
            </Typography>
          </label>
        </Box>
      )}
    </Box>
  );
}
