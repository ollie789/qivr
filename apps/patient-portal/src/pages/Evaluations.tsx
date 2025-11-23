import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Menu,
  MenuItem,
} from "@mui/material";
import {
  Assessment as AssessmentIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Info as InfoIcon,
  MoreVert as MoreVertIcon,
  Download as DownloadIcon,
  Print as PrintIcon,
  Share as ShareIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Remove as RemoveIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { ChipProps } from "@mui/material/Chip";
import apiClient from "../lib/api-client";
import {
  SearchBar,
  AuraStatCard,
  AuraEmptyState,
  AuraErrorState,
  StatCardSkeleton,
} from "@qivr/design-system";

interface Evaluation {
  id: string;
  evaluationNumber: string;
  date: string;
  chiefComplaint: string;
  symptoms: string[];
  status: "completed" | "in-progress" | "pending" | "cancelled";
  urgency: "low" | "medium" | "high" | "critical";
  provider?: string;
  followUpDate?: string;
  score?: number;
  trend?: "improving" | "stable" | "declining";
  lastUpdated: string;
}

export const Evaluations = () => {
  const navigate = useNavigate();
  const {
    data: evaluations = [],
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["evaluations"],
    queryFn: async () => {
      const data = await apiClient.get<Evaluation[]>("/api/evaluations");
      console.log("Evaluations fetched:", data);
      return data;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<Evaluation | null>(null);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    evaluation: Evaluation,
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedEvaluation(evaluation);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedEvaluation(null);
  };

  const handleViewDetails = (evaluationId: string) => {
    navigate(`/evaluations/${evaluationId}`);
  };

  const getStatusColor = (status: string): ChipProps["color"] => {
    switch (status) {
      case "completed":
        return "success";
      case "in-progress":
        return "warning";
      case "pending":
        return "info";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "#d32f2f";
      case "high":
        return "#f57c00";
      case "medium":
        return "#fbc02d";
      case "low":
        return "#388e3c";
      default:
        return "#757575";
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "improving":
        return <TrendingUpIcon sx={{ color: "success.main", fontSize: 20 }} />;
      case "declining":
        return <TrendingDownIcon sx={{ color: "error.main", fontSize: 20 }} />;
      case "stable":
        return <RemoveIcon sx={{ color: "info.main", fontSize: 20 }} />;
      default:
        return null;
    }
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch =
      evaluation.chiefComplaint
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      evaluation.evaluationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      evaluation.symptoms.some((s) =>
        s.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    const matchesFilter =
      filterStatus === "all" || evaluation.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  if (error) {
    return (
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>
          My Evaluations
        </Typography>
        <AuraErrorState
          title="Failed to load evaluations"
          description="We couldn't load your evaluations. Please try again."
          onAction={() => refetch()}
        />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          My Evaluations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/evaluations/new")}
        >
          New Intake
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {loading ? (
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
                title="Total Evaluations"
                value={evaluations.length}
                icon={<AssessmentIcon />}
                iconColor="primary"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Completed"
                value={
                  evaluations.filter((e) => e.status === "completed").length
                }
                icon={<CheckCircleIcon />}
                iconColor="success"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="In Progress"
                value={
                  evaluations.filter((e) => e.status === "in-progress").length
                }
                icon={<ScheduleIcon />}
                iconColor="warning"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Pending Review"
                value={evaluations.filter((e) => e.status === "pending").length}
                icon={<InfoIcon />}
                iconColor="info"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Box sx={{ flexGrow: 1, maxWidth: 400 }}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search evaluations..."
          />
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label="All"
            color={filterStatus === "all" ? "primary" : "default"}
            onClick={() => setFilterStatus("all")}
          />
          <Chip
            label="Completed"
            color={filterStatus === "completed" ? "primary" : "default"}
            onClick={() => setFilterStatus("completed")}
          />
          <Chip
            label="In Progress"
            color={filterStatus === "in-progress" ? "primary" : "default"}
            onClick={() => setFilterStatus("in-progress")}
          />
          <Chip
            label="Pending"
            color={filterStatus === "pending" ? "primary" : "default"}
            onClick={() => setFilterStatus("pending")}
          />
        </Box>
      </Box>

      {/* Evaluations Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Evaluation #</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Chief Complaint</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Urgency</TableCell>
              <TableCell>Provider</TableCell>
              <TableCell>Score/Trend</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEvaluations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ border: 0, p: 0 }}>
                  <AuraEmptyState
                    title="No evaluations found"
                    description={
                      searchTerm || filterStatus !== "all"
                        ? "Try adjusting your search or filters"
                        : "Start your first intake evaluation to begin tracking your health journey"
                    }
                    actionText={
                      searchTerm || filterStatus !== "all"
                        ? undefined
                        : "New Intake"
                    }
                    onAction={
                      searchTerm || filterStatus !== "all"
                        ? undefined
                        : () => navigate("/evaluations/new")
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredEvaluations
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((evaluation) => (
                  <TableRow
                    key={evaluation.id}
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleViewDetails(evaluation.id)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {evaluation.evaluationNumber}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {format(new Date(evaluation.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {evaluation.chiefComplaint}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, mt: 0.5 }}>
                          {evaluation.symptoms
                            .slice(0, 2)
                            .map((symptom, index) => (
                              <Chip
                                key={index}
                                label={symptom}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                          {evaluation.symptoms.length > 2 && (
                            <Chip
                              label={`+${evaluation.symptoms.length - 2}`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={evaluation.status.replace("-", " ")}
                        color={getStatusColor(evaluation.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            bgcolor: getUrgencyColor(evaluation.urgency),
                          }}
                        />
                        <Typography variant="body2" textTransform="capitalize">
                          {evaluation.urgency}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{evaluation.provider || "-"}</TableCell>
                    <TableCell>
                      {evaluation.score && (
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Typography variant="body2">
                            {evaluation.score}
                          </Typography>
                          {getTrendIcon(evaluation.trend)}
                        </Box>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMenuClick(e, evaluation);
                        }}
                      >
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredEvaluations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            if (selectedEvaluation) {
              handleViewDetails(selectedEvaluation.id);
            }
          }}
        >
          <AssessmentIcon sx={{ mr: 1, fontSize: 20 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <DownloadIcon sx={{ mr: 1, fontSize: 20 }} />
          Download Report
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <PrintIcon sx={{ mr: 1, fontSize: 20 }} />
          Print
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <ShareIcon sx={{ mr: 1, fontSize: 20 }} />
          Share with Provider
        </MenuItem>
      </Menu>
    </Box>
  );
};
