import React, { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  Grid,
  alpha,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Description as DocumentIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  MoreVert as MoreIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { glassTokens, auraColors, AuraButton, AuraEmptyState, auraTokens } from '@qivr/design-system';

interface Document {
  id: string;
  fileName: string;
  documentType: string;
  status: string;
  createdAt: string;
  extractedPatientName?: string;
  extractedDob?: string;
  confidenceScore?: number;
  extractedText?: string;
  mimeType?: string;
}

interface DocumentsTabProps {
  documents: Document[];
  onUpload: () => void;
  onDownload: (docId: string) => void;
  onCopyText: (text: string) => void;
}

const getFileIcon = (mimeType?: string, fileName?: string) => {
  if (mimeType?.includes('pdf') || fileName?.endsWith('.pdf')) {
    return <PdfIcon />;
  }
  if (mimeType?.includes('image') || /\.(jpg|jpeg|png|gif)$/i.test(fileName || '')) {
    return <ImageIcon />;
  }
  return <DocumentIcon />;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ready':
      return auraColors.green.main;
    case 'processing':
      return auraColors.orange.main;
    case 'error':
      return auraColors.red.main;
    default:
      return auraColors.grey[500];
  }
};

const DocumentCard: React.FC<{
  doc: Document;
  onDownload: () => void;
  onCopyText: () => void;
}> = ({ doc, onDownload, onCopyText }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: auraTokens.avatar.md,
            height: auraTokens.avatar.md,
            borderRadius: auraTokens.borderRadius.sm,
            bgcolor: alpha(auraColors.blue.main, 0.1),
            color: auraColors.blue.main,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '& svg': { fontSize: auraTokens.iconSize.lg },
          }}
        >
          {getFileIcon(doc.mimeType, doc.fileName)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap title={doc.fileName}>
            {doc.fileName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(parseISO(doc.createdAt), 'MMM d, yyyy')}
          </Typography>
        </Box>
        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}>
          <MoreIcon fontSize="small" />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
          <MenuItem
            onClick={() => {
              onDownload();
              setAnchorEl(null);
            }}
          >
            <ListItemIcon>
              <DownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Download</ListItemText>
          </MenuItem>
          {doc.extractedText && (
            <MenuItem
              onClick={() => {
                onCopyText();
                setAnchorEl(null);
              }}
            >
              <ListItemIcon>
                <CopyIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText>Copy Text</ListItemText>
            </MenuItem>
          )}
        </Menu>
      </Box>

      {/* Tags */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
        <Chip
          label={doc.documentType}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.75rem',
            bgcolor: alpha(auraColors.blue.main, 0.1),
            color: auraColors.blue.main,
          }}
        />
        <Chip
          label={doc.status}
          size="small"
          sx={{
            height: 24,
            fontSize: '0.75rem',
            bgcolor: alpha(getStatusColor(doc.status), 0.1),
            color: getStatusColor(doc.status),
          }}
        />
        {doc.confidenceScore && (
          <Chip
            label={`${doc.confidenceScore}% confidence`}
            size="small"
            variant="outlined"
            sx={{ height: 24, fontSize: '0.75rem' }}
          />
        )}
      </Box>

      {/* Extracted Info */}
      {(doc.extractedPatientName || doc.extractedDob) && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: 'action.hover',
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Extracted Information
          </Typography>
          {doc.extractedPatientName && (
            <Typography variant="body2">Name: {doc.extractedPatientName}</Typography>
          )}
          {doc.extractedDob && (
            <Typography variant="body2">DOB: {doc.extractedDob}</Typography>
          )}
        </Box>
      )}

      {/* Extracted Text Preview */}
      {doc.extractedText && (
        <Box sx={{ flex: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Extracted Text
          </Typography>
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'grey.50',
              borderRadius: 2,
              maxHeight: expanded ? 300 : 80,
              overflow: 'hidden',
              position: 'relative',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: 'text.secondary',
            }}
          >
            {doc.extractedText}
            {!expanded && doc.extractedText.length > 200 && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 40,
                  background: 'linear-gradient(transparent, var(--mui-palette-grey-50))',
                }}
              />
            )}
          </Box>
          {doc.extractedText.length > 200 && (
            <Typography
              variant="caption"
              color="primary"
              sx={{ cursor: 'pointer', mt: 0.5, display: 'inline-block' }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? 'Show less' : 'Show more'}
            </Typography>
          )}
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 1, mt: 'auto', pt: 2 }}>
        <AuraButton
          variant="outlined"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={onDownload}
          fullWidth
        >
          Download
        </AuraButton>
        {doc.extractedText && (
          <AuraButton
            variant="outlined"
            size="small"
            startIcon={<CopyIcon />}
            onClick={onCopyText}
            fullWidth
          >
            Copy
          </AuraButton>
        )}
      </Box>
    </Box>
  );
};

export const DocumentsTab: React.FC<DocumentsTabProps> = ({
  documents,
  onUpload,
  onDownload,
  onCopyText,
}) => {
  const [filter, setFilter] = useState<'all' | 'ready' | 'processing'>('all');

  const filteredDocs = filter === 'all' ? documents : documents.filter((d) => d.status === filter);

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Documents
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Medical documents, reports, and extracted information
          </Typography>
        </Box>
        <AuraButton variant="contained" startIcon={<UploadIcon />} onClick={onUpload}>
          Upload Document
        </AuraButton>
      </Box>

      {documents.length === 0 ? (
        <AuraEmptyState
          title="No documents uploaded"
          description="Upload medical documents to keep records organized"
        />
      ) : (
        <>
          {/* Stats & Filters */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {[
                { label: 'All', value: 'all', count: documents.length },
                { label: 'Ready', value: 'ready', count: documents.filter((d) => d.status === 'ready').length },
                { label: 'Processing', value: 'processing', count: documents.filter((d) => d.status === 'processing').length },
              ].map((option) => (
                <Chip
                  key={option.value}
                  label={`${option.label} (${option.count})`}
                  onClick={() => setFilter(option.value as any)}
                  variant={filter === option.value ? 'filled' : 'outlined'}
                  sx={{
                    bgcolor: filter === option.value ? 'primary.main' : 'transparent',
                    color: filter === option.value ? 'primary.contrastText' : 'text.primary',
                  }}
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary">
              {filteredDocs.length} document{filteredDocs.length !== 1 && 's'}
            </Typography>
          </Box>

          {/* Documents Grid */}
          <Grid container spacing={2.5}>
            {filteredDocs.map((doc) => (
              <Grid key={doc.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <DocumentCard
                  doc={doc}
                  onDownload={() => onDownload(doc.id)}
                  onCopyText={() => onCopyText(doc.extractedText || '')}
                />
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default DocumentsTab;
