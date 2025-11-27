import { auraTokens } from '../../../theme/auraTokens';
import React from "react";
import { Box, Typography, Stack, Avatar, Badge } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { glassCard } from '../../../styles/glassmorphism';

interface AuraMessageCardProps {
  id: string;
  senderName: string;
  senderAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount?: number;
  isOnline?: boolean;
  onClick: () => void;
}

export const AuraMessageCard: React.FC<AuraMessageCardProps> = ({
  senderName,
  senderAvatar,
  lastMessage,
  timestamp,
  unreadCount = 0,
  isOnline = false,
  onClick,
}) => {
  return (
    <Box
      sx={{
        ...glassCard,
        p: 2,
        cursor: "pointer",
        borderLeft: unreadCount > 0 ? "3px solid #3b82f6" : "3px solid transparent",
        "&:hover": {
          transform: "translateX(4px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
        transition: "all 0.3s ease",
      }}
      onClick={onClick}
    >
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          variant="dot"
          sx={{
            "& .MuiBadge-badge": {
              bgcolor: isOnline ? "#10b981" : "transparent",
              width: 12,
              height: 12,
              borderRadius: "50%",
              border: "2px solid white",
            },
          }}
        >
          <Avatar src={senderAvatar} sx={{ width: 48, height: 48 }}>
            {senderName[0]}
          </Avatar>
        </Badge>

        <Box flex={1} minWidth={0}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
            <Typography variant="subtitle2" fontWeight={unreadCount > 0 ? 700 : 600}>
              {senderName}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0, ml: 1 }}>
              {formatDistanceToNow(new Date(timestamp), { addSuffix: true })}
            </Typography>
          </Stack>

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography
              variant="body2"
              color={unreadCount > 0 ? "text.primary" : "text.secondary"}
              fontWeight={unreadCount > 0 ? 600 : 400}
              noWrap
              sx={{ flex: 1 }}
            >
              {lastMessage}
            </Typography>
            {unreadCount > 0 && (
              <Box
                sx={{
                  bgcolor: "#3b82f6",
                  color: "white",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  ml: 1,
                  flexShrink: 0,
                }}
              >
                {unreadCount}
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};
