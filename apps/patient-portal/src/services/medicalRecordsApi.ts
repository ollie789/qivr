import apiClient from "../lib/api-client";
import {
  ApiEnvelope,
  Allergy,
  Immunization,
  LabResultGroup,
  MedicalSummary,
  Medication,
  PainAssessment,
  PhysioHistory,
} from "../types";

type EnvelopeOrValue<T> = ApiEnvelope<T> | T;

function unwrapEnvelope<T>(payload: EnvelopeOrValue<T>): T {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as ApiEnvelope<T>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export async function fetchMedicalSummary(): Promise<MedicalSummary | null> {
  const response = await apiClient.get<EnvelopeOrValue<MedicalSummary | null>>(
    "/api/medical-records",
  );
  return unwrapEnvelope(response);
}

export async function fetchPainAssessments(): Promise<PainAssessment[]> {
  const response = await apiClient.get<EnvelopeOrValue<PainAssessment[]>>(
    "/api/medical-records/pain-assessments",
  );
  return unwrapEnvelope(response);
}

export async function fetchLabResults(): Promise<LabResultGroup[]> {
  const response = await apiClient.get<EnvelopeOrValue<LabResultGroup[]>>(
    "/api/medical-records/lab-results",
  );
  return unwrapEnvelope(response);
}

export async function fetchMedications(): Promise<Medication[]> {
  const response = await apiClient.get<EnvelopeOrValue<Medication[]>>(
    "/api/medical-records/medications",
  );
  return unwrapEnvelope(response);
}

export async function fetchAllergies(): Promise<Allergy[]> {
  const response = await apiClient.get<EnvelopeOrValue<Allergy[]>>(
    "/api/medical-records/allergies",
  );
  return unwrapEnvelope(response);
}

export async function fetchImmunizations(): Promise<Immunization[]> {
  const response = await apiClient.get<EnvelopeOrValue<Immunization[]>>(
    "/api/medical-records/immunizations",
  );
  return unwrapEnvelope(response);
}

export async function fetchPhysioHistory(): Promise<PhysioHistory[]> {
  const response = await apiClient.get<EnvelopeOrValue<PhysioHistory[]>>(
    "/api/medical-records/physio-history",
  );
  return unwrapEnvelope(response);
}
