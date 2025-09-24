export interface VitalSign {
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
}

export type LabResultStatus = 'normal' | 'abnormal-high' | 'abnormal-low' | 'critical';

export interface LabResult {
  id: string;
  date: string;
  testName: string;
  category: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: LabResultStatus;
  provider: string;
  notes?: string;
}

export interface LabResultGroup {
  category: string;
  date: string;
  tests: LabResult[];
}

export type MedicationStatus = 'active' | 'completed' | 'discontinued';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: MedicationStatus;
  refillsRemaining?: number;
  lastFilled?: string;
  pharmacy?: string;
  instructions?: string;
}

export type AllergyType = 'medication' | 'food' | 'environmental' | 'other';
export type AllergySeverity = 'mild' | 'moderate' | 'severe' | 'life-threatening';

export interface Allergy {
  id: string;
  allergen: string;
  type: AllergyType;
  severity: AllergySeverity;
  reaction: string;
  diagnosedDate?: string;
  notes?: string;
}

export interface Immunization {
  id: string;
  vaccine: string;
  date: string;
  provider: string;
  facility: string;
  nextDue?: string;
  series?: string;
  lotNumber?: string;
}

export type MedicalConditionStatus = 'active' | 'resolved' | 'chronic' | 'managed';

export interface MedicalCondition {
  id: string;
  condition: string;
  icd10Code?: string;
  diagnosedDate: string;
  status: MedicalConditionStatus;
  managedBy: string;
  lastReviewed: string;
  notes?: string;
}

export interface MedicalDocument {
  id: string;
  title: string;
  category: string;
  date: string;
  provider: string;
  facility: string;
  fileType: string;
  fileSize: string;
  url?: string;
}

export interface MedicalSummary {
  conditions: MedicalCondition[];
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
    notes?: string;
  }>;
}
