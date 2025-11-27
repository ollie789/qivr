import { auraTokens } from '../../theme/auraTokens';
import React from "react";
import { Box, Typography, Stack, IconButton, Chip } from "@mui/material";
import { Download, Visibility, MoreVert, InsertDriveFile, Image, PictureAsPdf } from "@mui/icons-material";
import { format } from "date-fns";
import { glassCard } from '../../styles/glassmorphism';

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
  const getFileIcon = () => {
    if (type.includes("pdf")) return <PictureAsPdf sx={{ fontSize: 32, color: "#ef4444" }} />;
    if (type.includes("image")) return <Image sx={{ fontSize: 32, color: "#3b82f6" }} />;
    return <InsertDriveFile sx={{ fontSize: 32, color: "#6b7280" }} />;
  };

  const getFileColor = () => {
    if (type.includes("pdf")) return "#ef4444";
    if (type.includes("image")) return "#3b82f6";
    return "#6b7280";
  };

  return (
    <Box
      sx={{
        ...glassCard,
        p: 2.5,
        cursor: "pointer",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 12px 32px rgba(0,0,0,0.15)",
        },
        transition: "all 0.3s ease",
      }}
      onClick={onView}
    >
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="flex-start">
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: auraTokens.borderRadius.md,
              bgcolor: `${getFileColor()}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {getFileIcon()}
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
            onClick={(e) => {
              e.stopPropagation();
            }}
            sx={{ opacity: 0.6 }}
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
                  height: 22,
                  fontSize: "0.7rem",
                  bgcolor: `${getFileColor()}15`,
                  color: getFileColor(),
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
            sx={{ bgcolor: "action.hover" }}
          >
            <Visibility sx={{ fontSize: 18 }} />
          </IconButton>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            sx={{ bgcolor: "action.hover" }}
          >
            <Download sx={{ fontSize: 18 }} />
          </IconButton>
        </Stack>
      </Stack>
    </Box>
  );
};
