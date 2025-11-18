import { useQuery } from "@tanstack/react-query";
import {
  fetchAllergies,
  fetchImmunizations,
  fetchLabResults,
  fetchMedicalSummary,
  fetchMedications,
  fetchPainAssessments,
} from "../../../services/medicalRecordsApi";
import type {
  Allergy,
  Immunization,
  LabResultGroup,
  MedicalSummary,
  Medication,
  PainAssessment,
} from "../../../types";

type MedicalRecordsData = {
  summary: MedicalSummary | null;
  vitalSigns: PainAssessment[];
  labGroups: LabResultGroup[];
  medications: Medication[];
  allergies: Allergy[];
  immunizations: Immunization[];
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

  return {
    summary: summary ?? null,
    vitalSigns,
    labGroups,
    medications,
    allergies,
    immunizations,
    loading:
      summaryLoading ||
      vitalsLoading ||
      labsLoading ||
      medsLoading ||
      allergiesLoading ||
      immunizationsLoading,
  };
}
