/**
 * Intake Form Types
 * Shared types for patient intake questionnaires across all apps
 */

export interface PainPoint {
  key: string;
  view: "front" | "back";
  region: string;
  originalName?: string;
  displayName: string;
  xPercent: number;
  yPercent: number;
  intensity: number;
  intensityLevel: IntensityLevel;
}

export type IntensityLevel = "low" | "medium" | "high";

export function getIntensityLevel(value: number): IntensityLevel {
  if (value <= 3) return "low";
  if (value <= 7) return "medium";
  return "high";
}

export const painDescriptions: Record<number, string> = {
  0: "No Pain",
  1: "Very Mild",
  2: "Mild Pain",
  3: "Mild-Moderate",
  4: "Moderate Pain",
  5: "Moderate",
  6: "Moderate-Severe",
  7: "Severe Pain",
  8: "Very Severe",
  9: "Nearly Unbearable",
  10: "Worst Pain Possible",
};

/**
 * Complete intake form data structure
 */
export interface IntakeFormData {
  // Personal Info (for widget - portal gets from auth)
  fullName?: string;
  email?: string;
  phone?: string;
  ageRange?: string;

  // Pain Info
  painDuration?: string;
  painIntensity?: number;
  chiefComplaint?: string;

  // Pain Qualities
  painQualities?: string[];

  // Medical History
  painStart?: string;
  hasImaging?: string;
  imagingTimeframe?: string;
  imagingTypes?: string[];
  prevOrtho?: string[];
  currentTreatments?: string[];
  medications?: string[];
  mobilityAids?: string[];
  dailyImpact?: string[];
  additionalHistory?: string[];
  redFlags?: string[];

  // Goals & Expectations
  goals?: string[];
  timeline?: string;
  milestones?: string[];
  concerns?: string[];

  // Consent & Meta
  consentTreatment?: boolean;
  consentPrivacy?: boolean;
  consentMarketing?: boolean;
  additionalNotes?: string;
  currentStep?: number;
  _savedAt?: string;
}

/**
 * Question types supported by the intake form
 */
export type QuestionType =
  | "text"
  | "email"
  | "tel"
  | "select"
  | "checkbox-group"
  | "number"
  | "slider"
  | "textarea";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface Question {
  name: string;
  label: string;
  type: QuestionType;
  required?: boolean;
  options?: SelectOption[] | CheckboxOption[];
  placeholder?: string;
  min?: number;
  max?: number;
  rows?: number;
  /** Conditional display: show this question only when another field has a specific value */
  showWhen?: {
    field: string;
    value: string | string[];
  };
}

export interface QuestionSection {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
}

/**
 * Intake step configuration
 */
export interface IntakeStep {
  id: string;
  title: string;
  shortTitle?: string;
  description?: string;
  sectionIds: string[];
  /** Whether this step includes the 3D pain map */
  hasPainMap?: boolean;
  /** Whether this step is the review/consent step */
  isReview?: boolean;
}
