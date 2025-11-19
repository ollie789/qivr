import { useQuery } from "@tanstack/react-query";
import {
  fetchAllergies,
  fetchImmunizations,
  fetchLabResults,
  fetchMedicalSummary,
  fetchMedications,
  fetchPainAssessments,
  fetchPhysioHistory,
} from "../../../services/medicalRecordsApi";
import type {
  Allergy,
  Immunization,
  LabResultGroup,
  MedicalSummary,
  Medication,
  PainAssessment,
  PhysioHistory,
} from "../../../types";

type MedicalRecordsData = {
  summary: MedicalSummary | null;
  vitalSigns: PainAssessment[];
  labGroups: LabResultGroup[];
  medications: Medication[];
  allergies: Allergy[];
  immunizations: Immunization[];
  physioHistory: PhysioHistory[];
  loading: boolean;
};

export function useMedicalRecordsData(): MedicalRecordsData {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["medicalSummary"],
    queryFn: fetchMedicalSummary,
  });

  const { data: vitalSigns = [], isLoading: vitalsLoading } = useQuery({
    queryKey: ["painAssessments"],
    queryFn: fetchPainAssessments,
  });

  const { data: labGroups = [], isLoading: labsLoading } = useQuery({
    queryKey: ["labResults"],
    queryFn: fetchLabResults,
  });

  const { data: medications = [], isLoading: medsLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: fetchMedications,
  });

  const { data: allergies = [], isLoading: allergiesLoading } = useQuery({
    queryKey: ["allergies"],
    queryFn: fetchAllergies,
  });

  const { data: immunizations = [], isLoading: immunizationsLoading } =
    useQuery({
      queryKey: ["immunizations"],
      queryFn: fetchImmunizations,
    });

  const { data: physioHistory = [], isLoading: physioLoading } = useQuery({
    queryKey: ["physioHistory"],
    queryFn: fetchPhysioHistory,
  });

  return {
    summary: summary ?? null,
    vitalSigns,
    labGroups,
    medications,
    allergies,
    immunizations,
    physioHistory,
    loading:
      summaryLoading ||
      vitalsLoading ||
      labsLoading ||
      medsLoading ||
      allergiesLoading ||
      immunizationsLoading ||
      physioLoading,
  };
}
