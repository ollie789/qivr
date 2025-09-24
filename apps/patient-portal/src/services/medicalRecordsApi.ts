import apiClient from '../lib/api-client';
import {
  ApiEnvelope,
  Allergy,
  Immunization,
  LabResultGroup,
  MedicalSummary,
  Medication,
  VitalSign,
} from '../types';

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;

function unwrapEnvelope<T>(payload: EnvelopeOrValue<T>): T {
  if (payload && typeof payload === 'object' && 'data' in (payload as ApiEnvelope<T>)) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export async function fetchMedicalSummary(): Promise<MedicalSummary | null> {
  const response = await apiClient.get<EnvelopeOrValue<MedicalSummary | null>>('/api/MedicalRecords');
  return unwrapEnvelope(response);
}

export async function fetchVitalSigns(): Promise<VitalSign[]> {
  const response = await apiClient.get<EnvelopeOrValue<VitalSign[]>>('/api/MedicalRecords/vitals');
  return unwrapEnvelope(response);
}

export async function fetchLabResults(): Promise<LabResultGroup[]> {
  const response = await apiClient.get<EnvelopeOrValue<LabResultGroup[]>>('/api/MedicalRecords/lab-results');
  return unwrapEnvelope(response);
}

export async function fetchMedications(): Promise<Medication[]> {
  const response = await apiClient.get<EnvelopeOrValue<Medication[]>>('/api/MedicalRecords/medications');
  return unwrapEnvelope(response);
}

export async function fetchAllergies(): Promise<Allergy[]> {
  const response = await apiClient.get<EnvelopeOrValue<Allergy[]>>('/api/MedicalRecords/allergies');
  return unwrapEnvelope(response);
}

export async function fetchImmunizations(): Promise<Immunization[]> {
  const response = await apiClient.get<EnvelopeOrValue<Immunization[]>>('/api/MedicalRecords/immunizations');
  return unwrapEnvelope(response);
}
