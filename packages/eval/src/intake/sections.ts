/**
 * Intake Step Configuration
 * Defines the flow/steps for intake forms
 */

import type { IntakeStep } from './types';

/**
 * Standard intake steps for the widget (includes personal info)
 */
export const WIDGET_INTAKE_STEPS: IntakeStep[] = [
  {
    id: 'personal-info',
    title: 'Your Details',
    shortTitle: 'Details',
    description: 'Tell us a bit about yourself',
    sectionIds: ['personal-info'],
  },
  {
    id: 'pain-mapping',
    title: 'Pain Location',
    shortTitle: 'Pain',
    description: 'Mark where you feel pain on the body model',
    sectionIds: ['pain-duration'],
    hasPainMap: true,
  },
  {
    id: 'medical-history',
    title: 'Medical History',
    shortTitle: 'History',
    description: 'Your medical background and current treatments',
    sectionIds: ['medical-history'],
  },
  {
    id: 'goals',
    title: 'Treatment Goals',
    shortTitle: 'Goals',
    description: 'What you hope to achieve',
    sectionIds: ['goals'],
  },
  {
    id: 'review',
    title: 'Review & Submit',
    shortTitle: 'Review',
    description: 'Review your information and submit',
    sectionIds: [],
    isReview: true,
  },
];

/**
 * Portal intake steps (user is authenticated, skip personal info)
 */
export const PORTAL_INTAKE_STEPS: IntakeStep[] = [
  {
    id: 'pain-mapping',
    title: 'Pain Location & Characteristics',
    shortTitle: 'Pain',
    description: 'Mark where you feel pain and describe it',
    sectionIds: ['pain-duration'],
    hasPainMap: true,
  },
  {
    id: 'medical-history',
    title: 'Medical History',
    shortTitle: 'History',
    description: 'Your medical background and current treatments',
    sectionIds: ['medical-history'],
  },
  {
    id: 'goals',
    title: 'Treatment Goals',
    shortTitle: 'Goals',
    description: 'What you hope to achieve',
    sectionIds: ['goals'],
  },
  {
    id: 'review',
    title: 'Review & Submit',
    shortTitle: 'Review',
    description: 'Review your information and submit',
    sectionIds: [],
    isReview: true,
  },
];

/**
 * Get step titles for stepper display
 */
export function getStepTitles(steps: IntakeStep[], useShortTitles = false): string[] {
  return steps.map(step => useShortTitles && step.shortTitle ? step.shortTitle : step.title);
}

/**
 * Find the step that contains a specific section
 */
export function findStepBySection(steps: IntakeStep[], sectionId: string): IntakeStep | undefined {
  return steps.find(step => step.sectionIds.includes(sectionId));
}

/**
 * Get the pain mapping step
 */
export function getPainMappingStep(steps: IntakeStep[]): IntakeStep | undefined {
  return steps.find(step => step.hasPainMap);
}

/**
 * Get the review step
 */
export function getReviewStep(steps: IntakeStep[]): IntakeStep | undefined {
  return steps.find(step => step.isReview);
}
