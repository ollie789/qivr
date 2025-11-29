import { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Link,
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
  Close as CloseIcon,
  CalendarMonth as CalendarIcon,
  ContentCopy as CopyIcon,
  Directions as DirectionsIcon,
} from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useSnackbar } from "notistack";
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
  AuraButton,
  auraTokens,
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
  const { enqueueSnackbar } = useSnackbar();
  const [selectedReferral, setSelectedReferral] = useState<Referral | null>(null);
  
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

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar(`${label} copied to clipboard`, { variant: "success" });
  };

  const handleAddToCalendar = (referral: Referral) => {
    if (!referral.appointmentDate) return;
    const date = parseISO(referral.appointmentDate);
    const title = encodeURIComponent(`${referral.specialty} Appointment`);
    const details = encodeURIComponent(`Referral: ${referral.reasonForReferral || referral.specialty}\nProvider: ${referral.externalProviderName || 'TBD'}`);
    const location = encodeURIComponent(referral.appointmentLocation || referral.externalProviderAddress || '');
    const startDate = format(date, "yyyyMMdd'T'HHmmss");
    const endDate = format(new Date(date.getTime() + 60 * 60 * 1000), "yyyyMMdd'T'HHmmss");
    
    // Google Calendar link
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&location=${location}`;
    window.open(googleUrl, '_blank');
  };

  const handleGetDirections = (address: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const ReferralCard = ({ referral }: { referral: Referral }) => (
    <AuraCard 
      sx={{ height: "100%", cursor: "pointer", transition: auraTokens.transitions.fast, "&:hover": { borderColor: "primary.main" } }}
      onClick={() => setSelectedReferral(referral)}
    >
      <Stack spacing={auraTokens.spacing.md}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: auraTokens.spacing.md }}>
          <Box sx={{ p: auraTokens.spacing.sm, borderRadius: auraTokens.borderRadius.sm, bgcolor: "primary.50", color: "primary.main" }}>
            {getTypeIcon(referral.type)}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={auraTokens.fontWeights.semibold}>{referral.specialty}</Typography>
            {referral.specificService && (
              <Typography variant="body2" color="text.secondary">{referral.specificService}</Typography>
            )}
          </Box>
          <Chip
            label={referral.statusName}
            size="small"
            color={REFERRAL_STATUS_COLORS[referral.status] as any}
            icon={getStatusIcon(referral.status) || undefined}
          />
        </Box>

        {/* Reason */}
        {referral.reasonForReferral && (
          <Typography variant="body2" color="text.secondary" noWrap>
            {referral.reasonForReferral}
          </Typography>
        )}

        {/* Appointment Info */}
        {referral.appointmentDate && (
          <Paper sx={{ p: auraTokens.spacing.sm, bgcolor: "success.50", borderRadius: auraTokens.borderRadius.sm }} elevation={0}>
            <Stack direction="row" spacing={auraTokens.spacing.sm} alignItems="center">
              <ScheduleIcon color="success" fontSize="small" />
              <Typography variant="body2" fontWeight={auraTokens.fontWeights.semibold} color="success.main">
                {format(parseISO(referral.appointmentDate), "EEE, MMM d 'at' h:mm a")}
              </Typography>
            </Stack>
          </Paper>
        )}

        {/* Footer */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="caption" color="text.secondary">
            {format(parseISO(referral.createdAt), "MMM d, yyyy")}
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight={auraTokens.fontWeights.medium}>
            Tap for details →
          </Typography>
        </Box>
      </Stack>
    </AuraCard>
  );

  return (
    <Box sx={{ p: auraTokens.spacing.lg, maxWidth: 1200, mx: "auto" }}>
      <PageHeader
        title="My Referrals"
        description="View and track your specialist referrals"
      />

      {/* Stats */}
      <Grid container spacing={auraTokens.spacing.md} sx={{ mb: auraTokens.spacing.xl }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard title="Total" value={stats.total} icon={<SendIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard title="Active" value={stats.active} icon={<HospitalIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard title="Scheduled" value={stats.scheduled} icon={<ScheduleIcon />} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <AuraGlassStatCard title="Completed" value={stats.completed} icon={<CheckIcon />} />
        </Grid>
      </Grid>

      {isLoading ? (
        <Box sx={{ textAlign: "center", py: auraTokens.spacing.xxl }}>
          <Typography color="text.secondary">Loading referrals...</Typography>
        </Box>
      ) : referrals.length === 0 ? (
        <Paper sx={{ p: auraTokens.spacing.xl, borderRadius: auraTokens.borderRadius.md }}>
          <AuraEmptyState
            title="No referrals yet"
            description="When your healthcare provider creates a referral for you, it will appear here."
          />
        </Paper>
      ) : (
        <>
          {activeReferrals.length > 0 && (
            <Box sx={{ mb: auraTokens.spacing.xl }}>
              <Typography variant="h6" sx={{ mb: auraTokens.spacing.md, fontWeight: auraTokens.fontWeights.semibold }}>Active Referrals</Typography>
              <Grid container spacing={auraTokens.spacing.lg}>
                {activeReferrals.map((referral) => (
                  <Grid key={referral.id} size={{ xs: 12, md: 6 }}>
                    <ReferralCard referral={referral} />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {pastReferrals.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: auraTokens.spacing.md, fontWeight: auraTokens.fontWeights.semibold }}>Past Referrals</Typography>
              <Grid container spacing={auraTokens.spacing.lg}>
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

      {/* Referral Detail Dialog */}
      <Dialog 
        open={Boolean(selectedReferral)} 
        onClose={() => setSelectedReferral(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedReferral && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" fontWeight={auraTokens.fontWeights.semibold}>{selectedReferral.specialty}</Typography>
                <Typography variant="body2" color="text.secondary">{selectedReferral.type} Referral</Typography>
              </Box>
              <IconButton onClick={() => setSelectedReferral(null)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers>
              <Stack spacing={auraTokens.spacing.lg}>
                {/* Status */}
                <Box sx={{ display: "flex", gap: auraTokens.spacing.sm }}>
                  <Chip
                    label={selectedReferral.statusName}
                    color={REFERRAL_STATUS_COLORS[selectedReferral.status] as any}
                    icon={getStatusIcon(selectedReferral.status) || undefined}
                  />
                  <Chip
                    label={selectedReferral.priorityName}
                    color={REFERRAL_PRIORITY_COLORS[selectedReferral.priority] as any}
                    variant="outlined"
                  />
                </Box>

                {/* Reason */}
                {selectedReferral.reasonForReferral && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Reason for Referral</Typography>
                    <Typography variant="body1">{selectedReferral.reasonForReferral}</Typography>
                  </Box>
                )}

                {/* Appointment */}
                {selectedReferral.appointmentDate && (
                  <Paper sx={{ p: auraTokens.spacing.md, bgcolor: "success.50", borderRadius: auraTokens.borderRadius.md }} elevation={0}>
                    <Typography variant="subtitle2" color="success.main" gutterBottom>
                      <ScheduleIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                      Appointment Scheduled
                    </Typography>
                    <Typography variant="body1" fontWeight={auraTokens.fontWeights.medium}>
                      {format(parseISO(selectedReferral.appointmentDate), "EEEE, MMMM d, yyyy")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {format(parseISO(selectedReferral.appointmentDate), "h:mm a")}
                    </Typography>
                    {selectedReferral.appointmentLocation && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: auraTokens.spacing.sm }}>
                        <LocationIcon fontSize="small" sx={{ verticalAlign: "middle", mr: 0.5 }} />
                        {selectedReferral.appointmentLocation}
                      </Typography>
                    )}
                    <Box sx={{ mt: auraTokens.spacing.md, display: "flex", gap: auraTokens.spacing.sm }}>
                      <AuraButton size="small" startIcon={<CalendarIcon />} onClick={() => handleAddToCalendar(selectedReferral)}>
                        Add to Calendar
                      </AuraButton>
                      {selectedReferral.appointmentLocation && (
                        <AuraButton size="small" variant="outlined" startIcon={<DirectionsIcon />} onClick={() => handleGetDirections(selectedReferral.appointmentLocation!)}>
                          Directions
                        </AuraButton>
                      )}
                    </Box>
                  </Paper>
                )}

                {/* Provider Info */}
                {selectedReferral.externalProviderName && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Provider Information</Typography>
                    <Paper sx={{ p: auraTokens.spacing.md, borderRadius: auraTokens.borderRadius.md }} variant="outlined">
                      <Typography variant="body1" fontWeight={auraTokens.fontWeights.semibold}>{selectedReferral.externalProviderName}</Typography>
                      
                      {selectedReferral.externalProviderAddress && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: auraTokens.spacing.sm, mt: auraTokens.spacing.sm }}>
                          <LocationIcon fontSize="small" color="action" />
                          <Typography variant="body2" sx={{ flex: 1 }}>{selectedReferral.externalProviderAddress}</Typography>
                          <IconButton size="small" onClick={() => handleGetDirections(selectedReferral.externalProviderAddress!)}>
                            <DirectionsIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      
                      {selectedReferral.externalProviderPhone && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: auraTokens.spacing.sm, mt: auraTokens.spacing.sm }}>
                          <PhoneIcon fontSize="small" color="action" />
                          <Link href={`tel:${selectedReferral.externalProviderPhone}`} underline="hover">
                            {selectedReferral.externalProviderPhone}
                          </Link>
                          <IconButton size="small" onClick={() => handleCopyToClipboard(selectedReferral.externalProviderPhone!, "Phone number")}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                      
                      {selectedReferral.externalProviderEmail && (
                        <Box sx={{ display: "flex", alignItems: "center", gap: auraTokens.spacing.sm, mt: auraTokens.spacing.sm }}>
                          <EmailIcon fontSize="small" color="action" />
                          <Link href={`mailto:${selectedReferral.externalProviderEmail}`} underline="hover">
                            {selectedReferral.externalProviderEmail}
                          </Link>
                          <IconButton size="small" onClick={() => handleCopyToClipboard(selectedReferral.externalProviderEmail!, "Email")}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      )}
                    </Paper>
                  </Box>
                )}

                {/* Clinical Notes */}
                {selectedReferral.clinicalNotes && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>Clinical Notes</Typography>
                    <Typography variant="body2">{selectedReferral.clinicalNotes}</Typography>
                  </Box>
                )}

                {/* Meta */}
                <Divider />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">
                    Referred by {selectedReferral.referringProviderName || "Your Provider"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(parseISO(selectedReferral.createdAt), "MMMM d, yyyy")}
                  </Typography>
                </Box>
              </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              {selectedReferral.externalProviderPhone && (
                <AuraButton 
                  variant="contained" 
                  startIcon={<PhoneIcon />}
                  href={`tel:${selectedReferral.externalProviderPhone}`}
                >
                  Call Provider
                </AuraButton>
              )}
              <AuraButton onClick={() => setSelectedReferral(null)}>Close</AuraButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
