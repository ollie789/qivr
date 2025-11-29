import React, { useMemo } from "react";
import {
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  ChevronRight as ChevronRightIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  EventAvailable as EventAvailableIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Warning as WarningIcon,
  Message as MessageIcon,
  CheckCircle as CheckIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { parseISO, isPast, differenceInHours } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../../contexts/AuthContext";
import { useDashboardData } from "../hooks";
import {
  AuraStatCard,
  InfoCard,
  StatCardSkeleton,
  AuraEmptyState,
  TreatmentPlanCard,
  AuraButton,
  Callout,
  auraColors,
} from "@qivr/design-system";
import { formatDateTime, formatDueDate, getDateChipColor, getDateChipLabel } from "../../../utils";
import { getUnreadCount } from "../../../services/messagesApi";

// Types for action items
type ActionType = "appointment" | "assessment" | "message";
type ActionPriority = "urgent" | "high" | "normal";

interface ActionItem {
  id: string;
  type: ActionType;
  title: string;
  description?: string;
  priority: ActionPriority;
  dueDate?: string;
  actionLabel: string;
  actionPath: string;
}

export const DashboardPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, upcomingAppointments, pendingProms, isLoading, error } =
    useDashboardData();

  // Fetch unread messages count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-messages-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  // Build action items from appointments and PROMs
  const actionItems = useMemo(() => {
    const items: ActionItem[] = [];

    // Add upcoming appointments (next 48 hours with priority)
    upcomingAppointments.forEach((apt) => {
      const scheduledDate = parseISO(apt.scheduledStart);
      const hoursUntil = differenceInHours(scheduledDate, new Date());

      if (hoursUntil <= 48 && hoursUntil > 0) {
        let priority: ActionPriority = "normal";
        if (hoursUntil <= 2) priority = "urgent";
        else if (hoursUntil <= 24) priority = "high";

        items.push({
          id: `apt-${apt.id}`,
          type: "appointment",
          title: apt.appointmentType || "Appointment",
          description: `with ${apt.providerName}${apt.isVirtual ? " (Virtual)" : ""}`,
          priority,
          dueDate: apt.scheduledStart,
          actionLabel: apt.isVirtual ? "Join" : "View",
          actionPath: "/appointments",
        });
      }
    });

    // Add pending PROMs
    pendingProms.forEach((prom) => {
      const isOverdue = prom.scheduledFor && isPast(parseISO(prom.scheduledFor));
      const priority: ActionPriority = isOverdue ? "urgent" : "normal";

      items.push({
        id: `prom-${prom.id}`,
        type: "assessment",
        title: prom.templateName || "Health Assessment",
        description: isOverdue ? "Overdue - please complete" : "Please complete",
        priority,
        dueDate: prom.scheduledFor,
        actionLabel: "Start",
        actionPath: `/proms/${prom.id}/complete`,
      });
    });

    // Sort by priority
    const priorityOrder = { urgent: 3, high: 2, normal: 1 };
    return items.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
  }, [upcomingAppointments, pendingProms]);

  const urgentItems = actionItems.filter((i) => i.priority === "urgent");
  const displayedActions = actionItems.slice(0, 4);

  const getTypeIcon = (type: ActionType) => {
    switch (type) {
      case "appointment":
        return <EventIcon />;
      case "assessment":
        return <AssignmentIcon />;
      case "message":
        return <MessageIcon />;
    }
  };

  const getTypeColor = (type: ActionType) => {
    switch (type) {
      case "appointment":
        return auraColors.blue.main;
      case "assessment":
        return auraColors.purple.main;
      case "message":
        return auraColors.green.main;
    }
  };

  const renderActionCard = (item: ActionItem) => (
    <Paper
      key={item.id}
      sx={{
        p: 2,
        display: "flex",
        alignItems: "center",
        gap: 2,
        borderRadius: 2,
        border: `1px solid ${theme.palette.divider}`,
        bgcolor: item.priority === "urgent" ? alpha(auraColors.red.main, 0.04) : "background.paper",
        transition: "all 0.15s",
        cursor: "pointer",
        "&:hover": {
          transform: "translateX(4px)",
          boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
          borderColor: theme.palette.primary.main,
        },
      }}
      onClick={() => navigate(item.actionPath)}
    >
      <Avatar
        sx={{
          bgcolor: alpha(getTypeColor(item.type), 0.15),
          color: getTypeColor(item.type),
          width: 44,
          height: 44,
        }}
      >
        {getTypeIcon(item.type)}
      </Avatar>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {item.title}
          </Typography>
          {item.priority === "urgent" && (
            <Chip
              label="Urgent"
              size="small"
              color="error"
              sx={{ height: 20, fontSize: "0.7rem" }}
            />
          )}
        </Box>
        {item.description && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {item.description}
          </Typography>
        )}
        {item.dueDate && (
          <Typography
            variant="caption"
            color={isPast(parseISO(item.dueDate)) ? "error.main" : "text.secondary"}
            sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.5 }}
          >
            <ScheduleIcon sx={{ fontSize: 14 }} />
            {formatDueDate(item.dueDate)}
          </Typography>
        )}
      </Box>

      <AuraButton
        size="small"
        variant="outlined"
        endIcon={<ChevronRightIcon />}
        onClick={(e) => {
          e.stopPropagation();
          navigate(item.actionPath);
        }}
      >
        {item.actionLabel}
      </AuraButton>
    </Paper>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || "Patient"}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your health journey
        </Typography>
      </Box>

      {error && (
        <Box sx={{ mb: 3 }}>
          <Callout variant="error">
            Unable to load all dashboard data. Please try again later.
          </Callout>
        </Box>
      )}

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

      {/* Urgent Items Callout */}
      {!isLoading && urgentItems.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Callout variant="warning">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningIcon />
              <Typography variant="body2">
                You have <strong>{urgentItems.length}</strong> urgent item{urgentItems.length !== 1 ? "s" : ""} that need{urgentItems.length === 1 ? "s" : ""} your immediate attention.
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
              <AuraButton size="small" variant="text" onClick={() => navigate("/messages")}>
                View All
              </AuraButton>
            </Box>
          </Callout>
        </Box>
      )}

      {/* Stats Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {isLoading ? (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCardSkeleton />
            </Grid>
          </>
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Upcoming Appointments"
                value={stats?.upcomingAppointments ?? 0}
                icon={<CalendarIcon />}
                iconColor="primary"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Pending Assessments"
                value={stats?.pendingProms ?? 0}
                icon={<AssignmentIcon />}
                iconColor="warning"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Unread Messages"
                value={unreadCount}
                icon={<MessageIcon />}
                iconColor="success"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Recovery Progress"
                value="85%"
                icon={<TrendingIcon />}
                iconColor="info"
              />
            </Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={3}>
        {/* Action Items - Full Width when there are items */}
        {!isLoading && displayedActions.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <InfoCard
              title="Action Required"
              action={
                <AuraButton
                  size="small"
                  onClick={() => navigate("/messages")}
                >
                  View All
                </AuraButton>
              }
            >
              <Stack spacing={1.5}>
                {displayedActions.map(renderActionCard)}
              </Stack>
            </InfoCard>
          </Grid>
        )}

        {/* All Caught Up State */}
        {!isLoading && displayedActions.length === 0 && (
          <Grid size={{ xs: 12 }}>
            <Paper
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 2,
                bgcolor: alpha(auraColors.green.main, 0.04),
                border: `1px solid ${alpha(auraColors.green.main, 0.2)}`,
              }}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(auraColors.green.main, 0.15),
                  color: auraColors.green.main,
                  width: 56,
                  height: 56,
                  mx: "auto",
                  mb: 2,
                }}
              >
                <CheckIcon sx={{ fontSize: 32 }} />
              </Avatar>
              <Typography variant="h6" gutterBottom>
                All caught up!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You have no pending actions right now. Great job staying on top of your health!
              </Typography>
            </Paper>
          </Grid>
        )}

        {/* Treatment Plan Card - Full Width */}
        <Grid size={{ xs: 12 }}>
          <TreatmentPlanCard />
        </Grid>

        {/* Upcoming Appointments */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard
            title="Upcoming Appointments"
            action={
              <AuraButton
                size="small"
                startIcon={<AddIcon />}
                onClick={() => navigate("/appointments/book")}
              >
                Book New
              </AuraButton>
            }
          >
            {upcomingAppointments.length === 0 ? (
              <AuraEmptyState
                icon={<EventAvailableIcon />}
                title="No appointments scheduled"
                description="Book your first appointment to get started"
                actionText="Book Appointment"
                onAction={() => navigate("/appointments/book")}
              />
            ) : (
              <Stack spacing={1.5}>
                {upcomingAppointments.slice(0, 3).map((appointment) => (
                  <Paper
                    key={appointment.id}
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                    onClick={() => navigate(`/appointments`)}
                  >
                    <Avatar
                      sx={{
                        bgcolor: alpha(auraColors.blue.main, 0.15),
                        color: auraColors.blue.main,
                      }}
                    >
                      <EventIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="subtitle2" fontWeight={600}>
                          {appointment.providerName}
                        </Typography>
                        <Chip
                          label={getDateChipLabel(appointment.scheduledStart)}
                          color={getDateChipColor(appointment.scheduledStart)}
                          size="small"
                          sx={{ height: 20, fontSize: "0.7rem" }}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {appointment.appointmentType} • {formatDateTime(appointment.scheduledStart)}
                      </Typography>
                    </Box>
                    <ChevronRightIcon color="action" />
                  </Paper>
                ))}
              </Stack>
            )}
          </InfoCard>
        </Grid>

        {/* Assessments & PROMs */}
        <Grid size={{ xs: 12, md: 6 }}>
          <InfoCard
            title="Assessments & PROMs"
            action={
              <AuraButton
                size="small"
                startIcon={<ScheduleIcon />}
                onClick={() => navigate("/proms")}
              >
                View All
              </AuraButton>
            }
          >
            {pendingProms.length === 0 ? (
              <AuraEmptyState
                icon={<AssignmentTurnedInIcon />}
                title="No pending assessments"
                description="All caught up! Check back later for new assessments"
              />
            ) : (
              <Stack spacing={1.5}>
                {pendingProms.slice(0, 3).map((prom) => (
                  <Paper
                    key={prom.id}
                    sx={{
                      p: 2,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      borderRadius: 2,
                      border: `1px solid ${theme.palette.divider}`,
                      cursor: "pointer",
                      transition: "all 0.15s",
                      "&:hover": {
                        borderColor: theme.palette.primary.main,
                        bgcolor: alpha(theme.palette.primary.main, 0.02),
                      },
                    }}
                    onClick={() => navigate(`/proms/${prom.id}/complete`)}
                  >
                    <Avatar
                      sx={{
                        bgcolor: alpha(auraColors.purple.main, 0.15),
                        color: auraColors.purple.main,
                      }}
                    >
                      <AssignmentIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="subtitle2" fontWeight={600}>
                        {prom.templateName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Due {formatDateTime(prom.scheduledFor)}
                      </Typography>
                    </Box>
                    <AuraButton size="small" variant="outlined">
                      Start
                    </AuraButton>
                  </Paper>
                ))}
              </Stack>
            )}
          </InfoCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
