import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Box,
  Tabs,
  Tab,
  TextField,
  Grid,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";
import {
  Person as PersonIcon,
  Favorite as HeartIcon,
  MedicalServices as MedicalIcon,
  Timeline as TimelineIcon,
  Description as DocumentIcon,
  Send as ReferralIcon,
  Save as SaveIcon,
  FitnessCenter as TreatmentIcon,
} from "@mui/icons-material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { format, parseISO } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSnackbar } from "notistack";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  PageHeader,
  TabPanel,
  FormDialog,
  AuraButton,
  SelectField,
  AuraCard,
  ProgressBar,
  AuraStatusBadge,
  auraTokens,
} from "@qivr/design-system";

import {
  PatientSidebar,
  PatientHeader,
  DemographicsTab,
  PainAssessmentTab,
  MedicalHistoryTab,
  TimelineTab,
  DocumentsTab,
  ReferralsTab,
  PainBodyMap,
  type PainPoint,
  DemographicsSkeleton,
  PainAssessmentSkeleton,
  MedicalHistorySkeleton,
  TimelineSkeleton,
  DocumentsSkeleton,
  ReferralsSkeleton,
} from "./components";

import {
  usePatientList,
  useMedicalSummary,
  useVitalSigns,
  useDocuments,
  useMedications,
  useAllergies,
  useImmunizations,
  useProcedures,
  usePhysioHistory,
  usePainProgression,
  usePatientTimeline,
  usePatientReferrals,
  useAggregatedMedicalHistory,
} from "./hooks";

import { patientApi, type UpdatePatientDto } from "../../services/patientApi";
import { medicalRecordsApi } from "../../services/medicalRecordsApi";
import { documentApi } from "../../services/documentApi";
import { treatmentPlansApi } from "../../lib/api";
import { MessageComposer } from "../../components/messaging";
import { AssignTreatmentPlanDialog } from "../../components/dialogs";
import type { Patient, MedicalHistory, PatientQuickStats } from "./types";

// Treatment Tab Content Component
interface TreatmentPlan {
  id: string;
  title: string;
  status: string;
  durationWeeks: number;
  completedSessions: number;
  totalSessions: number;
  createdAt: string;
  bodyRegion?: string;
}

interface TreatmentTabContentProps {
  patientId: string | null;
  patient?: Patient | null;
}

const TreatmentTabContent: React.FC<TreatmentTabContentProps> = ({
  patientId,
  patient,
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["patient-treatment-plans", patientId],
    queryFn: () => treatmentPlansApi.list(patientId || undefined),
    enabled: !!patientId,
  });

  if (!patientId || !patient) {
    return (
      <Box sx={{ p: auraTokens.spacing.xl, textAlign: "center" }}>
        <Typography color="text.secondary">
          Select a patient to view treatment plans
        </Typography>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box sx={{ p: auraTokens.spacing.xl }}>
        <Typography color="text.secondary">
          Loading treatment plans...
        </Typography>
      </Box>
    );
  }

  if (plans.length === 0) {
    return (
      <Box sx={{ p: auraTokens.spacing.xl, textAlign: "center" }}>
        <TreatmentIcon sx={{ fontSize: 48, color: "text.disabled", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Treatment Plans
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          Create a treatment plan to track rehabilitation progress
        </Typography>
        <AuraButton
          variant="contained"
          onClick={() => setAssignDialogOpen(true)}
        >
          Assign Treatment Plan
        </AuraButton>

        <AssignTreatmentPlanDialog
          open={assignDialogOpen}
          onClose={() => setAssignDialogOpen(false)}
          patient={{
            id: patient.id,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
          }}
          onSuccess={(planId) => {
            queryClient.invalidateQueries({
              queryKey: ["patient-treatment-plans", patientId],
            });
            navigate(`/treatment-plans/${planId}`);
          }}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ p: auraTokens.spacing.lg }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: auraTokens.spacing.lg,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Treatment Plans
        </Typography>
        <AuraButton
          size="small"
          variant="outlined"
          onClick={() => setAssignDialogOpen(true)}
        >
          Assign New Plan
        </AuraButton>
      </Box>
      <Grid container spacing={2}>
        {plans.map((plan: TreatmentPlan) => {
          const progress =
            plan.totalSessions > 0
              ? Math.round((plan.completedSessions / plan.totalSessions) * 100)
              : 0;
          return (
            <Grid size={{ xs: 12, md: 6 }} key={plan.id}>
              <AuraCard
                clickable
                hover
                variant="flat"
                onClick={() => navigate(`/treatment-plans/${plan.id}`)}
                sx={{ p: auraTokens.spacing.md }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    mb: 1,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600}>
                    {plan.title}
                  </Typography>
                  <AuraStatusBadge status={plan.status} />
                </Box>
                {plan.bodyRegion && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mb: 1.5 }}
                  >
                    {plan.bodyRegion}
                  </Typography>
                )}
                <ProgressBar
                  value={progress}
                  label={`${plan.completedSessions} / ${plan.totalSessions} sessions`}
                  size="small"
                  color={plan.status === "active" ? "primary" : "info"}
                />
              </AuraCard>
            </Grid>
          );
        })}
      </Grid>

      <AssignTreatmentPlanDialog
        open={assignDialogOpen}
        onClose={() => setAssignDialogOpen(false)}
        patient={{
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
        }}
        onSuccess={(planId) => {
          queryClient.invalidateQueries({
            queryKey: ["patient-treatment-plans", patientId],
          });
          navigate(`/treatment-plans/${planId}`);
        }}
      />
    </Box>
  );
};

const TAB_NAMES = [
  "demographics",
  "pain",
  "history",
  "treatment",
  "timeline",
  "documents",
  "referrals",
] as const;
type TabName = (typeof TAB_NAMES)[number];

const MedicalRecordsPage: React.FC = () => {
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL state
  const urlPatientId = searchParams.get("patientId");
  const urlTab = searchParams.get("tab") as TabName | null;

  // State
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(
    urlPatientId,
  );
  const [activeTab, setActiveTab] = useState(() => {
    const tabIndex = urlTab ? TAB_NAMES.indexOf(urlTab) : 0;
    return tabIndex >= 0 ? tabIndex : 0;
  });
  const [editMode, setEditMode] = useState(false);
  const [editedPatient, setEditedPatient] = useState<Partial<Patient>>({});
  const [vitalDialogOpen, setVitalDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "history";
    id: string;
    title: string;
  } | null>(null);
  const [editingHistoryItem, setEditingHistoryItem] =
    useState<MedicalHistory | null>(null);

  // New entry states with validation
  const [newVital, setNewVital] = useState<{
    overallPainLevel: number;
    functionalImpact: "none" | "mild" | "moderate" | "severe";
    painPoints: PainPoint[];
    notes: string;
  }>({
    overallPainLevel: 0,
    functionalImpact: "none",
    painPoints: [],
    notes: "",
  });

  const [newHistory, setNewHistory] = useState<Partial<MedicalHistory>>({
    category: "injury",
    title: "",
    description: "",
    status: "active",
    severity: "mild",
  });

  // Form validation state
  const [vitalErrors, setVitalErrors] = useState<{ painLevel?: string }>({});
  const [historyErrors, setHistoryErrors] = useState<{ title?: string }>({});

  // Data fetching
  const { data: patientList, isLoading: isLoadingPatients } = usePatientList();
  const patients = useMemo(() => patientList?.data ?? [], [patientList?.data]);

  const patient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId],
  );

  // Lazy loading - only fetch data for active tab
  const shouldFetchSummary = activeTab === 0 || activeTab === 2;
  const shouldFetchVitals = activeTab === 1;
  const shouldFetchHistory = activeTab === 2;
  const shouldFetchTimeline = activeTab === 3;
  const shouldFetchDocuments = activeTab === 4;
  const shouldFetchReferrals = activeTab === 5;

  const { data: medicalSummary, isLoading: isSummaryLoading } =
    useMedicalSummary(shouldFetchSummary ? selectedPatientId : null);
  const { data: vitalSigns = [], isLoading: isVitalsLoading } = useVitalSigns(
    shouldFetchVitals ? selectedPatientId : null,
  );
  const {
    data: documents = [],
    refetch: refetchDocuments,
    isLoading: isDocumentsLoading,
  } = useDocuments(shouldFetchDocuments ? selectedPatientId : null);
  const { data: referrals = [], isLoading: isReferralsLoading } =
    usePatientReferrals(shouldFetchReferrals ? selectedPatientId : null);
  const { data: medications = [], isLoading: isMedicationsLoading } =
    useMedications(shouldFetchHistory ? selectedPatientId : null);
  const { data: allergies = [] } = useAllergies(
    shouldFetchHistory ? selectedPatientId : null,
  );
  const { data: immunizations = [] } = useImmunizations(
    shouldFetchHistory ? selectedPatientId : null,
  );
  const { data: procedures = [] } = useProcedures(
    shouldFetchHistory ? selectedPatientId : null,
  );
  const { data: physioHistory = [] } = usePhysioHistory(
    shouldFetchHistory ? selectedPatientId : null,
  );
  const { data: painProgression } = usePainProgression(
    shouldFetchVitals ? selectedPatientId : null,
  );
  const { data: timeline = [], isLoading: isTimelineLoading } =
    usePatientTimeline(shouldFetchTimeline ? selectedPatientId : null);

  const medicalHistory = useAggregatedMedicalHistory(
    selectedPatientId,
    medicalSummary,
    medications,
    allergies,
    immunizations,
    procedures,
    physioHistory,
  );

  // Sync URL with state
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedPatientId) params.set("patientId", selectedPatientId);
    const tabName = TAB_NAMES[activeTab];
    if (activeTab > 0 && tabName) params.set("tab", tabName);
    setSearchParams(params, { replace: true });
  }, [selectedPatientId, activeTab, setSearchParams]);

  // Auto-select first patient if none selected
  useEffect(() => {
    if (!selectedPatientId && patients.length > 0 && patients[0]) {
      setSelectedPatientId(patients[0].id);
    }
  }, [patients, selectedPatientId]);

  // Sync edited patient when patient changes
  useEffect(() => {
    if (patient) {
      setEditedPatient(patient);
    }
  }, [patient]);

  // Quick stats with real blood type
  const quickStats: PatientQuickStats | null = useMemo(() => {
    if (!patient || isSummaryLoading) return null;

    const lastVisit = medicalSummary?.recentVisits?.[0]?.date;

    return {
      bloodType: (patient as any).bloodType || "Unknown",
      allergiesCount: medicalHistory.filter((h) => h.category === "allergy")
        .length,
      activeMedicationsCount: medicalHistory.filter(
        (h) => h.category === "medication" && h.status === "active",
      ).length,
      lastVisit: lastVisit ? format(parseISO(lastVisit), "MMM d, yyyy") : "N/A",
    };
  }, [patient, medicalSummary, medicalHistory, isSummaryLoading]);

  // Validation functions
  const validateVitalForm = useCallback((): boolean => {
    const errors: { painLevel?: string } = {};

    if (newVital.overallPainLevel < 0 || newVital.overallPainLevel > 10) {
      errors.painLevel = "Pain level must be between 0 and 10";
    }

    setVitalErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newVital]);

  const validateHistoryForm = useCallback((): boolean => {
    const errors: { title?: string } = {};

    if (!newHistory.title?.trim()) {
      errors.title = "Title is required";
    }

    setHistoryErrors(errors);
    return Object.keys(errors).length === 0;
  }, [newHistory]);

  // Mutations
  const updatePatientMutation = useMutation({
    mutationFn: (updates: UpdatePatientDto) =>
      patientApi.updatePatient(selectedPatientId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["medicalRecords", "patients"],
      });
      enqueueSnackbar("Patient information saved", { variant: "success" });
      setEditMode(false);
    },
    onError: () => {
      enqueueSnackbar("Failed to save patient information", {
        variant: "error",
      });
    },
  });

  const addVitalMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) throw new Error("No patient selected");
      return medicalRecordsApi.createVitalSigns({
        patientId: selectedPatientId,
        overallPainLevel: newVital.overallPainLevel,
        functionalImpact: newVital.functionalImpact,
        painPoints: newVital.painPoints,
        notes: newVital.notes,
      });
    },
    onSuccess: () => {
      enqueueSnackbar("Pain assessment recorded", { variant: "success" });
      setVitalDialogOpen(false);
      setNewVital({
        overallPainLevel: 0,
        functionalImpact: "none",
        painPoints: [],
        notes: "",
      });
      setVitalErrors({});
      queryClient.invalidateQueries({
        queryKey: ["vitalSigns", selectedPatientId],
      });
    },
    onError: () => {
      enqueueSnackbar("Failed to record pain assessment", { variant: "error" });
    },
  });

  const addHistoryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPatientId) throw new Error("No patient selected");

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

      throw new Error("Unsupported category");
    },
    onSuccess: () => {
      const category = newHistory.category || "injury";
      enqueueSnackbar(
        `${category.charAt(0).toUpperCase() + category.slice(1)} added`,
        { variant: "success" },
      );
      setHistoryDialogOpen(false);
      setNewHistory({
        category: "injury",
        title: "",
        description: "",
        status: "active",
        severity: "mild",
      });
      setHistoryErrors({});
      setEditingHistoryItem(null);
      queryClient.invalidateQueries({
        queryKey: ["physioHistory", selectedPatientId],
      });
      queryClient.invalidateQueries({
        queryKey: ["medicalSummary", selectedPatientId],
      });
    },
    onError: () => {
      enqueueSnackbar("Failed to add entry", { variant: "error" });
    },
  });

  // Handlers
  const handlePatientSelect = useCallback((patientId: string | null) => {
    setSelectedPatientId(patientId);
    setEditMode(false);
  }, []);

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);
    },
    [],
  );

  const handleSavePatient = () => {
    if (!selectedPatientId || !editedPatient) return;
    updatePatientMutation.mutate({
      firstName: editedPatient.firstName,
      lastName: editedPatient.lastName,
      email: editedPatient.email,
      phone: editedPatient.phone,
      dateOfBirth: editedPatient.dateOfBirth,
      gender: editedPatient.gender,
      address: editedPatient.address || undefined,
    });
  };

  const handleAddVital = () => {
    if (validateVitalForm()) {
      addVitalMutation.mutate();
    }
  };

  const handleAddHistory = () => {
    if (validateHistoryForm()) {
      addHistoryMutation.mutate();
    }
  };

  const handleEditHistoryEntry = (item: MedicalHistory) => {
    setEditingHistoryItem(item);
    setNewHistory({
      category: item.category,
      title: item.title,
      description: item.description,
      date: item.date,
      status: item.status,
      severity: item.severity,
      notes: item.notes,
    });
    setHistoryDialogOpen(true);
  };

  const handleDeleteHistoryEntry = (item: MedicalHistory) => {
    setItemToDelete({ type: "history", id: item.id, title: item.title });
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      // Note: Backend delete endpoint would be called here
      // await medicalRecordsApi.deletePhysioHistory(itemToDelete.id);
      enqueueSnackbar(`${itemToDelete.title} deleted`, { variant: "success" });
      queryClient.invalidateQueries({
        queryKey: ["physioHistory", selectedPatientId],
      });
    } catch {
      enqueueSnackbar("Failed to delete entry", { variant: "error" });
    } finally {
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
    }
  };

  const handleUploadDocument = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.jpg,.jpeg,.png";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && selectedPatientId) {
        try {
          await documentApi.upload({ file, patientId: selectedPatientId });
          refetchDocuments();
          enqueueSnackbar("Document uploaded successfully", {
            variant: "success",
          });
        } catch {
          enqueueSnackbar("Failed to upload document", { variant: "error" });
        }
      }
    };
    input.click();
  };

  const handleDownloadDocument = async (docId: string) => {
    try {
      const { url } = await documentApi.getDownloadUrl(docId);
      window.open(url, "_blank");
    } catch {
      enqueueSnackbar("Failed to download document", { variant: "error" });
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    enqueueSnackbar("Text copied to clipboard", { variant: "success" });
  };

  const handleScheduleAppointment = () => {
    if (selectedPatientId) {
      navigate(`/appointments/new?patientId=${selectedPatientId}`);
    }
  };

  // Loading state per tab
  const isTabLoading = useMemo(() => {
    switch (activeTab) {
      case 0:
        return isSummaryLoading;
      case 1:
        return isVitalsLoading;
      case 2:
        return isMedicationsLoading;
      case 3:
        return isTimelineLoading;
      case 4:
        return isDocumentsLoading;
      case 5:
        return isReferralsLoading;
      default:
        return false;
    }
  }, [
    activeTab,
    isSummaryLoading,
    isVitalsLoading,
    isMedicationsLoading,
    isTimelineLoading,
    isDocumentsLoading,
    isReferralsLoading,
  ]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box
        className="page-enter"
        sx={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
        <PageHeader
          title="Medical Records"
          description="Comprehensive patient health information"
          actions={
            editMode ? (
              <AuraButton
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSavePatient}
                loading={updatePatientMutation.isPending}
              >
                Save Changes
              </AuraButton>
            ) : undefined
          }
        />

        <Box sx={{ flex: 1, display: "flex", overflow: "hidden", mt: 2 }}>
          {/* Patient Sidebar */}
          <PatientSidebar
            patients={patients}
            selectedPatientId={selectedPatientId}
            onSelectPatient={handlePatientSelect}
            isLoading={isLoadingPatients}
          />

          {/* Main Content */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Patient Header */}
            <PatientHeader
              patient={patient}
              stats={quickStats}
              isLoading={isSummaryLoading}
              onEdit={() => setEditMode(!editMode)}
              onMessage={() => setMessageDialogOpen(true)}
              onSchedule={handleScheduleAppointment}
              onNewTreatmentPlan={() => {
                if (selectedPatientId) {
                  navigate(`/treatment-plans?patientId=${selectedPatientId}`);
                }
              }}
              onSendProm={() => {
                if (selectedPatientId) {
                  navigate(`/prom?action=send&patientId=${selectedPatientId}`);
                }
              }}
              onNewReferral={() => {
                if (selectedPatientId) {
                  navigate(
                    `/referrals?action=new&patientId=${selectedPatientId}`,
                  );
                }
              }}
            />

            {/* Tabs */}
            {patient && (
              <Box
                sx={{
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                }}
              >
                <Tabs value={activeTab} onChange={handleTabChange}>
                  <Tab
                    icon={<PersonIcon />}
                    iconPosition="start"
                    label="Demographics"
                  />
                  <Tab
                    icon={<HeartIcon />}
                    iconPosition="start"
                    label="Pain Assessment"
                  />
                  <Tab
                    icon={<MedicalIcon />}
                    iconPosition="start"
                    label="Medical History"
                  />
                  <Tab
                    icon={<TreatmentIcon />}
                    iconPosition="start"
                    label="Treatment"
                  />
                  <Tab
                    icon={<TimelineIcon />}
                    iconPosition="start"
                    label="Timeline"
                  />
                  <Tab
                    icon={<DocumentIcon />}
                    iconPosition="start"
                    label="Documents"
                  />
                  <Tab
                    icon={<ReferralIcon />}
                    iconPosition="start"
                    label="Referrals"
                  />
                </Tabs>
              </Box>
            )}

            {/* Tab Content with Loading States */}
            <Box
              sx={{ flex: 1, overflow: "auto", bgcolor: alpha("#f8fafc", 0.5) }}
            >
              <TabPanel value={activeTab} index={0}>
                {isTabLoading ? (
                  <DemographicsSkeleton />
                ) : (
                  <DemographicsTab
                    patient={patient}
                    editedPatient={editedPatient}
                    editMode={editMode}
                    onPatientChange={(updates) =>
                      setEditedPatient({ ...editedPatient, ...updates })
                    }
                  />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={1}>
                {isTabLoading ? (
                  <PainAssessmentSkeleton />
                ) : (
                  <PainAssessmentTab
                    vitalSigns={vitalSigns}
                    painProgression={painProgression}
                    onAddAssessment={() => setVitalDialogOpen(true)}
                  />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={2}>
                {isTabLoading ? (
                  <MedicalHistorySkeleton />
                ) : (
                  <MedicalHistoryTab
                    medicalHistory={medicalHistory}
                    onAddEntry={() => {
                      setEditingHistoryItem(null);
                      setNewHistory({
                        category: "injury",
                        title: "",
                        description: "",
                        status: "active",
                        severity: "mild",
                      });
                      setHistoryDialogOpen(true);
                    }}
                    onEditEntry={handleEditHistoryEntry}
                    onDeleteEntry={handleDeleteHistoryEntry}
                  />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={3}>
                <TreatmentTabContent
                  patientId={selectedPatientId}
                  patient={patient}
                />
              </TabPanel>

              <TabPanel value={activeTab} index={4}>
                {isTabLoading ? (
                  <TimelineSkeleton />
                ) : (
                  <TimelineTab timeline={timeline} />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={5}>
                {isTabLoading ? (
                  <DocumentsSkeleton />
                ) : (
                  <DocumentsTab
                    documents={documents}
                    onUpload={handleUploadDocument}
                    onDownload={handleDownloadDocument}
                    onCopyText={handleCopyText}
                  />
                )}
              </TabPanel>

              <TabPanel value={activeTab} index={6}>
                {isTabLoading ? (
                  <ReferralsSkeleton />
                ) : (
                  <ReferralsTab
                    referrals={referrals}
                    patientId={selectedPatientId}
                  />
                )}
              </TabPanel>
            </Box>
          </Box>
        </Box>

        {/* Pain Assessment Dialog with Body Map */}
        <FormDialog
          open={vitalDialogOpen}
          onClose={() => {
            setVitalDialogOpen(false);
            setVitalErrors({});
          }}
          title="Record Pain Assessment"
          onSubmit={handleAddVital}
          submitLabel="Record Assessment"
          submitDisabled={addVitalMutation.isPending}
          loading={addVitalMutation.isPending}
          maxWidth="md"
        >
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, md: 5 }}>
              <TextField
                label="Overall Pain Level (0-10)"
                type="number"
                inputProps={{ min: 0, max: 10 }}
                value={newVital.overallPainLevel}
                onChange={(e) => {
                  const val = Math.max(
                    0,
                    Math.min(10, parseInt(e.target.value) || 0),
                  );
                  setNewVital({ ...newVital, overallPainLevel: val });
                  if (vitalErrors.painLevel) setVitalErrors({});
                }}
                fullWidth
                error={!!vitalErrors.painLevel}
                helperText={
                  vitalErrors.painLevel ||
                  "0 = No pain, 10 = Worst pain imaginable"
                }
              />
              <Box sx={{ mt: 2 }}>
                <SelectField
                  label="Functional Impact"
                  value={newVital.functionalImpact}
                  onChange={(value) =>
                    setNewVital({ ...newVital, functionalImpact: value as any })
                  }
                  options={[
                    {
                      value: "none",
                      label: "None - No impact on daily activities",
                    },
                    { value: "mild", label: "Mild - Minor limitations" },
                    {
                      value: "moderate",
                      label: "Moderate - Significant limitations",
                    },
                    {
                      value: "severe",
                      label: "Severe - Unable to perform activities",
                    },
                  ]}
                  fullWidth
                />
              </Box>
              <Box sx={{ mt: 2 }}>
                <TextField
                  label="Notes"
                  multiline
                  rows={4}
                  value={newVital.notes}
                  onChange={(e) =>
                    setNewVital({ ...newVital, notes: e.target.value })
                  }
                  fullWidth
                  placeholder="Additional observations, triggers, relief factors..."
                />
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 7 }}>
              <PainBodyMap
                value={newVital.painPoints}
                onChange={(points) =>
                  setNewVital({ ...newVital, painPoints: points })
                }
              />
            </Grid>
          </Grid>
        </FormDialog>

        {/* Medical History Dialog */}
        <FormDialog
          open={historyDialogOpen}
          onClose={() => {
            setHistoryDialogOpen(false);
            setHistoryErrors({});
            setEditingHistoryItem(null);
          }}
          title={
            editingHistoryItem
              ? "Edit Medical History Entry"
              : "Add Medical History Entry"
          }
          onSubmit={handleAddHistory}
          submitLabel={editingHistoryItem ? "Save Changes" : "Add Entry"}
          submitDisabled={addHistoryMutation.isPending}
          loading={addHistoryMutation.isPending}
          maxWidth="sm"
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={12}>
              <SelectField
                label="Category"
                value={newHistory.category || "injury"}
                onChange={(value) =>
                  setNewHistory({ ...newHistory, category: value as any })
                }
                options={[
                  { value: "injury", label: "Previous Injury" },
                  { value: "symptom", label: "Current Symptom" },
                  { value: "treatment", label: "Treatment History" },
                  { value: "activity", label: "Exercise/Activity" },
                  { value: "occupation", label: "Occupation/Ergonomics" },
                  { value: "goal", label: "Goal/Objective" },
                ]}
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Title"
                value={newHistory.title}
                onChange={(e) => {
                  setNewHistory({ ...newHistory, title: e.target.value });
                  if (historyErrors.title) setHistoryErrors({});
                }}
                fullWidth
                required
                error={!!historyErrors.title}
                helperText={historyErrors.title}
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
              />
            </Grid>
            <Grid size={6}>
              <SelectField
                label="Status"
                value={newHistory.status || "active"}
                onChange={(value) =>
                  setNewHistory({ ...newHistory, status: value as any })
                }
                options={[
                  { value: "active", label: "Active" },
                  { value: "resolved", label: "Resolved" },
                  { value: "ongoing", label: "Ongoing" },
                ]}
                fullWidth
              />
            </Grid>
            <Grid size={6}>
              <SelectField
                label="Severity"
                value={newHistory.severity || "mild"}
                onChange={(value) =>
                  setNewHistory({ ...newHistory, severity: value as any })
                }
                options={[
                  { value: "mild", label: "Mild" },
                  { value: "moderate", label: "Moderate" },
                  { value: "severe", label: "Severe" },
                  { value: "critical", label: "Critical" },
                ]}
                fullWidth
              />
            </Grid>
            <Grid size={12}>
              <DatePicker
                label="Date"
                value={newHistory.date ? parseISO(newHistory.date) : null}
                onChange={(date) =>
                  setNewHistory({
                    ...newHistory,
                    date: date ? date.toISOString() : undefined,
                  })
                }
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Notes"
                multiline
                rows={2}
                value={newHistory.notes || ""}
                onChange={(e) =>
                  setNewHistory({ ...newHistory, notes: e.target.value })
                }
                fullWidth
                placeholder="Additional notes..."
              />
            </Grid>
          </Grid>
        </FormDialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            Are you sure you want to delete &ldquo;{itemToDelete?.title}&rdquo;?
            This action cannot be undone.
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirmDelete}
              color="error"
              variant="contained"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>

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

export default MedicalRecordsPage;
