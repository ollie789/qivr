import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from "@mui/lab";
import {
  Person as PersonIcon,
  LocalHospital as HospitalIcon,
  Favorite as HeartIcon,
  Description as DocumentIcon,
  Timeline as TimelineIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  Add,
  MedicalServices as MedicalIcon,
  Vaccines as VaccineIcon,
  Medication as MedicationIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon,
  Message as MessageIcon,
} from "@mui/icons-material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { format, parseISO, differenceInYears } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import apiClient from "../lib/api-client";
import { useAuthGuard } from "../hooks/useAuthGuard";
import {
  medicalRecordsApi,
  type VitalSign,
} from "../services/medicalRecordsApi";
import {
  patientApi,
  type PatientListResponse,
  type Patient,
} from "../services/patientApi";
import { documentApi } from "../services/documentApi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChipProps } from "@mui/material/Chip";
import type { SelectChangeEvent } from "@mui/material/Select";
import {
  PageHeader,
  TabPanel,
  StatCard,
  FormDialog,
  AuraButton,
  InfoCard,
  AuraChartCard,
  PainMapProgression,
  AuraEmptyState,
  StatCardSkeleton,
} from "@qivr/design-system";
import { MessageComposer } from "../components/messaging";

interface MedicalHistory {
  id: string;
  category:
    | "injury"
    | "symptom"
    | "treatment"
    | "activity"
    | "occupation"
    | "goal"
    | "condition"
    | "surgery"
    | "allergy"
    | "medication"
    | "immunization"
    | "family"
    | "visit";
  title: string;
  description: string;
  date?: string;
  status: "active" | "resolved" | "ongoing";
  severity?: "mild" | "moderate" | "severe" | "critical";
  notes?: string;
}

type TimelineEvent = {
  type: string;
  date: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  color: "inherit" | "grey" | "primary" | "secondary";
};

type TimelineFilter = "all" | "vital" | MedicalHistory["category"];

const MedicalRecords: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const { canMakeApiCalls } = useAuthGuard();
  const queryClient = useQueryClient();

  const [selectedPatientId, setSelectedPatientId] = useState<string>("");
  const [activeTab, setActiveTab] = useState(0);
  const [editMode, setEditMode] = useState(false);
  const [vitalDialogOpen, setVitalDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>("all");
  const [editedPatient, setEditedPatient] = useState<Partial<Patient>>({});
  const [viewMode, setViewMode] = useState<"list" | "detail">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [page] = useState(0);
  const [rowsPerPage] = useState(10);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);

  const { data: patientList } = useQuery<PatientListResponse>({
    queryKey: ["medicalRecords", "patients"],
    queryFn: () => patientApi.getPatients({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
    enabled: canMakeApiCalls,
  });

  const patients: Patient[] = useMemo(
    () => patientList?.data ?? [],
    [patientList?.data],
  );

  useEffect(() => {
    if (!selectedPatientId && patients.length > 0 && patients[0]) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Get patient from the list
  const patient = patients?.find((p) => p.id === selectedPatientId);

  // Fetch pain progression
  const { data: painProgression } = useQuery({
    queryKey: ["painProgression", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return await apiClient.get(
        `/api/pain-map-analytics/progression/${selectedPatientId}`,
      );
    },
    enabled: Boolean(selectedPatientId),
  });

  // Initialize edited patient when patient changes
  useEffect(() => {
    if (patient) {
      setEditedPatient(patient);
    }
  }, [patient]);

  const handleSavePatient = () => {
    if (!selectedPatientId) return;
    // TODO: Call API to save patient data
    enqueueSnackbar("Patient information saved", { variant: "success" });
    setEditMode(false);
  };

  // Fetch vital signs
  const { data: medicalSummary, isLoading: isSummaryLoading } = useQuery({
    queryKey: ["medicalSummary", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return null;
      const result = await medicalRecordsApi.getSummary(selectedPatientId);
      console.log("Medical summary response:", result);
      return result;
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: vitalSigns = [] } = useQuery({
    queryKey: ["vitalSigns", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return medicalRecordsApi.getVitals(selectedPatientId);
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ["labResults", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return medicalRecordsApi.getLabResults(selectedPatientId);
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: documents = [], refetch: refetchDocuments } = useQuery({
    queryKey: ["documents", selectedPatientId],
    queryFn: () => documentApi.list({ patientId: selectedPatientId }),
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: medications = [] } = useQuery({
    queryKey: ["medications", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return medicalRecordsApi.getMedications(selectedPatientId);
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: allergies = [] } = useQuery({
    queryKey: ["allergies", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return medicalRecordsApi.getAllergies(selectedPatientId);
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: immunizations = [] } = useQuery({
    queryKey: ["immunizations", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return medicalRecordsApi.getImmunizations(selectedPatientId);
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: procedures = [] } = useQuery({
    queryKey: ["procedures", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return medicalRecordsApi.getProcedures(selectedPatientId);
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const { data: physioHistory = [] } = useQuery({
    queryKey: ["physioHistory", selectedPatientId],
    queryFn: async () => {
      if (!selectedPatientId) return [];
      return medicalRecordsApi.getPhysioHistory(selectedPatientId);
    },
    enabled: canMakeApiCalls && !!selectedPatientId,
  });

  const medicalHistory: MedicalHistory[] = useMemo(() => {
    if (!selectedPatientId) {
      return [];
    }

    const entries: MedicalHistory[] = [];

    // Add physio history entries
    physioHistory.forEach((history) => {
      entries.push({
        id: history.id,
        category: history.category,
        title: history.title,
        description: history.description,
        date: history.date ?? undefined,
        status: history.status,
        severity: history.severity ?? undefined,
        notes: history.notes ?? undefined,
      });
    });

    medicalSummary?.conditions.forEach((condition) => {
      // Parse category prefix like [INJURY], [SYMPTOM], etc.
      const match = condition.condition?.match(/^\[([A-Z]+)\]\s*(.+)$/);
      const category = (
        match ? match[1]?.toLowerCase() : "condition"
      ) as MedicalHistory["category"];
      const title = match
        ? match[2] || condition.condition
        : condition.condition;

      entries.push({
        id: condition.id,
        category: category,
        title: title || "Untitled",
        description: condition.managedBy,
        date: condition.diagnosedDate,
        status: condition.status === "resolved" ? "resolved" : "active",
        severity: undefined,
        notes: condition.notes ?? undefined,
      });
    });

    medications.forEach((medication) => {
      entries.push({
        id: medication.id,
        category: "medication",
        title: medication.name,
        description: medication.instructions ?? medication.frequency,
        date: medication.startDate,
        status: medication.status === "completed" ? "resolved" : "active",
        severity: undefined,
        notes: medication.instructions ?? undefined,
      });
    });

    allergies.forEach((allergy) => {
      entries.push({
        id: allergy.id,
        category: "allergy",
        title: allergy.allergen,
        description: allergy.reaction,
        date: allergy.diagnosedDate ?? undefined,
        status: "active",
        severity:
          (allergy.severity?.toLowerCase() as MedicalHistory["severity"]) ??
          undefined,
        notes: allergy.notes ?? undefined,
      });
    });

    immunizations.forEach((immunization) => {
      entries.push({
        id: immunization.id,
        category: "immunization",
        title: immunization.vaccine,
        description: immunization.provider,
        date: immunization.date,
        status: "resolved",
        severity: undefined,
        notes: immunization.facility,
      });
    });

    procedures.forEach((procedure: any) => {
      entries.push({
        id: procedure.id,
        category: "surgery",
        title: procedure.procedureName,
        description: procedure.provider,
        date: procedure.procedureDate,
        status: procedure.status === "completed" ? "resolved" : "active",
        severity: undefined,
        notes: procedure.notes ?? procedure.outcome ?? undefined,
      });
    });

    medicalSummary?.recentVisits.forEach((visit) => {
      entries.push({
        id: visit.id,
        category: "visit",
        title: visit.provider,
        description: visit.facility,
        date: visit.date,
        status: "resolved",
        severity: undefined,
        notes: visit.notes ?? undefined,
      });
    });

    return entries.sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });
  }, [
    selectedPatientId,
    medicalSummary,
    medications,
    allergies,
    immunizations,
    procedures,
    physioHistory,
  ]);

  // New pain assessment state
  const [newVital, setNewVital] = useState<Partial<VitalSign>>({
    overallPainLevel: 0,
    functionalImpact: "none",
    painPoints: [],
  });

  // New medical history state
  const [newHistory, setNewHistory] = useState<Partial<MedicalHistory>>({
    category: "injury",
    title: "",
    description: "",
    status: "active",
    severity: "mild",
  });

  // Add vital sign mutation
  const addVitalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) throw new Error("No patient selected");

      return medicalRecordsApi.createVitalSigns({
        patientId: selectedPatientId,
        overallPainLevel: newVital.overallPainLevel || 0,
        functionalImpact: newVital.functionalImpact || "none",
        painPoints: newVital.painPoints || [],
        notes: newVital.notes || "",
      });
    },
    onSuccess: () => {
      enqueueSnackbar("Pain assessment recorded successfully", {
        variant: "success",
      });
      setVitalDialogOpen(false);

      // Reset form
      setNewVital({
        overallPainLevel: 0,
        functionalImpact: "none",
        painPoints: [],
      });

      // Refresh pain assessments data
      queryClient.invalidateQueries({
        queryKey: ["vitalSigns", selectedPatientId],
      });
    },
    onError: (error) => {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to record pain assessment";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  // Add medical history mutation
  const addHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) throw new Error("No patient selected");

      // Use new physio-history endpoint for allied health categories
      if (
        [
          "injury",
          "symptom",
          "treatment",
          "activity",
          "occupation",
          "goal",
        ].includes(newHistory.category || "")
      ) {
        return medicalRecordsApi.createPhysioHistory({
          patientId: selectedPatientId,
          category: newHistory.category || "injury",
          title: newHistory.title?.trim() || "Untitled",
          description: newHistory.description?.trim() || "",
          date: newHistory.date,
          status: newHistory.status || "active",
          severity: newHistory.severity,
          notes: newHistory.notes,
        });
      }

      switch (newHistory.category) {
        case "allergy": {
          const allergyData: any = {
            patientId: selectedPatientId,
            allergen: newHistory.title?.trim() || "Untitled Allergen",
            type: "unknown",
            severity: "mild",
            reaction: newHistory.description?.trim() || "No reaction specified",
          };
          const notes = newHistory.description?.trim();
          if (notes) {
            allergyData.notes = notes;
          }
          return medicalRecordsApi.createAllergy(allergyData);
        }

        case "condition": {
          const conditionData: any = {
            patientId: selectedPatientId,
            condition: newHistory.title?.trim() || "Untitled Condition",
            diagnosedDate: new Date().toISOString().split("T")[0],
            status: "active",
          };
          const notes = newHistory.description?.trim();
          if (notes) {
            conditionData.notes = notes;
          }
          return medicalRecordsApi.createCondition(conditionData);
        }

        case "immunization":
          return medicalRecordsApi.createImmunization({
            patientId: selectedPatientId,
            vaccine: String(newHistory.title?.trim() || "Untitled Vaccine"),
            date:
              new Date().toISOString().split("T")[0] ||
              new Date().toISOString().substring(0, 10),
            provider: "Care Team",
            facility: "Clinic",
          });

        case "medication": {
          const medicationData: any = {
            patientId: selectedPatientId,
            name: newHistory.title?.trim() || "Untitled Medication",
            dosage: "1 tablet",
            frequency: "Daily",
            startDate: new Date().toISOString().split("T")[0],
          };
          const instructions = newHistory.description?.trim();
          if (instructions) {
            medicationData.instructions = instructions;
          }
          return medicalRecordsApi.createMedication(medicationData);
        }

        case "surgery": {
          const procedureData: any = {
            patientId: selectedPatientId,
            procedureName: newHistory.title?.trim() || "Untitled Procedure",
            procedureDate: new Date().toISOString().split("T")[0],
            provider: "Care Team",
            facility: "Clinic",
            status: "completed",
          };
          const notes = newHistory.description?.trim();
          if (notes) {
            procedureData.notes = notes;
          }
          return medicalRecordsApi.createProcedure(procedureData);
        }

        default:
          throw new Error("Unsupported medical record type");
      }
    },
    onSuccess: (_data, _variables) => {
      const category = newHistory.category || "injury";
      enqueueSnackbar(
        `${category.charAt(0).toUpperCase() + category.slice(1)} added successfully`,
        { variant: "success" },
      );
      setHistoryDialogOpen(false);

      // Reset form
      setNewHistory({
        category: "injury",
        title: "",
        description: "",
        status: "active",
        severity: "mild",
      });

      // Refresh medical summary for all new categories
      queryClient.invalidateQueries({
        queryKey: ["medicalSummary", selectedPatientId],
      });

      // Refresh physio history for new allied health categories
      if (
        [
          "injury",
          "symptom",
          "treatment",
          "activity",
          "occupation",
          "goal",
        ].includes(category)
      ) {
        queryClient.invalidateQueries({
          queryKey: ["physioHistory", selectedPatientId],
        });
      }

      // Also refresh specific queries for old categories
      switch (category) {
        case "allergy":
          queryClient.invalidateQueries({
            queryKey: ["allergies", selectedPatientId],
          });
          break;
        case "immunization":
          queryClient.invalidateQueries({
            queryKey: ["immunizations", selectedPatientId],
          });
          break;
        case "medication":
          queryClient.invalidateQueries({
            queryKey: ["medications", selectedPatientId],
          });
          break;
        case "surgery":
          queryClient.invalidateQueries({
            queryKey: ["procedures", selectedPatientId],
          });
          break;
      }
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Failed to add medical record";
      enqueueSnackbar(message, { variant: "error" });
    },
  });

  const getCategoryIcon = (category: MedicalHistory["category"] | string) => {
    switch (category) {
      case "condition":
        return <MedicalIcon />;
      case "surgery":
        return <HospitalIcon />;
      case "allergy":
        return <WarningIcon />;
      case "medication":
        return <MedicationIcon />;
      case "immunization":
        return <VaccineIcon />;
      case "family":
        return <PersonIcon />;
      case "visit":
        return <TimelineIcon />;
      default:
        return <InfoIcon />;
    }
  };

  const getSeverityColor = (
    severity?: MedicalHistory["severity"],
  ): ChipProps["color"] => {
    switch (severity) {
      case "critical":
        return "error";
      case "severe":
        return "warning";
      case "moderate":
        return "info";
      case "mild":
        return "success";
      default:
        return "default";
    }
  };

  const generateTimeline = () => {
    const events: TimelineEvent[] = [];

    // Add pain assessments to timeline
    vitalSigns.forEach((vital: VitalSign) => {
      events.push({
        type: "vital",
        date: vital.recordedAt,
        title: "Pain Assessment Recorded",
        description: `Pain Level: ${vital.overallPainLevel}/10, Impact: ${vital.functionalImpact}`,
        icon: <HeartIcon />,
        color: "primary",
      });
    });

    // Add lab results
    labResults.forEach((group) => {
      group.tests.forEach((test) => {
        events.push({
          type: "surgery",
          date: group.date,
          title: `${test.testName} (${group.category})`,
          description: `${test.value} ${test.unit ?? ""}`.trim(),
          icon: <MedicalIcon />,
          color: "primary",
        });
      });
    });

    // Add medical history to timeline
    medicalHistory.forEach((history: MedicalHistory) => {
      if (history.date) {
        events.push({
          type: history.category,
          date: history.date,
          title: history.title,
          description: history.description,
          icon: getCategoryIcon(history.category),
          color: history.status === "active" ? "secondary" : "primary",
        });
      }
    });

    // Sort by date
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    // Filter if needed
    if (timelineFilter !== "all") {
      return events.filter((e) => e.type === timelineFilter);
    }

    return events.slice(0, 20); // Show last 20 events
  };

  const lastVisitDisplay = useMemo(() => {
    const mostRecentVisit = medicalSummary?.recentVisits?.[0];
    if (!mostRecentVisit?.date) {
      return "N/A";
    }
    return format(parseISO(mostRecentVisit.date), "MMM d, yyyy");
  }, [medicalSummary]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <PageHeader
          title="Medical Records"
          description="Comprehensive patient health information management"
        />

        {/* View Mode Toggle */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Tabs value={viewMode} onChange={(_, v) => setViewMode(v)}>
              <Tab label="Patient List" value="list" />
              <Tab label="Medical Records" value="detail" />
            </Tabs>
            {viewMode === "list" && (
              <TextField
                size="small"
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ width: 300 }}
              />
            )}
          </Box>
        </Paper>

        {/* Patient List View */}
        {viewMode === "list" && (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Patient</TableCell>
                    <TableCell>Contact</TableCell>
                    <TableCell>DOB</TableCell>
                    <TableCell>Last Visit</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {patients.filter((p) => {
                    if (!searchQuery) return true;
                    const search = searchQuery.toLowerCase();
                    return (
                      p.firstName?.toLowerCase().includes(search) ||
                      p.lastName?.toLowerCase().includes(search) ||
                      p.email?.toLowerCase().includes(search)
                    );
                  }).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ border: 0, p: 0 }}>
                        <AuraEmptyState
                          title="No patients found"
                          description={
                            searchQuery
                              ? "Try adjusting your search"
                              : "No patients in the system yet"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    patients
                      .filter((p) => {
                        if (!searchQuery) return true;
                        const search = searchQuery.toLowerCase();
                        return (
                          p.firstName?.toLowerCase().includes(search) ||
                          p.lastName?.toLowerCase().includes(search) ||
                          p.email?.toLowerCase().includes(search)
                        );
                      })
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                      .map((patient) => (
                        <TableRow key={patient.id} hover>
                          <TableCell>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 2,
                              }}
                            >
                              <Avatar>
                                {patient.firstName?.[0]}
                                {patient.lastName?.[0]}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {patient.firstName} {patient.lastName}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {patient.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {patient.phone}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {patient.dateOfBirth
                              ? format(
                                  parseISO(patient.dateOfBirth),
                                  "MMM d, yyyy",
                                )
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              Last visit data
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              onClick={() => {
                                setSelectedPatientId(patient.id);
                                setViewMode("detail");
                              }}
                            >
                              View Records
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {page * rowsPerPage + 1}-
                {Math.min((page + 1) * rowsPerPage, patients.length)} of{" "}
                {patients.length}
              </Typography>
            </Box>
          </Paper>
        )}

        {/* Medical Records Detail View */}
        {viewMode === "detail" && !selectedPatientId && (
          <Paper sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h6" color="text.secondary">
              Select a patient from the list to view their medical records
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2 }}
              onClick={() => setViewMode("list")}
            >
              Go to Patient List
            </Button>
          </Paper>
        )}

        {viewMode === "detail" && selectedPatientId && (
          <>
            {/* Patient Info Card */}
            <InfoCard title="Patient Information">
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 2,
                  }}
                >
                  <Avatar
                    sx={{ width: 64, height: 64, bgcolor: "primary.main" }}
                  >
                    {patient?.firstName?.[0]}
                    {patient?.lastName?.[0]}
                  </Avatar>
                  <Box>
                    <Typography variant="h5">
                      {patient?.firstName} {patient?.lastName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Age:{" "}
                      {patient?.dateOfBirth
                        ? differenceInYears(
                            new Date(),
                            parseISO(patient.dateOfBirth),
                          )
                        : "N/A"}{" "}
                      •{patient?.gender} • DOB:{" "}
                      {patient?.dateOfBirth
                        ? format(parseISO(patient.dateOfBirth), "MMM d, yyyy")
                        : "N/A"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {patient?.email} • {patient?.phone}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<MessageIcon />}
                    onClick={() => setMessageDialogOpen(true)}
                  >
                    Send Message
                  </Button>
                  <Button
                    variant={editMode ? "contained" : "outlined"}
                    startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                    onClick={() =>
                      editMode ? handleSavePatient() : setEditMode(true)
                    }
                  >
                    {editMode ? "Save Changes" : "Edit Info"}
                  </Button>
                </Box>
              </Box>

              {/* Quick Stats */}
              {isSummaryLoading ? (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCardSkeleton />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCardSkeleton />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCardSkeleton />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCardSkeleton />
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard label="Blood Type" value="O+" compact />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard
                      label="Allergies"
                      value={
                        medicalHistory.filter(
                          (h: MedicalHistory) => h.category === "allergy",
                        ).length
                      }
                      compact
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard
                      label="Medications"
                      value={
                        medicalHistory.filter(
                          (h: MedicalHistory) =>
                            h.category === "medication" &&
                            h.status === "active",
                        ).length
                      }
                      compact
                    />
                  </Grid>
                  <Grid size={{ xs: 6, md: 3 }}>
                    <StatCard
                      label="Last Visit"
                      value={lastVisitDisplay}
                      compact
                    />
                  </Grid>
                </Grid>
              )}
            </InfoCard>

            {/* Main Content Tabs */}
            <Paper>
              <Tabs value={activeTab} onChange={(_e, v) => setActiveTab(v)}>
                <Tab icon={<PersonIcon />} label="Demographics" />
                <Tab icon={<HeartIcon />} label="Pain Assessment" />
                <Tab icon={<MedicalIcon />} label="Medical History" />
                <Tab icon={<TimelineIcon />} label="Timeline" />
                <Tab icon={<DocumentIcon />} label="Documents" />
              </Tabs>

              <TabPanel value={activeTab} index={0}>
                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="h6" gutterBottom>
                        <PersonIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                        Personal Information
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="First Name"
                          value={editedPatient?.firstName || ""}
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient,
                              firstName: e.target.value,
                            })
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Last Name"
                          value={editedPatient?.lastName || ""}
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient,
                              lastName: e.target.value,
                            })
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                        <DatePicker
                          label="Date of Birth"
                          value={
                            editedPatient?.dateOfBirth
                              ? parseISO(editedPatient.dateOfBirth)
                              : null
                          }
                          onChange={(date) =>
                            setEditedPatient({
                              ...editedPatient,
                              dateOfBirth: date?.toISOString(),
                            })
                          }
                          disabled={!editMode}
                          slotProps={{ textField: { fullWidth: true } }}
                        />
                        <FormControl fullWidth>
                          <InputLabel>Gender</InputLabel>
                          <Select
                            value={editedPatient?.gender || ""}
                            label="Gender"
                            onChange={(e) =>
                              setEditedPatient({
                                ...editedPatient,
                                gender: e.target.value,
                              })
                            }
                            disabled={!editMode}
                          >
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Female">Female</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </Select>
                        </FormControl>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="h6" gutterBottom>
                        Contact Information
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Email"
                          value={editedPatient?.email || ""}
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient,
                              email: e.target.value,
                            })
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Phone"
                          value={editedPatient?.phone || ""}
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient,
                              phone: e.target.value,
                            })
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Street Address"
                          value={editedPatient?.address?.street || ""}
                          onChange={(e) =>
                            setEditedPatient({
                              ...editedPatient,
                              address: {
                                ...editedPatient.address,
                                street: e.target.value,
                              },
                            })
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                        <Grid container spacing={2}>
                          <Grid size={6}>
                            <TextField
                              label="City"
                              value={editedPatient?.address?.city || ""}
                              onChange={(e) =>
                                setEditedPatient({
                                  ...editedPatient,
                                  address: {
                                    ...editedPatient.address,
                                    city: e.target.value,
                                  },
                                })
                              }
                              disabled={!editMode}
                              fullWidth
                            />
                          </Grid>
                          <Grid size={3}>
                            <TextField
                              label="State"
                              value={editedPatient?.address?.state || ""}
                              onChange={(e) =>
                                setEditedPatient({
                                  ...editedPatient,
                                  address: {
                                    ...editedPatient.address,
                                    state: e.target.value,
                                  },
                                })
                              }
                              disabled={!editMode}
                              fullWidth
                            />
                          </Grid>
                          <Grid size={3}>
                            <TextField
                              label="Zip"
                              value={
                                (editedPatient?.address as any)?.zipCode || ""
                              }
                              onChange={(e) =>
                                setEditedPatient({
                                  ...editedPatient,
                                  address: {
                                    ...editedPatient.address,
                                    zipCode: e.target.value,
                                  } as any,
                                })
                              }
                              disabled={!editMode}
                              fullWidth
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="h6" gutterBottom>
                        Emergency Contact
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Name"
                          value={(patient?.emergencyContact as any)?.name || ""}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Relationship"
                          value={
                            (patient?.emergencyContact as any)?.relationship ||
                            ""
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Phone"
                          value={
                            (patient?.emergencyContact as any)?.phone || ""
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                      </Stack>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography variant="h6" gutterBottom>
                        Insurance Information
                      </Typography>
                      <Stack spacing={2}>
                        <TextField
                          label="Provider"
                          value={(patient as any)?.insurance?.provider || ""}
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Policy Number"
                          value={
                            (patient as any)?.insurance?.policyNumber || ""
                          }
                          disabled={!editMode}
                          fullWidth
                        />
                        <TextField
                          label="Group Number"
                          value={(patient as any)?.insurance?.groupNumber || ""}
                          disabled={!editMode}
                          fullWidth
                        />
                      </Stack>
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6">
                      Pain Assessment History
                    </Typography>
                    <AuraButton
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setVitalDialogOpen(true)}
                    >
                      Record Assessment
                    </AuraButton>
                  </Box>

                  {/* Latest Pain Assessment */}
                  {vitalSigns.length > 0 && vitalSigns[0] && (
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <StatCard
                          label="Overall Pain Level"
                          value={`${vitalSigns[0].overallPainLevel || 0}/10`}
                          icon={<WarningIcon />}
                          iconColor={
                            vitalSigns[0].overallPainLevel > 6
                              ? "error"
                              : vitalSigns[0].overallPainLevel > 3
                                ? "warning"
                                : "success"
                          }
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <StatCard
                          label="Functional Impact"
                          value={vitalSigns[0].functionalImpact || "None"}
                          icon={<MedicalIcon />}
                          iconColor="primary"
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <StatCard
                          label="Pain Points"
                          value={`${vitalSigns[0].painPoints?.length || 0} areas`}
                          icon={<PersonIcon />}
                          iconColor="info"
                        />
                      </Grid>
                    </Grid>
                  )}

                  {/* Pain Trend Chart */}
                  <Grid container spacing={3}>
                    <Grid size={12}>
                      <AuraChartCard title="Pain Level Trend">
                        <ResponsiveContainer width="100%" height={200}>
                          <LineChart
                            data={vitalSigns.map((v) => ({
                              date: format(parseISO(v.recordedAt), "MMM d"),
                              value: v.overallPainLevel || 0,
                            }))}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 10]} />
                            <ChartTooltip />
                            <Line
                              type="monotone"
                              dataKey="value"
                              stroke="#f44336"
                              strokeWidth={2}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </AuraChartCard>
                    </Grid>
                  </Grid>

                  {/* Pain Assessments Table */}
                  <TableContainer component={Paper} sx={{ mt: 3 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date/Time</TableCell>
                          <TableCell>Overall Pain</TableCell>
                          <TableCell>Affected Areas</TableCell>
                          <TableCell>Functional Impact</TableCell>
                          <TableCell>Evaluation</TableCell>
                          <TableCell>Recorded By</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {vitalSigns.map((assessment: VitalSign) => (
                          <TableRow key={assessment.id}>
                            <TableCell>
                              {format(
                                parseISO(assessment.recordedAt),
                                "MMM d, yyyy h:mm a",
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${assessment.overallPainLevel || 0}/10`}
                                color={
                                  assessment.overallPainLevel > 6
                                    ? "error"
                                    : assessment.overallPainLevel > 3
                                      ? "warning"
                                      : "success"
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {assessment.painPoints?.map((p, i) => (
                                <Chip
                                  key={i}
                                  label={`${p.bodyPart}${p.side ? ` (${p.side})` : ""}: ${p.intensity}/10`}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                />
                              )) || "-"}
                            </TableCell>
                            <TableCell sx={{ textTransform: "capitalize" }}>
                              {assessment.functionalImpact || "-"}
                            </TableCell>
                            <TableCell>
                              {assessment.evaluationId ? (
                                <Button size="small" variant="outlined">
                                  View Eval
                                </Button>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>{assessment.recordedBy}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Pain Progression Timeline */}
                  {painProgression && painProgression.length > 0 && (
                    <Box sx={{ mt: 4 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>
                        Pain Drawing Progression
                      </Typography>
                      <PainMapProgression data={painProgression} />
                    </Box>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6">Medical History</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => setHistoryDialogOpen(true)}
                    >
                      Add Entry
                    </Button>
                  </Box>

                  {[
                    { key: "injury", label: "Previous Injuries" },
                    { key: "symptom", label: "Current Symptoms" },
                    { key: "treatment", label: "Treatment History" },
                    { key: "activity", label: "Exercise/Activity Level" },
                    { key: "occupation", label: "Occupation/Ergonomics" },
                    { key: "goal", label: "Goals/Objectives" },
                  ].map(({ key, label }) => (
                    <Accordion key={key}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 2 }}
                        >
                          {getCategoryIcon(key)}
                          <Typography variant="h6">{label}</Typography>
                          <Chip
                            label={
                              medicalHistory.filter(
                                (h: MedicalHistory) =>
                                  h.category === (key as any),
                              ).length
                            }
                            size="small"
                          />
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <List>
                          {medicalHistory
                            .filter(
                              (h: MedicalHistory) =>
                                h.category === (key as any),
                            )
                            .map((item: MedicalHistory) => (
                              <ListItem key={item.id}>
                                <ListItemIcon>
                                  {item.status === "active" ? (
                                    <CheckIcon color="success" />
                                  ) : (
                                    <InfoIcon />
                                  )}
                                </ListItemIcon>
                                <ListItemText
                                  primary={
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                      }}
                                    >
                                      <Typography>{item.title}</Typography>
                                      {item.severity && (
                                        <Chip
                                          label={item.severity}
                                          size="small"
                                          color={getSeverityColor(
                                            item.severity,
                                          )}
                                        />
                                      )}
                                      <Chip
                                        label={item.status}
                                        size="small"
                                        variant="outlined"
                                      />
                                    </Box>
                                  }
                                  secondary={
                                    <>
                                      <Typography variant="body2">
                                        {item.description}
                                      </Typography>
                                      {item.date && (
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          Since:{" "}
                                          {format(
                                            parseISO(item.date),
                                            "MMM d, yyyy",
                                          )}
                                        </Typography>
                                      )}
                                    </>
                                  }
                                />
                              </ListItem>
                            ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6">Medical Timeline</Typography>
                    <FormControl size="small">
                      <Select
                        value={timelineFilter}
                        onChange={(
                          event: SelectChangeEvent<TimelineFilter>,
                        ) => {
                          const value = event.target.value as TimelineFilter;
                          setTimelineFilter(value);
                        }}
                      >
                        <MenuItem value="all">All Events</MenuItem>
                        <MenuItem value="vital">Pain Assessments</MenuItem>
                        <MenuItem value="condition">Conditions</MenuItem>
                        <MenuItem value="medication">Medications</MenuItem>
                        <MenuItem value="surgery">Surgeries</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>

                  <Timeline position="alternate">
                    {generateTimeline().map((event, index) => (
                      <TimelineItem key={index}>
                        <TimelineOppositeContent color="text.secondary">
                          {format(parseISO(event.date), "MMM d, yyyy")}
                        </TimelineOppositeContent>
                        <TimelineSeparator>
                          <TimelineDot color={event.color}>
                            {event.icon}
                          </TimelineDot>
                          {index < generateTimeline().length - 1 && (
                            <TimelineConnector />
                          )}
                        </TimelineSeparator>
                        <TimelineContent>
                          <Paper sx={{ p: 2 }}>
                            <Typography variant="h6">{event.title}</Typography>
                            <Typography variant="body2">
                              {event.description}
                            </Typography>
                          </Paper>
                        </TimelineContent>
                      </TimelineItem>
                    ))}
                  </Timeline>
                </Box>
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                <Box sx={{ p: 3 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 3,
                    }}
                  >
                    <Typography variant="h6">
                      <DocumentIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                      Medical Documents
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => {
                        const input = document.createElement("input");
                        input.type = "file";
                        input.accept = ".pdf,.jpg,.jpeg,.png";
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement)
                            .files?.[0];
                          if (file && selectedPatientId) {
                            try {
                              await documentApi.upload({
                                file,
                                patientId: selectedPatientId,
                              });
                              refetchDocuments();
                              enqueueSnackbar(
                                "Document uploaded successfully",
                                { variant: "success" },
                              );
                            } catch (error) {
                              enqueueSnackbar("Failed to upload document", {
                                variant: "error",
                              });
                            }
                          }
                        };
                        input.click();
                      }}
                    >
                      Upload Document
                    </Button>
                  </Box>

                  {documents.length > 0 ? (
                    <Grid container spacing={2}>
                      {documents.map((doc) => (
                        <Grid size={12} key={doc.id}>
                          <InfoCard title={doc.fileName}>
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Box>
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{ mt: 1 }}
                                >
                                  <Chip
                                    label={doc.documentType}
                                    size="small"
                                    color="primary"
                                    variant="outlined"
                                  />
                                  <Chip
                                    label={doc.status}
                                    size="small"
                                    color={
                                      doc.status === "ready"
                                        ? "success"
                                        : doc.status === "processing"
                                          ? "warning"
                                          : "default"
                                    }
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {format(
                                      parseISO(doc.createdAt),
                                      "MMM d, yyyy",
                                    )}
                                  </Typography>
                                </Stack>
                                {doc.extractedPatientName && (
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mt: 1 }}
                                  >
                                    Extracted: {doc.extractedPatientName}
                                    {doc.extractedDob &&
                                      ` • DOB: ${doc.extractedDob}`}
                                    {doc.confidenceScore &&
                                      ` • ${doc.confidenceScore}% confidence`}
                                  </Typography>
                                )}
                                {doc.extractedText && (
                                  <Box sx={{ mt: 2 }}>
                                    <Typography
                                      variant="subtitle2"
                                      gutterBottom
                                    >
                                      Extracted Text:
                                    </Typography>
                                    <Paper
                                      sx={{
                                        p: 1.5,
                                        bgcolor: "grey.50",
                                        maxHeight: 200,
                                        overflow: "auto",
                                        fontFamily: "monospace",
                                        fontSize: "0.75rem",
                                        whiteSpace: "pre-wrap",
                                      }}
                                    >
                                      {doc.extractedText.substring(0, 500)}
                                      {doc.extractedText.length > 500 && "..."}
                                    </Paper>
                                  </Box>
                                )}
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 1,
                                }}
                              >
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={async () => {
                                    try {
                                      const { url } =
                                        await documentApi.getDownloadUrl(
                                          doc.id,
                                        );
                                      window.open(url, "_blank");
                                    } catch (error) {
                                      enqueueSnackbar(
                                        "Failed to download document",
                                        { variant: "error" },
                                      );
                                    }
                                  }}
                                >
                                  Download
                                </Button>
                                {doc.extractedText && (
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        doc.extractedText || "",
                                      );
                                      enqueueSnackbar(
                                        "Text copied to clipboard",
                                        { variant: "success" },
                                      );
                                    }}
                                  >
                                    Copy Text
                                  </Button>
                                )}
                              </Box>
                            </Box>
                          </InfoCard>
                        </Grid>
                      ))}
                    </Grid>
                  ) : (
                    <Paper sx={{ p: 4, textAlign: "center" }}>
                      <DocumentIcon
                        sx={{ fontSize: 48, color: "text.secondary", mb: 2 }}
                      />
                      <Typography variant="body1" color="text.secondary">
                        No documents uploaded yet
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </TabPanel>
            </Paper>
          </>
        )}

        {/* Record Pain Assessment Dialog */}
        <FormDialog
          open={vitalDialogOpen}
          onClose={() => setVitalDialogOpen(false)}
          title="Record Pain Assessment"
          onSubmit={() => addVitalMutation.mutate()}
          submitLabel="Record"
          submitDisabled={addVitalMutation.isPending}
          loading={addVitalMutation.isPending}
          maxWidth="sm"
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <Typography variant="subtitle2" gutterBottom>
                Overall Pain Level
              </Typography>
              <TextField
                label="Pain Level (0-10)"
                type="number"
                inputProps={{ min: 0, max: 10 }}
                value={newVital.overallPainLevel}
                onChange={(e) =>
                  setNewVital({
                    ...newVital,
                    overallPainLevel: parseInt(e.target.value) || 0,
                  })
                }
                fullWidth
                helperText="0 = No pain, 10 = Worst pain imaginable"
              />
            </Grid>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Functional Impact</InputLabel>
                <Select
                  value={newVital.functionalImpact || "none"}
                  label="Functional Impact"
                  onChange={(e) =>
                    setNewVital({
                      ...newVital,
                      functionalImpact: e.target.value as any,
                    })
                  }
                >
                  <MenuItem value="none">
                    None - No impact on daily activities
                  </MenuItem>
                  <MenuItem value="mild">Mild - Minor limitations</MenuItem>
                  <MenuItem value="moderate">
                    Moderate - Significant limitations
                  </MenuItem>
                  <MenuItem value="severe">
                    Severe - Unable to perform activities
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Notes"
                multiline
                rows={3}
                value={newVital.notes}
                onChange={(e) =>
                  setNewVital({ ...newVital, notes: e.target.value })
                }
                fullWidth
                placeholder="Additional observations, pain quality, aggravating/relieving factors..."
              />
            </Grid>
            <Grid size={12}>
              <Typography variant="caption" color="text.secondary">
                Note: Detailed pain mapping is captured during evaluations. This
                is for quick pain tracking between sessions.
              </Typography>
            </Grid>
          </Grid>
        </FormDialog>

        {/* Add Medical History Dialog */}
        <FormDialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          title="Add Medical History Entry"
          onSubmit={() => addHistoryMutation.mutate()}
          submitLabel="Add Entry"
          submitDisabled={
            addHistoryMutation.isPending ||
            !newHistory.title ||
            !newHistory.description
          }
          loading={addHistoryMutation.isPending}
          maxWidth="sm"
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={newHistory.category}
                  label="Category"
                  onChange={(
                    event: SelectChangeEvent<MedicalHistory["category"]>,
                  ) => {
                    const value = event.target
                      .value as MedicalHistory["category"];
                    setNewHistory({ ...newHistory, category: value });
                  }}
                >
                  <MenuItem value="injury">Previous Injury</MenuItem>
                  <MenuItem value="symptom">Current Symptom</MenuItem>
                  <MenuItem value="treatment">Treatment History</MenuItem>
                  <MenuItem value="activity">Exercise/Activity</MenuItem>
                  <MenuItem value="occupation">Occupation/Ergonomics</MenuItem>
                  <MenuItem value="goal">Goal/Objective</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <TextField
                label="Title"
                value={newHistory.title}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, title: e.target.value })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Description"
                multiline
                rows={3}
                value={newHistory.description}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, description: e.target.value })
                }
                fullWidth
                required
              />
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newHistory.status}
                  label="Status"
                  onChange={(
                    event: SelectChangeEvent<MedicalHistory["status"]>,
                  ) => {
                    const value = event.target
                      .value as MedicalHistory["status"];
                    setNewHistory({ ...newHistory, status: value });
                  }}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth>
                <InputLabel>Severity</InputLabel>
                <Select
                  value={newHistory.severity}
                  label="Severity"
                  onChange={(
                    event: SelectChangeEvent<
                      NonNullable<MedicalHistory["severity"]>
                    >,
                  ) => {
                    const value = event.target.value as NonNullable<
                      MedicalHistory["severity"]
                    >;
                    setNewHistory({ ...newHistory, severity: value });
                  }}
                >
                  <MenuItem value="mild">Mild</MenuItem>
                  <MenuItem value="moderate">Moderate</MenuItem>
                  <MenuItem value="severe">Severe</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={12}>
              <DatePicker
                label="Date"
                value={newHistory.date ? parseISO(newHistory.date) : null}
                onChange={(newValue) =>
                  setNewHistory({
                    ...newHistory,
                    date: newValue ? newValue.toISOString() : undefined,
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Additional Notes"
                multiline
                rows={2}
                value={newHistory.notes}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, notes: e.target.value })
                }
                fullWidth
              />
            </Grid>
          </Grid>
        </FormDialog>

        {/* Message Composer */}
        {patient && (
          <MessageComposer
            open={messageDialogOpen}
            onClose={() => setMessageDialogOpen(false)}
            recipients={[
              {
                id: selectedPatientId || "",
                name: `${patient.firstName} ${patient.lastName}`,
                type: "patient",
              },
            ]}
          />
        )}
      </Box>
    </LocalizationProvider>
  );
};

export default MedicalRecords;
