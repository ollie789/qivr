import React, { useMemo } from "react";
import {
  Avatar,
  Box,
  Chip,
  Container,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemSecondaryAction,
  ListItemText,
  Typography,
} from "@mui/material";
import {
  Add as AddIcon,
  Assignment as AssignmentIcon,
  CalendarMonth as CalendarIcon,
  ChevronRight as ChevronRightIcon,
  Description as DescriptionIcon,
  Event as EventIcon,
  Healing as HealingIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingIcon,
  EventAvailable as EventAvailableIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
} from "@mui/icons-material";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../contexts/AuthContext";
import { useDashboardData } from "../hooks";
import { AuraStatCard, InfoCard, StatCardSkeleton, AuraEmptyState, TreatmentPlanCard, AuraButton, Callout } from "@qivr/design-system";

const formatAppointmentTime = (isoDate: string) => {
  const date = parseISO(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return format(date, "MMM dd, yyyy • h:mm a");
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { stats, upcomingAppointments, pendingProms, isLoading, error } =
    useDashboardData();

  const displayedAppointments = useMemo(
    () => upcomingAppointments.slice(0, 3),
    [upcomingAppointments],
  );
  const displayedProms = useMemo(
    () => pendingProms.slice(0, 3),
    [pendingProms],
  );

  const chipColor = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (Number.isNaN(date.getTime())) {
      return "default";
    }
    if (isToday(date)) return "error";
    if (isTomorrow(date)) return "warning";
    return "default";
  };

  const chipLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (Number.isNaN(date.getTime())) {
      return "Upcoming";
    }
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome back, {user?.firstName || "Patient"}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your health journey
        </Typography>
      </Box>

      {error && (
        <Callout variant="error">
          Unable to load all dashboard data. Please try again later.
        </Callout>
      )}

      {isLoading && <LinearProgress sx={{ mb: 3 }} />}

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
            title="Evaluations"
            value={stats?.completedEvaluations ?? 0}
            icon={<DescriptionIcon />}
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
        {/* Treatment Plan Card - Full Width */}
        <Grid size={{ xs: 12 }}>
          <TreatmentPlanCard />
        </Grid>

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
            {displayedAppointments.length === 0 ? (
              <AuraEmptyState
                icon={<EventAvailableIcon />}
                title="No appointments scheduled"
                description="Book your first appointment to get started"
                actionText="Book Appointment"
                onAction={() => navigate('/appointments/book')}
              />
            ) : (
              <List>
                {displayedAppointments.map((appointment) => (
                  <ListItem
                    key={appointment.id}
                    sx={{ alignItems: "flex-start" }}
                  >
                    <ListItemAvatar>
                      <Avatar>
                        <EventIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="subtitle1">
                            {appointment.providerName}
                          </Typography>
                          <Chip
                            label={chipLabel(appointment.scheduledStart)}
                            color={chipColor(appointment.scheduledStart)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.providerSpecialty} •{" "}
                            {appointment.appointmentType}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatAppointmentTime(appointment.scheduledStart)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {appointment.isVirtual
                              ? "Virtual appointment"
                              : appointment.location || "In person"}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() =>
                          navigate(`/appointments/${appointment.id}`)
                        }
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </InfoCard>
        </Grid>

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
            {displayedProms.length === 0 ? (
              <AuraEmptyState
                icon={<AssignmentTurnedInIcon />}
                title="No pending assessments"
                description="All caught up! Check back later for new assessments"
              />
            ) : (
              <List>
                {displayedProms.map((prom) => (
                  <ListItem key={prom.id}>
                    <ListItemAvatar>
                      <Avatar>
                        <HealingIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={prom.templateName}
                      secondary={
                        <Typography variant="body2" color="text.secondary">
                          Due {formatAppointmentTime(prom.scheduledFor)}
                        </Typography>
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => navigate(`/proms/${prom.id}`)}
                      >
                        <ChevronRightIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </InfoCard>
        </Grid>
      </Grid>
    </Container>
  );
};

export default DashboardPage;
