import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Grid,
  Chip,
  IconButton,
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
  Add as AddIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import type { ChipProps } from "@mui/material/Chip";
import apiClient from "../lib/api-client";
import {
  SearchBar,
  AuraStatCard,
  AuraErrorState,
  StatCardSkeleton,
  FilterChips,
  AuraButton,
  DataTable,
  type DataTableColumn,
  auraTokens,
} from "@qivr/design-system";

// Lightweight DTO from /api/evaluations/history endpoint
interface EvaluationHistoryItem {
  id: string;
  evaluationNumber: string;
  date: string;
  status: string;
  chiefComplaint: string;
  primaryPainRegion?: string;
}

interface EvaluationHistoryResponse {
  data: EvaluationHistoryItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export const Evaluations = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedEvaluation, setSelectedEvaluation] =
    useState<EvaluationHistoryItem | null>(null);

  // Use lightweight /api/evaluations/history endpoint with server-side pagination
  const {
    data: historyResponse,
    isLoading: loading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["evaluationHistory", page + 1, rowsPerPage],
    queryFn: async () => {
      const response = await apiClient.get<EvaluationHistoryResponse>(
        "/api/evaluations/history",
        { page: page + 1, pageSize: rowsPerPage }
      );
      return response;
    },
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  const evaluations = historyResponse?.data ?? [];
  const totalCount = historyResponse?.pagination?.totalCount ?? 0;

  const handleChangePage = (newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setPage(0);
  };

  const handleMenuClick = (
    event: React.MouseEvent<HTMLElement>,
    evaluation: EvaluationHistoryItem,
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
    switch (status.toLowerCase()) {
      case "completed":
      case "reviewed":
      case "triaged":
        return "success";
      case "in-progress":
      case "reviewing":
        return "warning";
      case "pending":
        return "info";
      case "cancelled":
      case "archived":
        return "error";
      default:
        return "default";
    }
  };

  // Client-side filtering for search (server pagination handles page/size)
  const filteredEvaluations = evaluations.filter((evaluation) => {
    const matchesSearch =
      !searchTerm ||
      evaluation.chiefComplaint
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      evaluation.evaluationNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (evaluation.primaryPainRegion?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesFilter =
      filterStatus === "all" || evaluation.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Define columns for Aura DataTable
  const columns: DataTableColumn<EvaluationHistoryItem>[] = [
    {
      id: "evaluationNumber",
      label: "Evaluation #",
      render: (row) => (
        <Typography variant="body2" fontWeight="medium">
          {row.evaluationNumber}
        </Typography>
      ),
    },
    {
      id: "date",
      label: "Date",
      render: (row) => format(new Date(row.date), "MMM dd, yyyy"),
    },
    {
      id: "chiefComplaint",
      label: "Chief Complaint",
      render: (row) => (
        <Typography variant="body2">{row.chiefComplaint}</Typography>
      ),
    },
    {
      id: "primaryPainRegion",
      label: "Pain Region",
      render: (row) =>
        row.primaryPainRegion ? (
          <Chip label={row.primaryPainRegion} size="small" variant="outlined" />
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        ),
    },
    {
      id: "status",
      label: "Status",
      render: (row) => (
        <Chip
          label={row.status.replace("-", " ")}
          color={getStatusColor(row.status)}
          size="small"
        />
      ),
    },
    {
      id: "actions",
      label: "Actions",
      align: "right",
      render: (row) => (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleMenuClick(e, row);
          }}
          aria-label={`Actions for evaluation ${row.evaluationNumber}`}
        >
          <MoreVertIcon />
        </IconButton>
      ),
    },
  ];

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
        <AuraButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate("/evaluations/new")}
          aria-label="Create new intake evaluation"
        >
          New Intake
        </AuraButton>
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
                value={totalCount}
                icon={<AssessmentIcon />}
                iconColor="primary"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Completed"
                value={
                  evaluations.filter((e) => ["completed", "reviewed", "triaged"].includes(e.status.toLowerCase())).length
                }
                subtitle="on this page"
                icon={<CheckCircleIcon />}
                iconColor="success"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="In Progress"
                value={
                  evaluations.filter((e) => ["in-progress", "reviewing"].includes(e.status.toLowerCase())).length
                }
                subtitle="on this page"
                icon={<ScheduleIcon />}
                iconColor="warning"
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <AuraStatCard
                title="Pending Review"
                value={evaluations.filter((e) => e.status.toLowerCase() === "pending").length}
                subtitle="on this page"
                icon={<InfoIcon />}
                iconColor="info"
              />
            </Grid>
          </>
        )}
      </Grid>

      {/* Search and Filter */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Box sx={{ flexGrow: 1, maxWidth: auraTokens.responsive.searchBar }}>
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

        {/* Active Filters */}
        {(searchTerm || filterStatus !== "all") && (
          <FilterChips
            filters={[
              ...(searchTerm ? [{ key: "search", label: `Search: ${searchTerm}` }] : []),
              ...(filterStatus !== "all" ? [{ key: "status", label: `Status: ${filterStatus}` }] : []),
            ]}
            onRemove={(key) => {
              if (key === "search") setSearchTerm("");
              if (key === "status") setFilterStatus("all");
            }}
            onClearAll={() => {
              setSearchTerm("");
              setFilterStatus("all");
            }}
          />
        )}
      </Box>

      {/* Evaluations Table - Aura DataTable with server-side pagination */}
      <DataTable
        columns={columns}
        data={filteredEvaluations}
        loading={loading}
        emptyState={{
          title: "No evaluations found",
          description:
            searchTerm || filterStatus !== "all"
              ? "Try adjusting your search or filters"
              : "Start your first intake evaluation to begin tracking your health journey",
          actionText:
            searchTerm || filterStatus !== "all" ? undefined : "New Intake",
          onAction:
            searchTerm || filterStatus !== "all"
              ? undefined
              : () => navigate("/evaluations/new"),
        }}
        paginated
        totalCount={totalCount}
        page={page}
        pageSize={rowsPerPage}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        onRowClick={(row) => handleViewDetails(row.id)}
        getRowId={(row) => row.id}
      />

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
