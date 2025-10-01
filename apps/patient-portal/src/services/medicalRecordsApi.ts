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
  const response = await apiClient.get<EnvelopeOrValue<MedicalSummary | null>>('/api/medical-records');
  return unwrapEnvelope(response);
}

export async function fetchVitalSigns(): Promise<VitalSign[]> {
  const response = await apiClient.get<EnvelopeOrValue<VitalSign[]>>('/api/medical-records/vitals');
  return unwrapEnvelope(response);
}

export async function fetchLabResults(): Promise<LabResultGroup[]> {
  const response = await apiClient.get<EnvelopeOrValue<LabResultGroup[]>>('/api/medical-records/lab-results');
  return unwrapEnvelope(response);
}

export async function fetchMedications(): Promise<Medication[]> {
  const response = await apiClient.get<EnvelopeOrValue<Medication[]>>('/api/medical-records/medications');
  return unwrapEnvelope(response);
}

export async function fetchAllergies(): Promise<Allergy[]> {
  const response = await apiClient.get<EnvelopeOrValue<Allergy[]>>('/api/medical-records/allergies');
  return unwrapEnvelope(response);
}

export async function fetchImmunizations(): Promise<Immunization[]> {
  const response = await apiClient.get<EnvelopeOrValue<Immunization[]>>('/api/medical-records/immunizations');
  return unwrapEnvelope(response);
}
