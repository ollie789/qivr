import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuthGuard } from '../../../hooks/useAuthGuard';
import { medicalRecordsApi } from '../../../services/medicalRecordsApi';
import { patientApi, type PatientListResponse } from '../../../services/patientApi';
import { documentApi } from '../../../services/documentsApi';
import { referralApi } from '../../../services/referralApi';
import { promApi, type PromResponse } from '../../../services/promApi';
import { intakeApi, type IntakeDetails } from '../../../services/intakeApi';
import apiClient from '../../../lib/api-client';
import type { MedicalHistory } from '../types';
import type { Appointment } from '../../../types';

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

export function usePatientReferrals(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery({
    queryKey: ['referrals', 'patient', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return referralApi.getByPatient(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function useAggregatedMedicalHistory(
  patientId: string | null,
  medicalSummary: any,
  medications: any[],
  allergies: any[],
  immunizations: any[],
  procedures: any[],
  physioHistory: any[],
  intakeData?: IntakeDetails | null
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

    // Auto-create goals from intake data
    if (intakeData) {
      const intakeDate = intakeData.evaluation?.submittedAt;

      // Add treatment goals from evaluation
      if (intakeData.evaluation?.treatmentGoals) {
        entries.push({
          id: `intake-goal-${intakeData.id}`,
          category: 'goal',
          title: 'Patient Treatment Goals',
          description: intakeData.evaluation.treatmentGoals,
          date: intakeDate,
          status: 'active',
          severity: undefined,
          notes: 'From intake form',
        });
      }

      // Add individual goals from questionnaire
      intakeData.questionnaireResponses?.goals?.forEach((goal, idx) => {
        if (goal?.trim()) {
          entries.push({
            id: `intake-goal-q-${intakeData.id}-${idx}`,
            category: 'goal',
            title: goal,
            description: '',
            date: intakeDate,
            status: 'active',
            severity: undefined,
            notes: 'From intake questionnaire',
          });
        }
      });

      // Add previous treatments as treatment history
      if (intakeData.evaluation?.previousTreatments) {
        const treatments = Array.isArray(intakeData.evaluation.previousTreatments)
          ? intakeData.evaluation.previousTreatments
          : [intakeData.evaluation.previousTreatments];
        treatments.forEach((treatment, idx) => {
          if (treatment?.trim()) {
            entries.push({
              id: `intake-treatment-${intakeData.id}-${idx}`,
              category: 'treatment',
              title: treatment,
              description: '',
              date: intakeDate,
              status: 'resolved',
              severity: undefined,
              notes: 'From intake form',
            });
          }
        });
      }

      // Add current treatments from questionnaire
      intakeData.questionnaireResponses?.currentTreatments?.forEach((treatment, idx) => {
        if (treatment?.trim()) {
          entries.push({
            id: `intake-current-treatment-${intakeData.id}-${idx}`,
            category: 'treatment',
            title: treatment,
            description: '',
            date: intakeDate,
            status: 'active',
            severity: undefined,
            notes: 'Current treatment from intake',
          });
        }
      });
    }

    medicalSummary?.conditions?.forEach((condition: any) => {
      const match = condition.condition?.match(/^\[([A-Z]+)\]\s*(.+)$/);
      const category = (
        match ? match[1]?.toLowerCase() : 'condition'
      ) as MedicalHistory['category'];
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
  }, [
    patientId,
    medicalSummary,
    medications,
    allergies,
    immunizations,
    procedures,
    physioHistory,
    intakeData,
  ]);
}

// New hooks for clinical summary

export function usePatientIntake(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery<IntakeDetails | null>({
    queryKey: ['patient-intake', patientId],
    queryFn: async () => {
      if (!patientId) return null;

      // Get the patient's details for fallback matching
      const patient = await patientApi.getPatient(patientId);
      const patientEmail = patient?.email?.toLowerCase();
      const patientName = `${patient?.firstName || ''} ${patient?.lastName || ''}`
        .trim()
        .toLowerCase();

      // Get all intakes
      const { data } = await intakeApi.getIntakes({ limit: 100 });

      // First try: find intake linked by patientId
      let linkedIntake = data.find((intake) => intake.patientId === patientId);

      // Second try: match by email if not linked by patientId
      if (!linkedIntake && patientEmail) {
        linkedIntake = data.find((intake) => intake.email?.toLowerCase() === patientEmail);
      }

      // Third try: match by patient name
      if (!linkedIntake && patientName) {
        linkedIntake = data.find((intake) => intake.patientName?.toLowerCase() === patientName);
      }

      if (linkedIntake) {
        return intakeApi.getIntakeDetails(linkedIntake.id);
      }
      return null;
    },
    enabled: canMakeApiCalls && !!patientId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatientPromResponses(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery<PromResponse[]>({
    queryKey: ['patient-proms', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const result = await promApi.getResponses({ patientId, limit: 50 });
      return result.data;
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function usePatientAppointments(patientId: string | null) {
  const { canMakeApiCalls } = useAuthGuard();

  return useQuery<Appointment[]>({
    queryKey: ['patient-appointments', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      return patientApi.getPatientAppointments(patientId);
    },
    enabled: canMakeApiCalls && !!patientId,
  });
}

export function usePatientTreatmentPlans(patientId: string | null) {
  return useQuery({
    queryKey: ['patient-treatment-plans', patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const response = await apiClient.get(`/api/treatment-plans`, {
        patientId,
      });
      return Array.isArray(response) ? response : [];
    },
    enabled: !!patientId,
  });
}
