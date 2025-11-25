import React from "react";
import { Box, Typography, Stack, Chip } from "@mui/material";
import { formatDistanceToNow } from "date-fns";
import { glassCard } from "@qivr/design-system";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  user?: string;
  icon?: React.ReactNode;
}

interface AuraActivityTimelineProps {
  activities: Activity[];
  maxItems?: number;
}

export const AuraActivityTimeline: React.FC<AuraActivityTimelineProps> = ({
  activities,
  maxItems = 10,
}) => {
  const displayActivities = activities.slice(0, maxItems);

  const getActivityColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "appointment":
        return "#3b82f6";
      case "patient":
        return "#10b981";
      case "document":
        return "#f59e0b";
      case "message":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  return (
    <Box sx={{ ...glassCard, p: 3 }}>
      <Typography variant="h6" fontWeight={700} mb={3}>
        Recent Activity
      </Typography>

      <Stack spacing={2}>
        {displayActivities.map((activity, index) => (
          <Stack
            key={activity.id}
            direction="row"
            spacing={2}
            sx={{
              position: "relative",
              pb: index < displayActivities.length - 1 ? 2 : 0,
              "&::after":
                index < displayActivities.length - 1
                  ? {
                      content: '""',
                      position: "absolute",
                      left: "19px",
                      top: "40px",
                      bottom: 0,
                      width: "2px",
                      background: "linear-gradient(180deg, rgba(59,130,246,0.3) 0%, transparent 100%)",
                    }
                  : {},
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: `${getActivityColor(activity.type)}15`,
                border: `2px solid ${getActivityColor(activity.type)}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {activity.icon || (
                <Typography variant="caption" fontWeight={700} color={getActivityColor(activity.type)}>
                  {activity.type?.[0]?.toUpperCase() || "?"}
                </Typography>
              )}
            </Box>

            <Box flex={1}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={0.5}>
                <Typography variant="body2" fontWeight={600}>
                  {activity.description}
                </Typography>
                <Chip
                  label={activity.type}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: "0.65rem",
                    bgcolor: `${getActivityColor(activity.type)}15`,
                    color: getActivityColor(activity.type),
                    fontWeight: 600,
                  }}
                />
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center">
                {activity.user && (
                  <Typography variant="caption" color="text.secondary">
                    by {activity.user}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
};
