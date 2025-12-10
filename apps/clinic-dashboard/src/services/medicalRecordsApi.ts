import apiClient from "../lib/api-client";

export type MedicalSummary = {
  conditions: MedicalCondition[];
  upcomingAppointments: UpcomingAppointment[];
  recentVisits: RecentVisit[];
};

export type MedicalCondition = {
  id: string;
  condition: string;
  icd10Code?: string | null;
  diagnosedDate: string;
  status: string;
  managedBy: string;
  lastReviewed: string;
  notes?: string | null;
  // Allied health specific fields
  affectedArea?: string | null; // e.g., "Lower back", "Right shoulder"
  onsetType?: "acute" | "gradual" | "chronic" | null;
  previousTreatments?: string | null; // Previous physio, chiro, etc.
  aggravatingFactors?: string | null;
  relievingFactors?: string | null;
};

export type UpcomingAppointment = {
  id: string;
  date: string;
  provider: string;
  type: string;
  status: string;
};

export type RecentVisit = {
  id: string;
  date: string;
  provider: string;
  facility: string;
  notes?: string | null;
};

export type PainAssessment = {
  id: string;
  patientId: string;
  evaluationId?: string | null;
  recordedAt: string;
  recordedBy: string;
  painPoints: Array<{
    bodyPart: string;
    side?: "left" | "right" | "bilateral" | null;
    intensity: number; // 0-10 scale
    quality?: string | null; // sharp, dull, aching, burning, etc.
  }>;
  overallPainLevel: number; // 0-10 scale
  functionalImpact: "none" | "mild" | "moderate" | "severe";
  notes?: string | null;
};

// Keep VitalSign for backward compatibility but mark as deprecated
/** @deprecated Use PainAssessment for allied health records */
export type VitalSign = PainAssessment;

export type LabResult = {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange?: string | null;
  status: string;
  provider: string;
  notes?: string | null;
};

export type LabResultGroup = {
  category: string;
  date: string;
  tests: LabResult[];
};

export type Medication = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  prescribedBy: string;
  instructions?: string | null;
  refillsRemaining?: number | null;
  lastFilled?: string | null;
  pharmacy?: string | null;
};

export type Allergy = {
  id: string;
  allergen: string;
  type: string;
  severity: string;
  reaction: string;
  diagnosedDate?: string | null;
  notes?: string | null;
};

export type Immunization = {
  id: string;
  vaccine: string;
  date: string;
  provider: string;
  facility: string;
  nextDue?: string | null;
  series?: string | null;
  lotNumber?: string | null;
};

export type PhysioHistory = {
  id: string;
  category:
    | "injury"
    | "symptom"
    | "treatment"
    | "activity"
    | "occupation"
    | "goal";
  title: string;
  description: string;
  date?: string | null;
  status: "active" | "resolved" | "ongoing";
  severity?: "mild" | "moderate" | "severe" | "critical" | null;
  notes?: string | null;
};

type ApiEnvelope<T> = {
  data: T;
};

type MedicalSummaryDto = {
  conditions: Array<{
    id: string;
    condition: string;
    icd10Code?: string | null;
    diagnosedDate: string;
    status: string;
    managedBy: string;
    lastReviewed: string;
    notes?: string | null;
  }>;
  upcomingAppointments: Array<{
    id: string;
    date: string;
    provider: string;
    type: string;
    status: string;
  }>;
  recentVisits: Array<{
    id: string;
    date: string;
    provider: string;
    facility: string;
    notes?: string | null;
  }>;
};

type VitalSignDto = {
  id: string;
  date: string;
  bloodPressure: { systolic: number; diastolic: number };
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi: number;
  oxygenSaturation: number;
  respiratoryRate: number;
};

type LabResultGroupDto = {
  category: string;
  date: string;
  tests: Array<{
    id: string;
    testName: string;
    value: string;
    unit: string;
    referenceRange?: string | null;
    status: string;
    provider: string;
    notes?: string | null;
  }>;
};

type MedicationDto = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string | null;
  status: string;
  prescribedBy: string;
  instructions?: string | null;
  refillsRemaining?: number | null;
  lastFilled?: string | null;
  pharmacy?: string | null;
};

type AllergyDto = {
  id: string;
  allergen: string;
  type: string;
  severity: string;
  reaction: string;
  diagnosedDate?: string | null;
  notes?: string | null;
};

type ImmunizationDto = {
  id: string;
  vaccine: string;
  date: string;
  provider: string;
  facility: string;
  nextDue?: string | null;
  series?: string | null;
  lotNumber?: string | null;
};

type PhysioHistoryDto = {
  id: string;
  category: string;
  title: string;
  description: string;
  date?: string | null;
  status: string;
  severity?: string | null;
  notes?: string | null;
};

type ProcedureDto = {
  id: string;
  procedureName: string;
  cptCode?: string | null;
  procedureDate: string;
  provider?: string | null;
  facility?: string | null;
  status?: string | null;
  outcome?: string | null;
  complications?: string | null;
  notes?: string | null;
};

type MedicalConditionDto = {
  id: string;
  condition: string;
  icd10Code?: string | null;
  diagnosedDate: string;
  status: string;
  managedBy: string;
  lastReviewed: string;
  notes?: string | null;
};

const unwrapEnvelope = <T>(payload: T | ApiEnvelope<T>): T => {
  if (
    payload &&
    typeof payload === "object" &&
    "data" in (payload as ApiEnvelope<T>)
  ) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
};

const toIsoString = (value: string): string => new Date(value).toISOString();

const mapSummary = (dto: MedicalSummaryDto | null): MedicalSummary | null => {
  if (!dto) {
    return null;
  }

  return {
    conditions: dto.conditions.map((condition) => ({
      id: condition.id,
      condition: condition.condition,
      icd10Code: condition.icd10Code ?? null,
      diagnosedDate: toIsoString(condition.diagnosedDate),
      status: condition.status,
      managedBy: condition.managedBy,
      lastReviewed: toIsoString(condition.lastReviewed),
      notes: condition.notes ?? null,
    })),
    upcomingAppointments: dto.upcomingAppointments.map((appointment) => ({
      id: appointment.id,
      date: toIsoString(appointment.date),
      provider: appointment.provider,
      type: appointment.type,
      status: appointment.status,
    })),
    recentVisits: dto.recentVisits.map((visit) => ({
      id: visit.id,
      date: toIsoString(visit.date),
      provider: visit.provider,
      facility: visit.facility,
      notes: visit.notes ?? null,
    })),
  };
};

interface PainAssessmentDto {
  id: string;
  date?: string;
  recordedAt?: string;
  recordedBy?: string;
  overallPainLevel?: number;
  functionalImpact?: "none" | "mild" | "moderate" | "severe";
  painPoints?: Array<{
    bodyPart: string;
    side?: "left" | "right" | "bilateral" | null;
    intensity: number;
    quality?: string | null;
  }>;
  evaluationId?: string | null;
  notes?: string | null;
}

const mapVital =
  (patientId: string) =>
  (dto: PainAssessmentDto): VitalSign => ({
    id: dto.id,
    patientId,
    recordedAt: toIsoString(dto.date || dto.recordedAt),
    recordedBy: dto.recordedBy || "Care Team",
    overallPainLevel: dto.overallPainLevel || 0,
    functionalImpact: dto.functionalImpact || "none",
    painPoints: dto.painPoints || [],
    evaluationId: dto.evaluationId,
    notes: dto.notes || null,
  });

const mapLabGroup = (dto: LabResultGroupDto): LabResultGroup => ({
  category: dto.category,
  date: toIsoString(dto.date),
  tests: dto.tests.map((test) => ({
    id: test.id,
    testName: test.testName,
    value: test.value,
    unit: test.unit,
    referenceRange: test.referenceRange ?? null,
    status: test.status,
    provider: test.provider,
    notes: test.notes ?? null,
  })),
});

const mapMedication = (dto: MedicationDto): Medication => ({
  id: dto.id,
  name: dto.name,
  dosage: dto.dosage,
  frequency: dto.frequency,
  startDate: toIsoString(dto.startDate),
  endDate: dto.endDate ? toIsoString(dto.endDate) : null,
  status: dto.status,
  prescribedBy: dto.prescribedBy,
  instructions: dto.instructions ?? null,
  refillsRemaining: dto.refillsRemaining ?? null,
  lastFilled: dto.lastFilled ? toIsoString(dto.lastFilled) : null,
  pharmacy: dto.pharmacy ?? null,
});

const mapAllergy = (dto: AllergyDto): Allergy => ({
  id: dto.id,
  allergen: dto.allergen,
  type: dto.type,
  severity: dto.severity,
  reaction: dto.reaction,
  diagnosedDate: dto.diagnosedDate ? toIsoString(dto.diagnosedDate) : null,
  notes: dto.notes ?? null,
});

const mapImmunization = (dto: ImmunizationDto): Immunization => ({
  id: dto.id,
  vaccine: dto.vaccine,
  date: toIsoString(dto.date),
  provider: dto.provider,
  facility: dto.facility,
  nextDue: dto.nextDue ? toIsoString(dto.nextDue) : null,
  series: dto.series ?? null,
  lotNumber: dto.lotNumber ?? null,
});

class MedicalRecordsApi {
  async getSummary(patientId: string): Promise<MedicalSummary | null> {
    const response = await apiClient.get<
      ApiEnvelope<MedicalSummaryDto | null> | MedicalSummaryDto | null
    >("/api/medical-records", { patientId });
    const dto = unwrapEnvelope(response);
    const mapped = mapSummary(dto);
    return mapped;
  }

  async getVitals(patientId: string): Promise<VitalSign[]> {
    const response = await apiClient.get<VitalSignDto[]>(
      "/api/medical-records/vitals",
      { patientId },
    );

    return (response ?? []).map(mapVital(patientId));
  }

  async getLabResults(patientId: string): Promise<LabResultGroup[]> {
    const response = await apiClient.get<LabResultGroupDto[]>(
      "/api/medical-records/lab-results",
      { patientId },
    );

    return (response ?? []).map(mapLabGroup);
  }

  async getMedications(patientId: string): Promise<Medication[]> {
    const response = await apiClient.get<MedicationDto[]>(
      "/api/medical-records/medications",
      { patientId },
    );

    return (response ?? []).map(mapMedication);
  }

  async getAllergies(patientId: string): Promise<Allergy[]> {
    const response = await apiClient.get<AllergyDto[]>(
      "/api/medical-records/allergies",
      { patientId },
    );

    return (response ?? []).map(mapAllergy);
  }

  async getImmunizations(patientId: string): Promise<Immunization[]> {
    const response = await apiClient.get<ImmunizationDto[]>(
      "/api/medical-records/immunizations",
      { patientId },
    );

    return (response ?? []).map(mapImmunization);
  }

  async getProcedures(patientId: string): Promise<ProcedureDto[]> {
    const response = await apiClient.get<ProcedureDto[]>(
      "/api/medical-records/procedures",
      { patientId },
    );

    return response ?? [];
  }

  async createVitalSigns(data: {
    patientId: string;
    overallPainLevel: number;
    functionalImpact: "none" | "mild" | "moderate" | "severe";
    painPoints: Array<{
      bodyPart: string;
      side?: "left" | "right" | "bilateral" | null;
      intensity: number;
      quality?: string | null;
    }>;
    notes?: string;
    evaluationId?: string;
  }): Promise<VitalSign> {
    const response = await apiClient.post<PainAssessmentDto>(
      "/api/medical-records/pain-assessments",
      data,
    );
    return {
      id: response.id,
      patientId: data.patientId,
      recordedAt: response.recordedAt || new Date().toISOString(),
      recordedBy: response.recordedBy || "Current User",
      overallPainLevel: data.overallPainLevel,
      functionalImpact: data.functionalImpact,
      painPoints: data.painPoints,
      evaluationId: data.evaluationId,
      notes: data.notes,
    };
  }

  async createMedication(data: {
    patientId: string;
    name: string;
    dosage: string;
    frequency: string;
    startDate: string;
    endDate?: string;
    instructions?: string;
  }): Promise<Medication> {
    const response = await apiClient.post<MedicationDto>(
      "/api/medical-records/medications",
      data,
    );
    return mapMedication(response);
  }

  async createAllergy(data: {
    patientId: string;
    allergen: string;
    type: string;
    severity: string;
    reaction: string;
    notes?: string;
  }): Promise<Allergy> {
    const response = await apiClient.post<AllergyDto>(
      "/api/medical-records/allergies",
      data,
    );
    return mapAllergy(response);
  }

  async createCondition(data: {
    patientId: string;
    condition: string;
    icd10Code?: string;
    diagnosedDate: string;
    status?: string;
    managedBy?: string;
    notes?: string;
  }): Promise<MedicalCondition> {
    const response = await apiClient.post<MedicalConditionDto>(
      "/api/medical-records/conditions",
      data,
    );
    return {
      id: response.id,
      condition: response.condition,
      icd10Code: response.icd10Code ?? null,
      diagnosedDate: toIsoString(response.diagnosedDate),
      status: response.status,
      managedBy: response.managedBy,
      lastReviewed: toIsoString(response.lastReviewed),
      notes: response.notes ?? null,
    };
  }

  async createImmunization(data: {
    patientId: string;
    vaccine: string;
    date: string;
    nextDue?: string;
    provider?: string;
    facility?: string;
    lotNumber?: string;
    series?: string;
  }): Promise<Immunization> {
    const response = await apiClient.post<ImmunizationDto>(
      "/api/medical-records/immunizations",
      data,
    );
    return mapImmunization(response);
  }

  async createProcedure(data: {
    patientId: string;
    procedureName: string;
    cptCode?: string;
    procedureDate: string;
    provider?: string;
    facility?: string;
    status?: string;
    outcome?: string;
    complications?: string;
    notes?: string;
  }): Promise<ProcedureDto> {
    const response = await apiClient.post<ProcedureDto>(
      "/api/medical-records/procedures",
      data,
    );
    return response;
  }

  async getPhysioHistory(patientId: string): Promise<PhysioHistory[]> {
    const response = await apiClient.get<PhysioHistoryDto[]>(
      `/api/medical-records/physio-history?patientId=${patientId}`,
    );
    return response.map((dto) => ({
      id: dto.id,
      category: dto.category as PhysioHistory["category"],
      title: dto.title,
      description: dto.description,
      date: dto.date ? toIsoString(dto.date) : null,
      status: dto.status as PhysioHistory["status"],
      severity: dto.severity as PhysioHistory["severity"],
      notes: dto.notes ?? null,
    }));
  }

  async createPhysioHistory(data: {
    patientId: string;
    category: string;
    title: string;
    description: string;
    date?: string;
    status?: string;
    severity?: string;
    notes?: string;
  }): Promise<PhysioHistory> {
    const response = await apiClient.post<PhysioHistoryDto>(
      "/api/medical-records/physio-history",
      data,
    );
    return {
      id: response.id,
      category: response.category as PhysioHistory["category"],
      title: response.title,
      description: response.description,
      date: response.date ? toIsoString(response.date) : null,
      status: response.status as PhysioHistory["status"],
      severity: response.severity as PhysioHistory["severity"],
      notes: response.notes ?? null,
    };
  }
}

export const medicalRecordsApi = new MedicalRecordsApi();
