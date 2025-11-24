import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Typography,
  Grid,
  Avatar,
  Chip,
} from "@mui/material";
import { ArrowBack as BackIcon, Edit as EditIcon } from "@mui/icons-material";
import { useQuery } from "@tanstack/react-query";
import { patientApi } from "../services/patientApi";
import {
  PageHeader,
  StatCardSkeleton,
  AuraEmptyState,
  InfoCard,
} from "@qivr/design-system";
import { format, parseISO } from "date-fns";

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient", id],
    queryFn: () => patientApi.getPatient(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <Box>
        <PageHeader
          title="Patient Details"
          description="Loading patient information..."
        />
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <StatCardSkeleton />
          </Grid>
          <Grid size={{ xs: 12, md: 8 }}>
            <StatCardSkeleton />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (!patient) {
    return (
      <Box>
        <PageHeader title="Patient Details" />
        <Paper sx={{ p: 4 }}>
          <AuraEmptyState
            title="Patient not found"
            description="The patient you're looking for doesn't exist or has been removed"
          />
          <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
            <Button
              variant="contained"
              startIcon={<BackIcon />}
              onClick={() => navigate("/medical-records")}
            >
              Back to Medical Records
            </Button>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Patient Details"
        actions={
          <>
            <Button
              startIcon={<BackIcon />}
              onClick={() => navigate("/medical-records")}
            >
              Back
            </Button>
            <Button variant="contained" startIcon={<EditIcon />}>
              Edit
            </Button>
          </>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoCard title="Patient Information">
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  bgcolor: "primary.main",
                  fontSize: 32,
                }}
              >
                {patient.firstName?.[0]}
                {patient.lastName?.[0]}
              </Avatar>
              <Typography variant="h6">
                {patient.firstName} {patient.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {patient.email}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Phone:
                </Typography>
                <Typography variant="body2">
                  {patient.phone || "N/A"}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Date of Birth:
                </Typography>
                <Typography variant="body2">
                  {patient.dateOfBirth
                    ? format(parseISO(patient.dateOfBirth), "MMM d, yyyy")
                    : "N/A"}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Gender:
                </Typography>
                <Typography variant="body2">
                  {patient.gender || "N/A"}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  Status:
                </Typography>
                <Chip label="Active" color="success" size="small" />
              </Box>
            </Box>
          </InfoCard>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <InfoCard title="Medical Summary">
            <AuraEmptyState
              title="No medical records yet"
              description="Medical records will appear here once available"
            />
          </InfoCard>
        </Grid>
      </Grid>
    </Box>
  );
}
