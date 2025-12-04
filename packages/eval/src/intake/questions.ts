/**
 * Intake Question Definitions
 * Single source of truth for all intake questionnaire questions
 */

import type { Question, QuestionSection, SelectOption, CheckboxOption } from './types';

// =============================================================================
// PAIN QUALITIES (used in pain mapping step)
// =============================================================================

export const painQualityOptions: CheckboxOption[] = [
  { value: 'Aching', label: 'Aching' },
  { value: 'Sharp', label: 'Sharp' },
  { value: 'Burning', label: 'Burning' },
  { value: 'Stabbing', label: 'Stabbing' },
  { value: 'Throbbing', label: 'Throbbing' },
  { value: 'Shooting', label: 'Shooting' },
  { value: 'Tingling', label: 'Tingling' },
  { value: 'Numbness', label: 'Numbness' },
  { value: 'Dull', label: 'Dull' },
  { value: 'Cramping', label: 'Cramping' },
  { value: 'Stiffness', label: 'Stiffness' },
];

// =============================================================================
// SECTION 1: PERSONAL INFORMATION
// =============================================================================

export const ageRangeOptions: SelectOption[] = [
  { value: '', label: 'Select age range...' },
  { value: 'Under 18', label: 'Under 18' },
  { value: '18-29', label: '18-29' },
  { value: '30-44', label: '30-44' },
  { value: '45-59', label: '45-59' },
  { value: '60-74', label: '60-74' },
  { value: '75 and over', label: '75 and over' },
];

export const personalInfoSection: QuestionSection = {
  id: 'personal-info',
  title: 'Personal Information',
  questions: [
    {
      name: 'fullName',
      label: 'Full Name',
      type: 'text',
      required: true,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: false,
    },
    {
      name: 'ageRange',
      label: 'Age Range',
      type: 'select',
      required: false,
      options: ageRangeOptions,
    },
  ],
};

// =============================================================================
// SECTION 2: PAIN DURATION
// =============================================================================

export const painDurationOptions: SelectOption[] = [
  { value: '', label: 'Select duration...' },
  { value: 'Less than 1 week', label: 'Less than 1 week' },
  { value: '1-2 weeks', label: '1-2 weeks' },
  { value: '2-4 weeks', label: '2-4 weeks' },
  { value: '1-3 months', label: '1-3 months' },
  { value: '3-6 months', label: '3-6 months' },
  { value: '6-12 months', label: '6-12 months' },
  { value: '1-2 years', label: '1-2 years' },
  { value: 'More than 2 years', label: 'More than 2 years' },
];

export const painDurationQuestion: Question = {
  name: 'painDuration',
  label: 'How long have you had this pain?',
  type: 'select',
  required: true,
  options: painDurationOptions,
};

export const painDurationSection: QuestionSection = {
  id: 'pain-duration',
  title: 'Pain Duration',
  questions: [painDurationQuestion],
};

// =============================================================================
// SECTION 3: MEDICAL HISTORY
// =============================================================================

export const painStartOptions: SelectOption[] = [
  { value: '', label: 'Select how it started...' },
  { value: 'Sudden injury or trauma', label: 'Sudden injury or trauma' },
  { value: 'Gradual onset over time', label: 'Gradual onset over time' },
  { value: 'After specific activity or sport', label: 'After specific activity or sport' },
  { value: 'Work-related incident', label: 'Work-related incident' },
  { value: 'Motor vehicle accident', label: 'Motor vehicle accident' },
  { value: 'Fall or slip', label: 'Fall or slip' },
  { value: 'Post-surgery complication', label: 'Post-surgery complication' },
  { value: "Unknown/Can't remember", label: "Unknown/Can't remember" },
];

export const painStartQuestion: Question = {
  name: 'painStart',
  label: 'How did your pain/injury start?',
  type: 'select',
  options: painStartOptions,
};

export const prevOrthoOptions: CheckboxOption[] = [
  { value: 'Fracture/Broken bone', label: 'Fracture/Broken bone' },
  { value: 'ACL/MCL injury', label: 'ACL/MCL injury' },
  { value: 'Rotator cuff injury', label: 'Rotator cuff injury' },
  { value: 'Hip replacement', label: 'Hip replacement' },
  { value: 'Knee replacement', label: 'Knee replacement' },
  { value: 'Spinal surgery', label: 'Spinal surgery' },
  { value: 'Arthroscopy', label: 'Arthroscopy' },
  { value: 'Tendon repair', label: 'Tendon repair' },
  { value: 'None', label: 'None' },
];

export const currentTreatmentsOptions: CheckboxOption[] = [
  { value: 'Physical therapy', label: 'Physical therapy' },
  { value: 'Chiropractic care', label: 'Chiropractic care' },
  { value: 'Massage therapy', label: 'Massage therapy' },
  { value: 'Acupuncture', label: 'Acupuncture' },
  { value: 'Injections (cortisone, etc.)', label: 'Injections (cortisone, etc.)' },
  { value: 'Prescription medication', label: 'Prescription medication' },
  { value: 'Over-the-counter medication', label: 'Over-the-counter medication' },
  { value: 'Heat/Ice therapy', label: 'Heat/Ice therapy' },
  { value: 'Bracing/Support devices', label: 'Bracing/Support devices' },
  { value: 'None', label: 'None' },
];

export const medicationsOptions: CheckboxOption[] = [
  { value: 'Ibuprofen (Advil, Motrin)', label: 'Ibuprofen (Advil, Motrin)' },
  { value: 'Acetaminophen (Tylenol)', label: 'Acetaminophen (Tylenol)' },
  { value: 'Naproxen (Aleve)', label: 'Naproxen (Aleve)' },
  { value: 'Prescription pain medication', label: 'Prescription pain medication' },
  { value: 'Muscle relaxants', label: 'Muscle relaxants' },
  { value: 'Anti-inflammatory prescription', label: 'Anti-inflammatory prescription' },
  { value: 'Topical pain relief', label: 'Topical pain relief' },
  { value: 'Supplements (glucosamine, etc.)', label: 'Supplements (glucosamine, etc.)' },
  { value: 'None', label: 'None' },
];

export const mobilityAidsOptions: CheckboxOption[] = [
  { value: 'Cane', label: 'Cane' },
  { value: 'Walker', label: 'Walker' },
  { value: 'Crutches', label: 'Crutches' },
  { value: 'Wheelchair', label: 'Wheelchair' },
  { value: 'Knee scooter', label: 'Knee scooter' },
  { value: 'Brace or support', label: 'Brace or support' },
  { value: 'Orthotic inserts', label: 'Orthotic inserts' },
  { value: 'None', label: 'None' },
];

export const dailyImpactOptions: CheckboxOption[] = [
  { value: 'Walking/Standing', label: 'Walking/Standing' },
  { value: 'Climbing stairs', label: 'Climbing stairs' },
  { value: 'Sitting for long periods', label: 'Sitting for long periods' },
  { value: 'Sleeping/Lying down', label: 'Sleeping/Lying down' },
  { value: 'Dressing/Grooming', label: 'Dressing/Grooming' },
  { value: 'Bathing/Showering', label: 'Bathing/Showering' },
  { value: 'Household chores', label: 'Household chores' },
  { value: 'Work duties', label: 'Work duties' },
  { value: 'Exercise/Recreation', label: 'Exercise/Recreation' },
  { value: 'Driving', label: 'Driving' },
  { value: 'Lifting/Carrying', label: 'Lifting/Carrying' },
  { value: 'Minimal impact', label: 'Minimal impact' },
];

export const additionalHistoryOptions: CheckboxOption[] = [
  { value: 'Diabetes', label: 'Diabetes' },
  { value: 'Heart disease', label: 'Heart disease' },
  { value: 'High blood pressure', label: 'High blood pressure' },
  { value: 'Arthritis', label: 'Arthritis' },
  { value: 'Osteoporosis', label: 'Osteoporosis' },
  { value: 'Autoimmune condition', label: 'Autoimmune condition' },
  { value: 'Cancer (current/past)', label: 'Cancer (current/past)' },
  { value: 'Blood clotting disorder', label: 'Blood clotting disorder' },
  { value: 'Smoking (current/former)', label: 'Smoking (current/former)' },
  { value: 'None', label: 'None' },
];

export const redFlagsOptions: CheckboxOption[] = [
  { value: 'Recent trauma or injury', label: 'Recent trauma or injury' },
  { value: 'Loss of bowel/bladder control', label: 'Loss of bowel/bladder control' },
  { value: 'Fever or unexplained weight loss', label: 'Fever or unexplained weight loss' },
  { value: 'Severe night pain', label: 'Severe night pain' },
  { value: 'Pain getting progressively worse', label: 'Pain getting progressively worse' },
  { value: 'Numbness or tingling', label: 'Numbness or tingling' },
  { value: 'Muscle weakness', label: 'Muscle weakness' },
];

export const medicalHistorySection: QuestionSection = {
  id: 'medical-history',
  title: 'Medical History',
  description: 'Help us understand your medical background and current condition.',
  questions: [
    painStartQuestion,
    {
      name: 'prevOrtho',
      label: 'Previous orthopaedic conditions or surgeries',
      type: 'checkbox-group',
      options: prevOrthoOptions,
    },
    {
      name: 'currentTreatments',
      label: 'Current treatments you\'re receiving',
      type: 'checkbox-group',
      options: currentTreatmentsOptions,
    },
    {
      name: 'medications',
      label: 'Current medications for pain',
      type: 'checkbox-group',
      options: medicationsOptions,
    },
    {
      name: 'mobilityAids',
      label: 'Mobility aids you use',
      type: 'checkbox-group',
      options: mobilityAidsOptions,
    },
    {
      name: 'dailyImpact',
      label: 'Daily activities affected by your condition',
      type: 'checkbox-group',
      options: dailyImpactOptions,
    },
    {
      name: 'additionalHistory',
      label: 'Other medical conditions',
      type: 'checkbox-group',
      options: additionalHistoryOptions,
    },
    {
      name: 'redFlags',
      label: 'Do you have any of these symptoms?',
      type: 'checkbox-group',
      options: redFlagsOptions,
    },
  ],
};

// =============================================================================
// SECTION 4: TREATMENT GOALS & EXPECTATIONS
// =============================================================================

export const goalsOptions: CheckboxOption[] = [
  { value: 'Reduce pain intensity', label: 'Reduce pain intensity' },
  { value: 'Improve mobility and flexibility', label: 'Improve mobility and flexibility' },
  { value: 'Increase strength and stability', label: 'Increase strength and stability' },
  { value: 'Sleep better without pain', label: 'Sleep better without pain' },
  { value: 'Return to normal daily activities', label: 'Return to normal daily activities' },
  { value: 'Return to sports/recreational activities', label: 'Return to sports/recreational activities' },
  { value: 'Return to work or improve work function', label: 'Return to work or improve work function' },
  { value: 'Avoid surgery if possible', label: 'Avoid surgery if possible' },
  { value: 'Prepare for upcoming surgery', label: 'Prepare for upcoming surgery' },
  { value: 'Recover from recent surgery', label: 'Recover from recent surgery' },
  { value: 'Reduce medication use', label: 'Reduce medication use' },
  { value: 'Improve posture and alignment', label: 'Improve posture and alignment' },
  { value: 'Prevent condition from worsening', label: 'Prevent condition from worsening' },
  { value: 'Maintain independent living', label: 'Maintain independent living' },
];

export const timelineOptions: SelectOption[] = [
  { value: '', label: 'Select timeline...' },
  { value: '1-2 weeks', label: '1-2 weeks' },
  { value: '3-4 weeks', label: '3-4 weeks' },
  { value: '1-2 months', label: '1-2 months' },
  { value: '3-6 months', label: '3-6 months' },
  { value: '6-12 months', label: '6-12 months' },
  { value: 'More than 1 year', label: 'More than 1 year' },
  { value: 'Uncertain', label: 'Uncertain' },
];

export const milestonesOptions: CheckboxOption[] = [
  { value: 'Walk without pain', label: 'Walk without pain' },
  { value: 'Run or jog again', label: 'Run or jog again' },
  { value: 'Play sports', label: 'Play sports' },
  { value: 'Climb stairs easily', label: 'Climb stairs easily' },
  { value: 'Lift weights/strength train', label: 'Lift weights/strength train' },
  { value: 'Sleep through the night', label: 'Sleep through the night' },
  { value: 'Return to work full-time', label: 'Return to work full-time' },
  { value: 'Play with kids/grandkids', label: 'Play with kids/grandkids' },
  { value: 'Travel comfortably', label: 'Travel comfortably' },
  { value: 'Garden or yard work', label: 'Garden or yard work' },
  { value: 'Stand for extended periods', label: 'Stand for extended periods' },
  { value: 'Sit comfortably at desk', label: 'Sit comfortably at desk' },
];

export const concernsOptions: CheckboxOption[] = [
  { value: 'Cost of treatment', label: 'Cost of treatment' },
  { value: 'Time commitment required', label: 'Time commitment required' },
  { value: 'Effectiveness of treatment', label: 'Effectiveness of treatment' },
  { value: 'Potential side effects', label: 'Potential side effects' },
  { value: 'Recovery time', label: 'Recovery time' },
  { value: 'Risk of surgery', label: 'Risk of surgery' },
  { value: 'Pain during treatment', label: 'Pain during treatment' },
  { value: 'Work/School disruption', label: 'Work/School disruption' },
  { value: 'Limited treatment options', label: 'Limited treatment options' },
  { value: 'Long-term outcomes', label: 'Long-term outcomes' },
  { value: 'No specific concerns', label: 'No specific concerns' },
];

export const goalsSection: QuestionSection = {
  id: 'goals',
  title: 'Treatment Goals & Expectations',
  description: 'What are you hoping to achieve through treatment?',
  questions: [
    {
      name: 'goals',
      label: 'Primary treatment goals (select all that apply)',
      type: 'checkbox-group',
      options: goalsOptions,
    },
    {
      name: 'timeline',
      label: 'When do you expect to feel better?',
      type: 'select',
      options: timelineOptions,
    },
    {
      name: 'milestones',
      label: 'Specific activities or milestones you want to achieve',
      type: 'checkbox-group',
      options: milestonesOptions,
    },
    {
      name: 'concerns',
      label: 'Any concerns about treatment?',
      type: 'checkbox-group',
      options: concernsOptions,
    },
  ],
};

// =============================================================================
// ALL SECTIONS COMBINED
// =============================================================================

export const allSections: QuestionSection[] = [
  personalInfoSection,
  painDurationSection,
  medicalHistorySection,
  goalsSection,
];

/**
 * Get a section by ID
 */
export function getSectionById(id: string): QuestionSection | undefined {
  return allSections.find(s => s.id === id);
}

/**
 * Get all checkbox option values for validation
 */
export const allCheckboxValues = {
  painQualities: painQualityOptions.map(o => o.value),
  prevOrtho: prevOrthoOptions.map(o => o.value),
  currentTreatments: currentTreatmentsOptions.map(o => o.value),
  medications: medicationsOptions.map(o => o.value),
  mobilityAids: mobilityAidsOptions.map(o => o.value),
  dailyImpact: dailyImpactOptions.map(o => o.value),
  additionalHistory: additionalHistoryOptions.map(o => o.value),
  redFlags: redFlagsOptions.map(o => o.value),
  goals: goalsOptions.map(o => o.value),
  milestones: milestonesOptions.map(o => o.value),
  concerns: concernsOptions.map(o => o.value),
};
