import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Skeleton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Avatar,
} from "@mui/material";
import {
  Business,
  CheckCircle,
  HourglassEmpty,
  Block,
  People,
} from "@mui/icons-material";
import { format } from "date-fns";
import { partnerApi } from "../services/api";

const statusConfig: Record<
  string,
  {
    color: "success" | "warning" | "error" | "default";
    icon: React.ReactElement;
  }
> = {
  Active: { color: "success", icon: <CheckCircle fontSize="small" /> },
  Pending: { color: "warning", icon: <HourglassEmpty fontSize="small" /> },
  Revoked: { color: "error", icon: <Block fontSize="small" /> },
  Suspended: { color: "error", icon: <Block fontSize="small" /> },
};

const dataSharingLabels: Record<string, string> = {
  Aggregated: "Aggregated Only",
  Detailed: "De-identified Detail",
  Full: "Full De-identified",
};

export default function Affiliations() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["affiliations"],
    queryFn: () => partnerApi.getAffiliations(),
  });

  const affiliations = data?.affiliations || [];
  const activeCount = affiliations.filter((a) => a.status === "Active").length;
  const pendingCount = affiliations.filter(
    (a) => a.status === "Pending",
  ).length;
  const totalPatients = affiliations.reduce(
    (sum, a) => sum + a.patientCount,
    0,
  );

  if (error) {
    return (
      <Alert severity="error">
        Failed to load affiliations. Please try again later.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Affiliated Clinics
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        View clinics that have opted into data sharing with your organization
      </Typography>

      {/* Summary Cards */}
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <Card sx={{ minWidth: 180 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "success.main" }}>
                <Business />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Active Affiliations
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {isLoading ? <Skeleton width={40} /> : activeCount}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 180 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "warning.main" }}>
                <HourglassEmpty />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Pending Approval
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {isLoading ? <Skeleton width={40} /> : pendingCount}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 180 }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar sx={{ bgcolor: "info.main" }}>
                <People />
              </Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Patients
                </Typography>
                <Typography variant="h4" fontWeight={700}>
                  {isLoading ? (
                    <Skeleton width={40} />
                  ) : (
                    totalPatients.toLocaleString()
                  )}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Affiliations Table */}
      {isLoading ? (
        <Card>
          <CardContent>
            <Skeleton variant="rectangular" height={300} />
          </CardContent>
        </Card>
      ) : affiliations.length === 0 ? (
        <Alert severity="info">
          No clinic affiliations yet. Clinics can enable data sharing through
          their settings.
        </Alert>
      ) : (
        <Paper sx={{ overflow: "hidden" }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Clinic</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Data Sharing Level</TableCell>
                <TableCell align="center">Patients</TableCell>
                <TableCell>Approved</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {affiliations.map((affiliation) => {
                const status =
                  statusConfig[affiliation.status] || statusConfig.Pending;
                return (
                  <TableRow key={affiliation.id}>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: "primary.main",
                            width: 36,
                            height: 36,
                          }}
                        >
                          {affiliation.clinicName.charAt(0)}
                        </Avatar>
                        <Typography fontWeight={500}>
                          {affiliation.clinicName}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={status.icon}
                        label={affiliation.status}
                        color={status.color}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {dataSharingLabels[affiliation.dataSharingLevel] ||
                          affiliation.dataSharingLevel}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {affiliation.status === "Active" ? (
                        <Typography fontWeight={600}>
                          {affiliation.patientCount}
                        </Typography>
                      ) : (
                        <Typography color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {affiliation.approvedAt ? (
                        <Typography variant="body2" color="text.secondary">
                          {format(
                            new Date(affiliation.approvedAt),
                            "MMM d, yyyy",
                          )}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Info Box */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="body2">
          <strong>Data Sharing Levels:</strong>
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2 }}>
          <li>
            <strong>Aggregated Only:</strong> Only anonymized statistics with
            K-anonymity protection
          </li>
          <li>
            <strong>De-identified Detail:</strong> Patient-level data without
            direct identifiers
          </li>
          <li>
            <strong>Full De-identified:</strong> Complete de-identified records
            for research
          </li>
        </Box>
      </Alert>
    </Box>
  );
}
