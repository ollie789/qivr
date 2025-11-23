import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  Divider,
} from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  PlayArrow as StartIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { format, isPast, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { usePromDashboardData } from "../hooks/usePromDashboardData";
import type { PromHistoryEntry, PromInstance, PromStats } from "../../../types";
import {
  InfoCard,
  AuraStatCard,
  StatCardSkeleton,
  AuraEmptyState,
} from "@qivr/design-system";

const formatDate = (date?: string) => {
  if (!date) return "No due date";
  try {
    return format(parseISO(date), "MMM dd, yyyy");
  } catch {
    return date;
  }
};

const getStatusColor = (
  instance: PromInstance,
): "default" | "warning" | "error" => {
  if (instance.status === "in-progress") return "warning";
  if (instance.dueDate && isPast(parseISO(instance.dueDate))) return "error";
  return "default";
};

const buildStats = (stats?: PromStats) => [
  {
    label: "Pending",
    value: stats?.pending ?? 0,
    helper: stats?.nextDue
      ? `Next due ${formatDate(stats.nextDue)}`
      : undefined,
  },
  {
    label: "Completed",
    value: stats?.completed ?? 0,
    helper: stats?.lastCompleted
      ? `Last completed ${formatDate(stats.lastCompleted)}`
      : undefined,
  },
  {
    label: "Average Score",
    value: stats ? `${Math.round(stats.averageScore)}%` : "—",
    helper: `Streak ${stats?.streak ?? 0} days`,
  },
];

const PromsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    pendingProms,
    promHistory,
    promStats,
    pendingLoading,
    historyLoading,
    statsLoading,
  } = usePromDashboardData();

  const stats = useMemo(() => buildStats(promStats), [promStats]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
          Patient Reported Outcomes
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track assigned questionnaires, completion progress, and recent
          history.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsLoading ? (
          <>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <StatCardSkeleton />
            </Grid>
          </>
        ) : (
          stats.map((stat) => (
            <Grid size={{ xs: 12, md: 4 }} key={stat.label}>
              <AuraStatCard
                title={stat.label}
                value={stat.value}
                subtitle={stat.helper}
                icon={<AssignmentIcon />}
              />
            </Grid>
          ))
        )}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard
            title="Pending PROMs"
            action={
              <Chip
                label={`${pendingProms.length} active`}
                color="primary"
                size="small"
              />
            }
          >
            {pendingLoading ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  Loading questionnaires…
                </Typography>
              </Box>
            ) : pendingProms.length === 0 ? (
              <AuraEmptyState
                title="No pending questionnaires"
                description="You're all caught up! Check back later for new assessments."
              />
            ) : (
              <List>
                {pendingProms.map((instance) => (
                  <React.Fragment key={instance.id}>
                    <ListItem alignItems="flex-start">
                      <ListItemText
                        primary={instance.templateName}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              Assigned {formatDate(instance.assignedDate)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Due {formatDate(instance.dueDate)}
                            </Typography>
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={instance.status.replace("-", " ")}
                            color={getStatusColor(instance)}
                            size="small"
                          />
                          <Button
                            variant="contained"
                            startIcon={<StartIcon />}
                            onClick={() =>
                              navigate(`/proms/${instance.id}/complete`)
                            }
                          >
                            Start
                          </Button>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </InfoCard>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard
            title="Recent Completions"
            action={<Chip label={`${promHistory.length}`} size="small" />}
          >
            {historyLoading ? (
              <LinearProgress />
            ) : promHistory.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No completed questionnaires yet.
              </Typography>
            ) : (
              <List>
                {promHistory.slice(0, 5).map((history: PromHistoryEntry) => (
                  <React.Fragment key={history.id}>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={history.templateName}
                        secondary={`Completed ${formatDate(history.completedDate)} • Score ${Math.round(history.percentageScore)}%`}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </InfoCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PromsPage;
