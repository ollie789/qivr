import type { Patient } from '../../services/patientApi';
import type { VitalSign } from '../../services/medicalRecordsApi';

export interface MedicalHistory {
  id: string;
  category: MedicalHistoryCategory;
  title: string;
  description: string;
  date?: string;
  status: 'active' | 'resolved' | 'ongoing';
  severity?: 'mild' | 'moderate' | 'severe' | 'critical';
  notes?: string;
}

export type MedicalHistoryCategory =
  | 'injury'
  | 'symptom'
  | 'treatment'
  | 'activity'
  | 'occupation'
  | 'goal'
  | 'condition'
  | 'surgery'
  | 'allergy'
  | 'medication'
  | 'immunization'
  | 'family'
  | 'visit';

export interface TimelineEvent {
  type: string;
  date: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  color?: 'inherit' | 'grey' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
  status?: string;
  notes?: string;
}

export type TimelineFilter = 'all' | 'vital' | MedicalHistoryCategory;

export interface MedicalRecordsContextValue {
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  patient: Patient | null;
  isLoading: boolean;
  activeTab: number;
  setActiveTab: (tab: number) => void;
  editMode: boolean;
  setEditMode: (mode: boolean) => void;
}

export interface PatientQuickStats {
  bloodType: string;
  allergiesCount: number;
  activeMedicationsCount: number;
  lastVisit: string;
}

export { type Patient, type VitalSign };
