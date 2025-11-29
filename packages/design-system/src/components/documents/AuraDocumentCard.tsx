import { glassTokens, auraTokens } from '../../theme/auraTokens';
import React from "react";
import { Box, Typography, Stack, IconButton, Chip, Paper, alpha, useTheme } from "@mui/material";
import { Download, Visibility, MoreVert, InsertDriveFile, Image, PictureAsPdf } from "@mui/icons-material";
import { format } from "date-fns";

interface AuraDocumentCardProps {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy?: string;
  category?: string;
  onView: () => void;
  onDownload: () => void;
}

export const AuraDocumentCard: React.FC<AuraDocumentCardProps> = ({
  name,
  type,
  size,
  uploadedAt,
  uploadedBy,
  category,
  onView,
  onDownload,
}) => {
  const theme = useTheme();

  const getFileConfig = () => {
    if (type.includes("pdf")) return { icon: PictureAsPdf, color: theme.palette.error.main };
    if (type.includes("image")) return { icon: Image, color: theme.palette.primary.main };
    return { icon: InsertDriveFile, color: theme.palette.grey[500] };
  };

  const { icon: FileIcon, color: fileColor } = getFileConfig();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        cursor: "pointer",
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        transition: "all 0.2s ease-in-out",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: glassTokens.shadow.standard,
          borderColor: alpha(fileColor, 0.3),
        },
      }}
      onClick={onView}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: alpha(fileColor, 0.1),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <FileIcon sx={{ fontSize: auraTokens.iconSize.lg, color: fileColor }} />
          </Box>

          <Box flex={1} minWidth={0}>
            <Typography variant="subtitle2" fontWeight={600} noWrap>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {size} • {format(new Date(uploadedAt), "MMM d, yyyy")}
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={(e) => e.stopPropagation()}
            sx={{ color: 'text.secondary' }}
          >
            <MoreVert fontSize="small" />
          </IconButton>
        </Stack>

        {(category || uploadedBy) && (
          <Stack direction="row" spacing={1} alignItems="center">
            {category && (
              <Chip
                label={category}
                size="small"
                sx={{
                  height: 24,
                  fontSize: "0.75rem",
                  bgcolor: alpha(fileColor, 0.1),
                  color: fileColor,
                }}
              />
            )}
            {uploadedBy && (
              <Typography variant="caption" color="text.secondary">
                by {uploadedBy}
              </Typography>
            )}
          </Stack>
        )}

        <Stack direction="row" spacing={1}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            sx={{ bgcolor: "action.hover", borderRadius: 2 }}
          >
            <Visibility sx={{ fontSize: auraTokens.iconSize.sm }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            sx={{ bgcolor: "action.hover", borderRadius: 2 }}
          >
            <Download sx={{ fontSize: auraTokens.iconSize.sm }} />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
};
