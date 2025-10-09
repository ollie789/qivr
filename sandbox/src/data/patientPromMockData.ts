import { addDays, subDays, formatISO, compareAsc } from 'date-fns';

export type PatientPromAnswerValue = string | number | boolean | string[] | null;

export type PatientPromQuestionType =
  | 'radio'
  | 'checkbox'
  | 'slider'
  | 'text'
  | 'boolean'
  | 'number'
  | 'date';

export interface PatientPromQuestion {
  id: string;
  text: string;
  type: PatientPromQuestionType;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
}

export interface PatientPromTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedTime: number;
  tags: string[];
  questions: PatientPromQuestion[];
}

export type PatientPromStatus = 'pending' | 'in-progress' | 'completed' | 'expired';

export interface PatientPromInstance {
  id: string;
  templateId: string;
  templateName: string;
  status: PatientPromStatus;
  assignedDate: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  progress: number;
  patientId?: string;
  patientName?: string;
  responses?: Record<string, PatientPromAnswerValue>;
  completedDate?: string;
  score?: number;
}

export interface PatientPromHistoryEntry {
  id: string;
  templateName: string;
  completedDate: string;
  score: number;
  percentageScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface PatientPromStats {
  totalAssigned: number;
  completed: number;
  pending: number;
  averageScore: number;
  completionRate: number;
  streak: number;
  lastCompleted?: string;
  nextDue?: string;
}

const today = new Date();

export const patientPromTemplates: PatientPromTemplate[] = [
  {
    id: 'tmpl-pain-daily',
    name: 'Daily Pain & Function Check-in',
    description: 'Track your daily pain levels, sleep quality, and activity tolerance to help your care team adjust treatment.',
    category: 'Pain Management',
    estimatedTime: 5,
    tags: ['Daily', 'Pain Score', 'Mobility'],
    questions: [
      {
        id: 'pain-intensity',
        text: 'How intense was your pain today?',
        type: 'slider',
        required: true,
        min: 0,
        max: 10,
        step: 1,
        helpText: '0 = No pain, 10 = Worst pain imaginable',
      },
      {
        id: 'pain-impact',
        text: 'How much did pain interfere with your daily activities?',
        type: 'radio',
        required: true,
        options: ['Not at all', 'A little bit', 'Moderately', 'Quite a bit', 'Extremely'],
      },
      {
        id: 'pain-locations',
        text: 'Where did you experience pain today? Select all that apply.',
        type: 'checkbox',
        options: ['Lower back', 'Shoulder', 'Hip', 'Knee', 'Neck', 'Other'],
      },
      {
        id: 'medication-use',
        text: 'Did you take your prescribed pain medication?',
        type: 'boolean',
        required: true,
      },
      {
        id: 'sleep-quality',
        text: 'How would you rate your sleep quality last night?',
        type: 'radio',
        options: ['Excellent', 'Good', 'Fair', 'Poor'],
      },
      {
        id: 'patient-notes',
        text: 'Anything else you want your care team to know?',
        type: 'text',
        helpText: 'Optional, but helpful for your providers.',
      },
    ],
  },
  {
    id: 'tmpl-post-op-knee',
    name: 'Post-Operative Knee Recovery Survey',
    description: 'Weekly check-in to monitor progress after knee surgery, focusing on mobility, pain, and confidence.',
    category: 'Post-Operative',
    estimatedTime: 7,
    tags: ['Weekly', 'Orthopedics'],
    questions: [
      {
        id: 'mobility-confidence',
        text: 'How confident do you feel walking without assistance?',
        type: 'radio',
        required: true,
        options: ['Very confident', 'Somewhat confident', 'Not confident'],
      },
      {
        id: 'assistive-devices',
        text: 'Which mobility aids are you using?',
        type: 'checkbox',
        options: ['None', 'Walker', 'Crutches', 'Cane', 'Other'],
      },
      {
        id: 'knee-flexion',
        text: 'How far can you bend your knee comfortably?',
        type: 'slider',
        required: true,
        min: 0,
        max: 120,
        step: 5,
        helpText: 'Measured in degrees. 120° equals full flexion.',
      },
      {
        id: 'swelling',
        text: 'Rate your knee swelling today.',
        type: 'radio',
        options: ['None', 'Mild', 'Moderate', 'Severe'],
      },
      {
        id: 'exercise-compliance',
        text: 'How many times did you complete your home exercises this week?',
        type: 'number',
        min: 0,
        max: 14,
        helpText: 'Enter a number between 0 and 14.',
      },
      {
        id: 'follow-up-questions',
        text: 'Do you have questions for your care team?',
        type: 'text',
      },
    ],
  },
  {
    id: 'tmpl-wellness',
    name: 'Wellness & Mood Snapshot',
    description: 'Monthly wellbeing check covering mood, energy, and stress to support whole-person care.',
    category: 'Wellness',
    estimatedTime: 6,
    tags: ['Monthly', 'Mental Health'],
    questions: [
      {
        id: 'overall-mood',
        text: 'Overall, how was your mood this week?',
        type: 'radio',
        required: true,
        options: ['Very positive', 'Somewhat positive', 'Neutral', 'Somewhat low', 'Very low'],
      },
      {
        id: 'stress-level',
        text: 'Rate your stress level.',
        type: 'slider',
        min: 0,
        max: 10,
        step: 1,
      },
      {
        id: 'energy-level',
        text: 'How would you describe your overall energy?',
        type: 'radio',
        options: ['Excellent', 'Good', 'Fair', 'Low'],
      },
      {
        id: 'sleep-hours',
        text: 'On average, how many hours of sleep do you get per night?',
        type: 'number',
        min: 0,
        max: 12,
      },
      {
        id: 'gratitude-note',
        text: 'Share one positive thing from your week.',
        type: 'text',
      },
    ],
  },
];

export const patientPromInstances: PatientPromInstance[] = [
  {
    id: 'instance-101',
    templateId: 'tmpl-pain-daily',
    templateName: 'Daily Pain & Function Check-in',
    status: 'pending',
    assignedDate: formatISO(subDays(today, 1)),
    dueDate: formatISO(addDays(today, 1)),
    priority: 'high',
    progress: 40,
    patientId: 'patient-1',
    patientName: 'Olivia Martin',
    responses: {
      'pain-intensity': 4,
      'pain-impact': 'Moderately',
      'pain-locations': ['Lower back'],
    },
  },
  {
    id: 'instance-102',
    templateId: 'tmpl-post-op-knee',
    templateName: 'Post-Operative Knee Recovery Survey',
    status: 'in-progress',
    assignedDate: formatISO(subDays(today, 5)),
    dueDate: formatISO(addDays(today, 2)),
    priority: 'medium',
    progress: 60,
    patientId: 'patient-2',
    patientName: 'Noah Williams',
    responses: {
      'mobility-confidence': 'Somewhat confident',
      'assistive-devices': ['Cane'],
      'knee-flexion': 85,
    },
  },
  {
    id: 'instance-103',
    templateId: 'tmpl-wellness',
    templateName: 'Wellness & Mood Snapshot',
    status: 'completed',
    assignedDate: formatISO(subDays(today, 35)),
    dueDate: formatISO(subDays(today, 5)),
    completedDate: formatISO(subDays(today, 4)),
    priority: 'low',
    progress: 100,
    patientId: 'patient-3',
    patientName: 'Ethan Chen',
    score: 88,
    responses: {
      'overall-mood': 'Somewhat positive',
      'stress-level': 3,
      'energy-level': 'Good',
      'sleep-hours': 7,
      'gratitude-note': 'Enjoyed a walk outside with family.',
    },
  },
  {
    id: 'instance-104',
    templateId: 'tmpl-pain-daily',
    templateName: 'Daily Pain & Function Check-in',
    status: 'expired',
    assignedDate: formatISO(subDays(today, 10)),
    dueDate: formatISO(subDays(today, 3)),
    priority: 'medium',
    progress: 20,
    patientId: 'patient-4',
    patientName: 'Sophia Patel',
    responses: {
      'pain-intensity': 6,
    },
  },
];

export const patientPromHistory: PatientPromHistoryEntry[] = [
  {
    id: 'history-1',
    templateName: 'Wellness & Mood Snapshot',
    completedDate: formatISO(subDays(today, 4)),
    score: 88,
    percentageScore: 88,
    trend: 'improving',
  },
  {
    id: 'history-2',
    templateName: 'Daily Pain & Function Check-in',
    completedDate: formatISO(subDays(today, 7)),
    score: 76,
    percentageScore: 76,
    trend: 'stable',
  },
  {
    id: 'history-3',
    templateName: 'Post-Operative Knee Recovery Survey',
    completedDate: formatISO(subDays(today, 14)),
    score: 81,
    percentageScore: 81,
    trend: 'improving',
  },
];

export const calculatePatientPromStats = (
  instances: PatientPromInstance[],
): PatientPromStats => {
  const totalAssigned = instances.length;
  const completed = instances.filter((instance) => instance.status === 'completed').length;
  const pending = instances.filter((instance) => instance.status === 'pending' || instance.status === 'in-progress').length;
  const completedWithScore = instances.filter(
    (instance) => instance.status === 'completed' && typeof instance.score === 'number',
  );

  const averageScore =
    completedWithScore.length > 0
      ? completedWithScore.reduce((sum, instance) => sum + (instance.score ?? 0), 0) /
        completedWithScore.length
      : 0;

  const completionRate = totalAssigned > 0 ? (completed / totalAssigned) * 100 : 0;

  const completedDates = instances
    .filter((instance) => instance.completedDate)
    .map((instance) => instance.completedDate as string)
    .sort((a, b) => compareAsc(new Date(a), new Date(b)));

  const nextDueDate = instances
    .filter((instance) => instance.status !== 'completed')
    .map((instance) => instance.dueDate)
    .sort((a, b) => compareAsc(new Date(a), new Date(b)))[0];

  const recentCompletionDates = completedDates.slice(-3);
  const streak = recentCompletionDates.length;

  return {
    totalAssigned,
    completed,
    pending,
    averageScore,
    completionRate,
    streak,
    lastCompleted: completedDates.length > 0 ? completedDates[completedDates.length - 1] : undefined,
    nextDue: nextDueDate,
  };
};

export const getPatientPromTemplateById = (templateId: string): PatientPromTemplate | undefined =>
  patientPromTemplates.find((template) => template.id === templateId);
