import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Divider,
} from "@mui/material";
import {
  Send as SendIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  fetchMyReferrals,
  Referral,
  REFERRAL_PRIORITY_COLORS,
  REFERRAL_STATUS_COLORS,
} from "../services/referralsApi";
import {
  PageHeader,
  AuraCard,
  AuraEmptyState,
  AuraGlassStatCard,
} from "@qivr/design-system";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Imaging":
    case "Laboratory":
      return <ScienceIcon />;
    case "Specialist":
    case "Hospital":
      return <HospitalIcon />;
    default:
      return <SendIcon />;
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "Scheduled":
      return <ScheduleIcon fontSize="small" />;
    case "Completed":
    case "ResultsReceived":
    case "Closed":
      return <CheckIcon fontSize="small" />;
    case "Cancelled":
    case "Expired":
      return <WarningIcon fontSize="small" />;
    default:
      return null;
  }
};

export default function Referrals() {
  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ["myReferrals"],
    queryFn: fetchMyReferrals,
  });

  const stats = {
    total: referrals.length,
    active: referrals.filter((r) =>
      ["Sent", "Acknowledged", "Scheduled"].includes(r.status),
    ).length,
    scheduled: referrals.filter((r) => r.status === "Scheduled").length,
    completed: referrals.filter((r) =>
      ["Completed", "ResultsReceived", "Closed"].includes(r.status),
    ).length,
  };

  const activeReferrals = referrals.filter(
    (r) => !["Closed", "Cancelled", "Expired"].includes(r.status),
  );
  const pastReferrals = referrals.filter((r) =>
    ["Closed", "Cancelled", "Expired"].includes(r.status),
  );

  const ReferralCard = ({ referral }: { referral: Referral }) => (
    <AuraCard sx={{ height: "100%" }}>
      <Stack spacing={2}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: "primary.50",
              color: "primary.main",
            }}
          >
            {getTypeIcon(referral.type)}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={600}>
              {referral.specialty}
            </Typography>
            {referral.specificService && (
              <Typography variant="body2" color="text.secondary">
                {referral.specificService}
              </Typography>
            )}
          </Box>
          <Stack direction="row" spacing={1}>
            <Chip
              label={referral.priorityName}
              size="small"
              color={
                REFERRAL_PRIORITY_COLORS[referral.priority] as
                  | "default"
                  | "primary"
                  | "info"
                  | "warning"
                  | "error"
              }
              icon={
                referral.priority === "Emergency" ? (
                  <WarningIcon fontSize="small" />
                ) : undefined
              }
            />
            <Chip
              label={referral.statusName}
              size="small"
              color={
                REFERRAL_STATUS_COLORS[referral.status] as
                  | "default"
                  | "primary"
                  | "info"
                  | "warning"
                  | "error"
                  | "success"
              }
              icon={getStatusIcon(referral.status) || undefined}
            />
          </Stack>
        </Box>

        <Divider />

        {/* Reason */}
        {referral.reasonForReferral && (
          <Box>
            <Typography variant="caption" color="text.secondary">
              Reason for Referral
            </Typography>
            <Typography variant="body2">
              {referral.reasonForReferral}
            </Typography>
          </Box>
        )}

        {/* External Provider */}
        {referral.externalProviderName && (
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mb: 0.5, display: "block" }}
            >
              Provider
            </Typography>
            <Typography variant="body2" fontWeight={500}>
              {referral.externalProviderName}
            </Typography>
            {referral.externalProviderAddress && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {referral.externalProviderAddress}
                </Typography>
              </Stack>
            )}
            <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
              {referral.externalProviderPhone && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {referral.externalProviderPhone}
                  </Typography>
                </Stack>
              )}
              {referral.externalProviderEmail && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <EmailIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {referral.externalProviderEmail}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>
        )}

        {/* Appointment Info */}
        {referral.appointmentDate && (
          <Paper
            sx={{ p: 2, bgcolor: "success.50", borderRadius: 2 }}
            elevation={0}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleIcon color="success" />
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="success.main"
                >
                  Appointment Scheduled
                </Typography>
                <Typography variant="body2">
                  {format(
                    parseISO(referral.appointmentDate),
                    "EEEE, MMMM d, yyyy 'at' h:mm a",
                  )}
                </Typography>
                {referral.appointmentLocation && (
                  <Typography variant="body2" color="text.secondary">
                    {referral.appointmentLocation}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Referred by {referral.referringProviderName || "Your Provider"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(parseISO(referral.createdAt), "MMM d, yyyy")}
          </Typography>
        </Box>
      </Stack>
    </AuraCard>
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <PageHeader
        title="My Referrals"
        description="View and track your specialist referrals"
      />

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Total Referrals"
            value={stats.total}
            icon={<SendIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Active"
            value={stats.active}
            icon={<HospitalIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Scheduled"
            value={stats.scheduled}
            icon={<ScheduleIcon />}
          />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckIcon />}
          />
        </Grid>
      </Grid>

      {isLoading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <Typography color="text.secondary">Loading referrals...</Typography>
        </Box>
      ) : referrals.length === 0 ? (
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <AuraEmptyState
            title="No referrals yet"
            description="When your healthcare provider creates a referral for you, it will appear here."
          />
        </Paper>
      ) : (
        <>
          {/* Active Referrals */}
          {activeReferrals.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Active Referrals
              </Typography>
              <Grid container spacing={3}>
                {activeReferrals.map((referral) => (
                  <Grid key={referral.id} size={{ xs: 12, md: 6 }}>
                    <ReferralCard referral={referral} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Past Referrals */}
          {pastReferrals.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                Past Referrals
              </Typography>
              <Grid container spacing={3}>
                {pastReferrals.map((referral) => (
                  <Grid key={referral.id} size={{ xs: 12, md: 6 }}>
                    <ReferralCard referral={referral} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
