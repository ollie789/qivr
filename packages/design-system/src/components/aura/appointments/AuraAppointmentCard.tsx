import { auraTokens } from '../../../theme/auraTokens';
import React from "react";
import { Box, Typography, Stack, Avatar, Chip, IconButton } from "@mui/material";
import { VideoCall, Phone, MoreVert } from "@mui/icons-material";
import { format } from "date-fns";
import { glassCard } from '../../../styles/glassmorphism';

interface AuraAppointmentCardProps {
  id: string;
  patientName: string;
  patientAvatar?: string;
  appointmentType: string;
  startTime: string;
  duration: number;
  status: "scheduled" | "in-progress" | "completed" | "cancelled";
  locationType?: "in-person" | "video" | "phone";
  onClick: () => void;
}

export const AuraAppointmentCard: React.FC<AuraAppointmentCardProps> = ({
  patientName,
  patientAvatar,
  appointmentType,
  startTime,
  duration,
  status,
  locationType = "in-person",
  onClick,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "scheduled": return "#3b82f6";
      case "in-progress": return "#f59e0b";
      case "completed": return "#10b981";
      case "cancelled": return "#ef4444";
      default: return "#6b7280";
    }
  };

  const getLocationIcon = () => {
    if (locationType === "video") return <VideoCall sx={{ fontSize: 16 }} />;
    if (locationType === "phone") return <Phone sx={{ fontSize: 16 }} />;
    return undefined;
  };

  return (
    <Box
      sx={{
        ...glassCard,
        p: 2.5,
        cursor: "pointer",
        borderLeft: `4px solid ${getStatusColor()}`,
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
        transition: "all 0.3s ease",
      }}
      onClick={onClick}
    >
      <Stack spacing={2}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Stack direction="row" spacing={1.5} alignItems="center" flex={1}>
            <Avatar src={patientAvatar} sx={{ width: 40, height: 40 }}>
              {patientName[0]}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" fontWeight={600}>
                {patientName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {appointmentType}
              </Typography>
            </Box>
          </Stack>
          <IconButton size="small" sx={{ opacity: 0.6 }}>
            <MoreVert fontSize="small" />
          </IconButton>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          <Chip
            label={format(new Date(startTime), "h:mm a")}
            size="small"
            sx={{
              bgcolor: `${getStatusColor()}15`,
              color: getStatusColor(),
              fontWeight: 600,
              fontSize: "0.7rem",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {duration} min
          </Typography>
          {locationType !== "in-person" && (
            <Chip
              icon={getLocationIcon()}
              label={locationType}
              size="small"
              variant="outlined"
              sx={{ fontSize: "0.7rem", height: 22 }}
            />
          )}
          <Chip
            label={status}
            size="small"
            sx={{
              bgcolor: `${getStatusColor()}15`,
              color: getStatusColor(),
              fontWeight: 600,
              fontSize: "0.7rem",
              textTransform: "capitalize",
            }}
          />
        </Stack>
      </Stack>
    </Box>
  );
};
