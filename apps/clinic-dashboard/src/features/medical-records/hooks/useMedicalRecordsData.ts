import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { medicalRecordsApi } from '../../../services/medicalRecordsApi';
import { patientApi, type PatientListResponse } from '../../../services/patientApi';
import { documentApi } from '../../../services/documentApi';
import apiClient from '../../../lib/api-client';
import type { MedicalHistory } from '../types';

export function usePatientList() {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery<PatientListResponse>({
    queryKey: ['medicalRecords', 'patients'],
    queryFn: () => patientApi.getPatients({ limit: 200 }),
    staleTime: 5 * 60 * 1000,
    enabled: canMakeApiCalls,
  });
}

export function useMedicalSummary(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['medicalSummary', patientId],
    queryFn: async () => {
      if (!patientId) return null;
      return medicalRecordsApi.getSummary(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useVitalSigns(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['vitalSigns', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return medicalRecordsApi.getVitals(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useLabResults(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['labResults', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return medicalRecordsApi.getLabResults(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useDocuments(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['documents', patientId],
    queryFn: () => documentApi.list({ patientId: patientId! }),
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useMedications(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['medications', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return medicalRecordsApi.getMedications(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useAllergies(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['allergies', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return medicalRecordsApi.getAllergies(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useImmunizations(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['immunizations', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return medicalRecordsApi.getImmunizations(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useProcedures(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['procedures', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return medicalRecordsApi.getProcedures(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function usePhysioHistory(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['physioHistory', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return medicalRecordsApi.getPhysioHistory(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function usePainProgression(patientId: string | null) {
  return useQuery({
    queryKey: ['painProgression', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return await apiClient.get(`/api/pain-map-analytics/progression/${patientId}`);
    },
    enabled: Boolean(patientId),
  });
}

export function usePatientTimeline(patientId: string | null) {
  return useQuery({
    queryKey: ['patient-timeline', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const response = await apiClient.get(`/api/patients/${patientId}/timeline`);
      return response.data;
    },
    enabled: !!patientId,
  });
}

export function useAggregatedMedicalHistory(
  patientId: string | null,
  medicalSummary: any,
  medications: any[],
  allergies: any[],
  immunizations: any[],
  procedures: any[],
  physioHistory: any[]
): MedicalHistory[] {
  return useMemo(() => {
    if (!patientId) return [];

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

    medicalSummary?.conditions?.forEach((condition: any) => {
      const match = condition.condition?.match(/^\[([A-Z]+)\]\s*(.+)$/);
      const category = (match ? match[1]?.toLowerCase() : 'condition') as MedicalHistory['category'];
      const title = match ? match[2] || condition.condition : condition.condition;

      entries.push({
        id: condition.id,
        category: category,
        title: title || 'Untitled',
        description: condition.managedBy,
        date: condition.diagnosedDate,
        status: condition.status === 'resolved' ? 'resolved' : 'active',
        severity: undefined,
        notes: condition.notes ?? undefined,
      });
    });

    medications.forEach((medication) => {
      entries.push({
        id: medication.id,
        category: 'medication',
        title: medication.name,
        description: medication.instructions ?? medication.frequency,
        date: medication.startDate,
        status: medication.status === 'completed' ? 'resolved' : 'active',
        severity: undefined,
        notes: medication.instructions ?? undefined,
      });
    });

    allergies.forEach((allergy) => {
      entries.push({
        id: allergy.id,
        category: 'allergy',
        title: allergy.allergen,
        description: allergy.reaction,
        date: allergy.diagnosedDate ?? undefined,
        status: 'active',
        severity: (allergy.severity?.toLowerCase() as MedicalHistory['severity']) ?? undefined,
        notes: allergy.notes ?? undefined,
      });
    });

    immunizations.forEach((immunization) => {
      entries.push({
        id: immunization.id,
        category: 'immunization',
        title: immunization.vaccine,
        description: immunization.provider,
        date: immunization.date,
        status: 'resolved',
        severity: undefined,
        notes: immunization.facility,
      });
    });

    procedures.forEach((procedure: any) => {
      entries.push({
        id: procedure.id,
        category: 'surgery',
        title: procedure.procedureName,
        description: procedure.provider,
        date: procedure.procedureDate,
        status: procedure.status === 'completed' ? 'resolved' : 'active',
        severity: undefined,
        notes: procedure.notes ?? procedure.outcome ?? undefined,
      });
    });

    medicalSummary?.recentVisits?.forEach((visit: any) => {
      entries.push({
        id: visit.id,
        category: 'visit',
        title: visit.provider,
        description: visit.facility,
        date: visit.date,
        status: 'resolved',
        severity: undefined,
        notes: visit.notes ?? undefined,
      });
    });

    return entries.sort((a, b) => {
      const aDate = a.date ? new Date(a.date).getTime() : 0;
      const bDate = b.date ? new Date(b.date).getTime() : 0;
      return bDate - aDate;
    });
  }, [patientId, medicalSummary, medications, allergies, immunizations, procedures, physioHistory]);
}
