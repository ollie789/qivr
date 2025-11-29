import React from "react";
import {
  Box,
  Typography,
  Chip,
  Grid,
  Stack,
  Paper,
  alpha,
} from "@mui/material";
import {
  Send as SendIcon,
  LocalHospital as HospitalIcon,
  Science as ScienceIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Add as AddIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  AuraButton,
  AuraEmptyState,
  auraColors,
  glassTokens,
  auraTokens,
} from "@qivr/design-system";

export interface PatientReferral {
  id: string;
  type: string;
  typeName: string;
  specialty: string;
  specificService?: string;
  priority: string;
  priorityName: string;
  status: string;
  statusName: string;
  externalProviderName?: string;
  externalProviderPhone?: string;
  externalProviderEmail?: string;
  externalProviderAddress?: string;
  reasonForReferral?: string;
  appointmentDate?: string;
  appointmentLocation?: string;
  referringProviderName?: string;
  createdAt: string;
}

interface ReferralsTabProps {
  referrals: PatientReferral[];
  patientId: string | null;
  isLoading?: boolean;
}

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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Emergency":
      return "error";
    case "Urgent":
      return "warning";
    case "SemiUrgent":
      return "info";
    default:
      return "default";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
    case "ResultsReceived":
      return "success";
    case "Scheduled":
      return "primary";
    case "Sent":
    case "Acknowledged":
      return "info";
    case "Cancelled":
    case "Expired":
      return "error";
    case "PendingApproval":
      return "warning";
    default:
      return "default";
  }
};

const ReferralCard: React.FC<{ referral: PatientReferral }> = ({
  referral,
}) => {
  return (
    <Box
      sx={{
        p: 2.5,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        boxShadow: glassTokens.shadow.subtle,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <Box
          sx={{
            width: auraTokens.avatar.md,
            height: auraTokens.avatar.md,
            borderRadius: auraTokens.borderRadius.sm,
            bgcolor: alpha(auraColors.blue.main, 0.1),
            color: auraColors.blue.main,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            "& svg": { fontSize: auraTokens.iconSize.lg },
          }}
        >
          {getTypeIcon(referral.type)}
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {referral.specialty}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {referral.typeName}
            {referral.specificService && ` - ${referral.specificService}`}
          </Typography>
        </Box>
      </Box>

      {/* Status & Priority */}
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 2 }}>
        <Chip
          label={referral.priorityName}
          size="small"
          color={getPriorityColor(referral.priority) as any}
          icon={
            referral.priority === "Emergency" ? (
              <WarningIcon fontSize="small" />
            ) : undefined
          }
          sx={{ height: 24, fontSize: "0.75rem" }}
        />
        <Chip
          label={referral.statusName}
          size="small"
          color={getStatusColor(referral.status) as any}
          icon={getStatusIcon(referral.status) || undefined}
          sx={{ height: 24, fontSize: "0.75rem" }}
        />
      </Box>

      {/* Reason */}
      {referral.reasonForReferral && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            Reason for Referral
          </Typography>
          <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
            {referral.reasonForReferral}
          </Typography>
        </Box>
      )}

      {/* External Provider */}
      {referral.externalProviderName && (
        <Box
          sx={{
            p: 1.5,
            bgcolor: "action.hover",
            borderRadius: 2,
            mb: 2,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 0.5 }}
          >
            Provider
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {referral.externalProviderName}
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 0.5 }}>
            {referral.externalProviderAddress && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <LocationIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  {referral.externalProviderAddress}
                </Typography>
              </Stack>
            )}
            {referral.externalProviderPhone && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <PhoneIcon sx={{ fontSize: 14, color: "text.secondary" }} />
                <Typography variant="caption" color="text.secondary">
                  {referral.externalProviderPhone}
                </Typography>
              </Stack>
            )}
          </Stack>
        </Box>
      )}

      {/* Appointment Info */}
      {referral.appointmentDate && (
        <Paper
          sx={{
            p: 1.5,
            bgcolor: alpha(auraColors.green.main, 0.08),
            borderRadius: 2,
            mb: 2,
          }}
          elevation={0}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <ScheduleIcon sx={{ color: auraColors.green.main, fontSize: 20 }} />
            <Box>
              <Typography
                variant="caption"
                fontWeight={600}
                color="success.main"
              >
                Appointment Scheduled
              </Typography>
              <Typography variant="body2">
                {format(
                  parseISO(referral.appointmentDate),
                  "MMM d, yyyy 'at' h:mm a",
                )}
              </Typography>
              {referral.appointmentLocation && (
                <Typography variant="caption" color="text.secondary">
                  {referral.appointmentLocation}
                </Typography>
              )}
            </Box>
          </Stack>
        </Paper>
      )}

      {/* Footer */}
      <Box
        sx={{
          mt: "auto",
          pt: 1,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            {referral.referringProviderName || "Provider"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(parseISO(referral.createdAt), "MMM d, yyyy")}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const ReferralsTab: React.FC<ReferralsTabProps> = ({
  referrals,
  patientId,
}) => {
  const navigate = useNavigate();

  const activeReferrals = referrals.filter(
    (r) => !["Closed", "Cancelled", "Expired"].includes(r.status),
  );
  const pastReferrals = referrals.filter((r) =>
    ["Closed", "Cancelled", "Expired"].includes(r.status),
  );

  const handleCreateReferral = () => {
    navigate(`/referrals?patientId=${patientId}`);
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={600}>
            Referrals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Specialist referrals and external consultations
          </Typography>
        </Box>
        <AuraButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateReferral}
          disabled={!patientId}
        >
          New Referral
        </AuraButton>
      </Box>

      {referrals.length === 0 ? (
        <AuraEmptyState
          title="No referrals"
          description="Create a referral when this patient needs specialist care"
          actionText="Create Referral"
          onAction={handleCreateReferral}
        />
      ) : (
        <>
          {/* Active Referrals */}
          {activeReferrals.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                Active Referrals ({activeReferrals.length})
              </Typography>
              <Grid container spacing={2.5}>
                {activeReferrals.map((referral) => (
                  <Grid key={referral.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <ReferralCard referral={referral} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {/* Past Referrals */}
          {pastReferrals.length > 0 && (
            <Box>
              <Typography
                variant="subtitle1"
                fontWeight={600}
                sx={{ mb: 2, color: "text.secondary" }}
              >
                Past Referrals ({pastReferrals.length})
              </Typography>
              <Grid container spacing={2.5}>
                {pastReferrals.map((referral) => (
                  <Grid key={referral.id} size={{ xs: 12, sm: 6, lg: 4 }}>
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
};

export default ReferralsTab;
