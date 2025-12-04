/**
 * Intake Form Utilities
 * Shared helper functions for intake form handling
 */

import type { IntakeFormData, IntakeStep } from './types';

/**
 * Creates a form field update handler
 * @param setForm - React setState function for form state
 * @param setErrors - React setState function for errors state
 * @returns Update function that clears errors on field change
 */
export function createUpdateHandler(
  setForm: React.Dispatch<React.SetStateAction<IntakeFormData>>,
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
) {
  return (field: keyof IntakeFormData, value: unknown) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: '' }));
  };
}

/**
 * Creates a checkbox toggle handler for array fields
 * @param form - Current form state
 * @param update - Update function from createUpdateHandler
 * @returns Toggle function for checkbox groups
 */
export function createToggleHandler(
  form: IntakeFormData,
  update: (field: keyof IntakeFormData, value: unknown) => void
) {
  return (field: keyof IntakeFormData, value: string) => {
    const current = (form[field] as string[]) || [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    update(field, updated);
  };
}

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  painMap: 'Please mark at least one pain area',
  painDuration: 'Please select pain duration',
  chiefComplaint: 'Please describe your main concern',
  painQualities: 'Please select at least one pain quality',
  goals: 'Please select at least one treatment goal',
  consent: 'You must agree to continue',
} as const;

/**
 * Validates the pain mapping step
 * @param painRegionsLength - Number of pain regions selected
 * @param form - Current form state
 * @param requireChiefComplaint - Whether chief complaint is required (portal mode)
 * @param requirePainQualities - Whether pain qualities are required (portal mode)
 * @returns Validation errors object
 */
export function validatePainMappingStep(
  painRegionsLength: number,
  form: IntakeFormData,
  options: {
    requireChiefComplaint?: boolean;
    requirePainQualities?: boolean;
  } = {}
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!painRegionsLength) {
    errors.painMap = VALIDATION_MESSAGES.painMap;
  }

  if (!form.painDuration) {
    errors.painDuration = VALIDATION_MESSAGES.painDuration;
  }

  if (options.requireChiefComplaint && !form.chiefComplaint?.trim()) {
    errors.chiefComplaint = VALIDATION_MESSAGES.chiefComplaint;
  }

  if (options.requirePainQualities && (!form.painQualities || form.painQualities.length === 0)) {
    errors.painQualities = VALIDATION_MESSAGES.painQualities;
  }

  return errors;
}

/**
 * Validates the goals step
 * @param form - Current form state
 * @returns Validation errors object
 */
export function validateGoalsStep(form: IntakeFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!form.goals || form.goals.length === 0) {
    errors.goals = VALIDATION_MESSAGES.goals;
  }

  return errors;
}

/**
 * Validates the review/consent step
 * @param form - Current form state
 * @param requireConsent - Whether consent checkboxes are required
 * @returns Validation errors object
 */
export function validateReviewStep(
  form: IntakeFormData,
  requireConsent = true
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (requireConsent && !form.consentTreatment) {
    errors.consentTreatment = VALIDATION_MESSAGES.consent;
  }

  if (requireConsent && !form.consentPrivacy) {
    errors.consentPrivacy = VALIDATION_MESSAGES.consent;
  }

  return errors;
}

/**
 * Validates a step based on its configuration
 * @param step - Current step configuration
 * @param form - Current form state
 * @param painRegionsLength - Number of pain regions selected
 * @param options - Validation options
 * @returns Validation errors object
 */
export function validateStep(
  step: IntakeStep | undefined,
  form: IntakeFormData,
  painRegionsLength: number,
  options: {
    requireChiefComplaint?: boolean;
    requirePainQualities?: boolean;
    requireConsent?: boolean;
  } = {}
): Record<string, string> {
  if (!step) return {};

  let errors: Record<string, string> = {};

  if (step.hasPainMap) {
    errors = {
      ...errors,
      ...validatePainMappingStep(painRegionsLength, form, options),
    };
  }

  if (step.sectionIds.includes('goals')) {
    errors = { ...errors, ...validateGoalsStep(form) };
  }

  if (step.isReview) {
    errors = { ...errors, ...validateReviewStep(form, options.requireConsent) };
  }

  return errors;
}

/**
 * Gets the initial form state with default values
 * @param includePersonalInfo - Whether to include personal info fields (for widget)
 * @returns Initial form state
 */
export function getInitialFormState(includePersonalInfo = false): IntakeFormData {
  const base: IntakeFormData = {
    // Pain Info
    painDuration: '',
    painIntensity: 5,
    chiefComplaint: '',
    painQualities: [],
    // Medical History
    painStart: '',
    prevOrtho: [],
    currentTreatments: [],
    medications: [],
    mobilityAids: [],
    dailyImpact: [],
    additionalHistory: [],
    redFlags: [],
    // Goals
    goals: [],
    timeline: '',
    milestones: [],
    concerns: [],
    // Notes
    additionalNotes: '',
  };

  if (includePersonalInfo) {
    return {
      ...base,
      fullName: '',
      email: '',
      phone: '',
      ageRange: '',
    };
  }

  return base;
}
