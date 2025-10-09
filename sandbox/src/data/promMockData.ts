import { addDays, format, subDays } from 'date-fns';

type PromStatus = 'completed' | 'pending' | 'in-progress' | 'expired' | 'cancelled';

type PromSendChannel = 'email' | 'sms' | 'portal';

export interface PromQuestion {
  id: string;
  label: string;
  type: 'scale' | 'radio' | 'checkbox' | 'text' | 'yes-no' | 'date';
  description?: string;
  required?: boolean;
  options?: string[];
  min?: number;
  max?: number;
  scaleLabels?: { min: string; max: string };
  section?: string;
}

export interface PromTemplateSummary {
  id: string;
  name: string;
  description: string;
  category: 'pain' | 'function' | 'mental-health' | 'wellness' | 'post-op';
  frequency: 'daily' | 'weekly' | 'monthly' | 'post-visit';
  estimatedTime: number;
  questionCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastDistributed?: string;
}

export interface PromTemplateDetail extends PromTemplateSummary {
  author: string;
  tags: string[];
  questions: PromQuestion[];
  outcomesTracked: string[];
}

export interface PromResponseSummary {
  id: string;
  templateId: string;
  templateName: string;
  patientId: string;
  patientName: string;
  avatarColor: string;
  status: PromStatus;
  score?: number;
  rawScore?: number;
  maxScore?: number;
  assignedAt: string;
  scheduledAt?: string;
  dueAt?: string;
  completedAt?: string;
  channel: PromSendChannel;
}

export interface PromPatient {
  id: string;
  name: string;
  email: string;
  phone: string;
  dob: string;
  mrn: string;
  status: 'active' | 'inactive';
  lastPromStatus: PromStatus;
  lastPromDate: string;
  avatarColor: string;
}

export interface PromResponseDetail extends PromResponseSummary {
  notes?: string;
  responses: Array<{
    question: string;
    answer: string | string[] | number | boolean | null;
  }>;
}

export interface PromSummaryStats {
  total: number;
  completed: number;
  pending: number;
  inProgress: number;
  expired: number;
  cancelled: number;
  averageScore: number;
  completionRate: number;
  nextDue?: string;
  lastCompleted?: string;
  streak: number;
}

export interface StatusChartDatum {
  name: string;
  value: number;
  color: string;
}

export interface TrendChartDatum {
  date: string;
  responses: number;
  avgScore: number;
}

const withIso = (date: Date) => date.toISOString();

const today = new Date();

export const promTemplates: PromTemplateDetail[] = [
  {
    id: 'tmpl-1',
    name: 'Pain and Function Survey',
    description: 'Daily pain intensity, medication usage, and functional status tracking.',
    category: 'pain',
    frequency: 'daily',
    estimatedTime: 7,
    questionCount: 12,
    version: 4,
    createdAt: withIso(subDays(today, 120)),
    updatedAt: withIso(subDays(today, 6)),
    isActive: true,
    lastDistributed: withIso(subDays(today, 1)),
    author: 'Dr. Emily Carter',
    tags: ['Orthopedics', 'Pain'],
    outcomesTracked: ['Pain Score', 'Medication Usage', 'Functional Ability'],
    questions: [
      {
        id: 'q-1',
        label: 'Rate your average pain level today',
        type: 'scale',
        min: 0,
        max: 10,
        scaleLabels: { min: 'No pain', max: 'Worst possible pain' },
        required: true,
      },
      {
        id: 'q-2',
        label: 'How many doses of your pain medication did you take?',
        type: 'radio',
        options: ['None', '1 dose', '2 doses', '3+ doses'],
        required: true,
      },
      {
        id: 'q-3',
        label: 'Describe your functional limitations today',
        type: 'checkbox',
        options: ['Walking', 'Sitting', 'Lifting objects', 'Sleeping', 'Work duties'],
      },
      {
        id: 'q-4',
        label: 'Overall, how would you rate your wellbeing today?',
        type: 'radio',
        options: ['Excellent', 'Good', 'Fair', 'Poor'],
      },
    ],
  },
  {
    id: 'tmpl-2',
    name: 'Post-Operative Knee Replacement PROM',
    description: 'Weekly assessment of recovery after total knee arthroplasty.',
    category: 'post-op',
    frequency: 'weekly',
    estimatedTime: 10,
    questionCount: 18,
    version: 2,
    createdAt: withIso(subDays(today, 90)),
    updatedAt: withIso(subDays(today, 8)),
    isActive: true,
    lastDistributed: withIso(subDays(today, 7)),
    author: 'Dr. Michael Chen',
    tags: ['Post-Op', 'Orthopedics'],
    outcomesTracked: ['Knee Range of Motion', 'Pain', 'Function'],
    questions: [
      {
        id: 'knee-1',
        label: 'Rate your knee pain in the last 24 hours',
        type: 'scale',
        min: 0,
        max: 10,
        scaleLabels: { min: 'No pain', max: 'Worst possible pain' },
        required: true,
      },
      {
        id: 'knee-2',
        label: 'Can you fully extend your knee?',
        type: 'yes-no',
        required: true,
      },
      {
        id: 'knee-3',
        label: 'What mobility aids do you currently use?',
        type: 'checkbox',
        options: ['None', 'Walker', 'Crutches', 'Cane'],
      },
      {
        id: 'knee-4',
        label: 'Add any concerns you have for your care team',
        type: 'text',
      },
    ],
  },
  {
    id: 'tmpl-3',
    name: 'Mental Health Check-in',
    description: 'Monthly self-assessment for anxiety, mood, and daily functioning.',
    category: 'mental-health',
    frequency: 'monthly',
    estimatedTime: 6,
    questionCount: 15,
    version: 5,
    createdAt: withIso(subDays(today, 200)),
    updatedAt: withIso(subDays(today, 20)),
    isActive: false,
    lastDistributed: withIso(subDays(today, 32)),
    author: 'Dr. Alicia Gomez',
    tags: ['Behavioral Health'],
    outcomesTracked: ['Anxiety Score', 'Mood'],
    questions: [
      {
        id: 'mh-1',
        label: 'Over the last two weeks, how often have you felt nervous or anxious?',
        type: 'radio',
        options: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
      },
      {
        id: 'mh-2',
        label: 'How would you rate your overall mood?',
        type: 'scale',
        min: 0,
        max: 10,
        scaleLabels: { min: 'Very low', max: 'Very positive' },
      },
      {
        id: 'mh-3',
        label: 'Any additional comments for your care team?',
        type: 'text',
      },
    ],
  },
];

export const promResponses: PromResponseDetail[] = [
  {
    id: 'resp-101',
    templateId: 'tmpl-1',
    templateName: 'Pain and Function Survey',
    patientId: 'patient-1',
    patientName: 'Olivia Martin',
    avatarColor: '#F87171',
    status: 'completed',
    score: 78,
    rawScore: 39,
    maxScore: 50,
    assignedAt: withIso(subDays(today, 5)),
    dueAt: withIso(subDays(today, 4)),
    completedAt: withIso(subDays(today, 4)),
    channel: 'portal',
    notes: 'Patient reports gradual improvement in morning stiffness.',
    responses: [
      { question: 'Rate your average pain level today', answer: 4 },
      { question: 'How many doses of your pain medication did you take?', answer: '1 dose' },
      { question: 'Describe your functional limitations today', answer: ['Walking', 'Sleeping'] },
      { question: 'Overall, how would you rate your wellbeing today?', answer: 'Good' },
    ],
  },
  {
    id: 'resp-102',
    templateId: 'tmpl-2',
    templateName: 'Post-Operative Knee Replacement PROM',
    patientId: 'patient-2',
    patientName: 'Noah Williams',
    avatarColor: '#60A5FA',
    status: 'in-progress',
    assignedAt: withIso(subDays(today, 2)),
    scheduledAt: withIso(subDays(today, 2)),
    dueAt: withIso(addDays(today, 1)),
    channel: 'email',
    responses: [
      { question: 'Rate your knee pain in the last 24 hours', answer: 6 },
      { question: 'Can you fully extend your knee?', answer: 'Yes' },
      { question: 'What mobility aids do you currently use?', answer: ['Crutches'] },
    ],
  },
  {
    id: 'resp-103',
    templateId: 'tmpl-1',
    templateName: 'Pain and Function Survey',
    patientId: 'patient-3',
    patientName: 'Ethan Chen',
    avatarColor: '#34D399',
    status: 'pending',
    assignedAt: withIso(subDays(today, 1)),
    dueAt: withIso(addDays(today, 2)),
    channel: 'sms',
    responses: [],
  },
  {
    id: 'resp-104',
    templateId: 'tmpl-1',
    templateName: 'Pain and Function Survey',
    patientId: 'patient-4',
    patientName: 'Sophia Patel',
    avatarColor: '#A855F7',
    status: 'expired',
    score: 42,
    rawScore: 21,
    maxScore: 50,
    assignedAt: withIso(subDays(today, 14)),
    dueAt: withIso(subDays(today, 7)),
    channel: 'email',
    responses: [
      { question: 'Rate your average pain level today', answer: 7 },
      { question: 'How many doses of your pain medication did you take?', answer: '3+ doses' },
    ],
  },
  {
    id: 'resp-105',
    templateId: 'tmpl-2',
    templateName: 'Post-Operative Knee Replacement PROM',
    patientId: 'patient-5',
    patientName: 'Mason Wright',
    avatarColor: '#FB923C',
    status: 'completed',
    score: 88,
    rawScore: 44,
    maxScore: 50,
    assignedAt: withIso(subDays(today, 10)),
    dueAt: withIso(subDays(today, 7)),
    completedAt: withIso(subDays(today, 7)),
    channel: 'portal',
    responses: [
      { question: 'Rate your knee pain in the last 24 hours', answer: 2 },
      { question: 'Can you fully extend your knee?', answer: 'Yes' },
      { question: 'What mobility aids do you currently use?', answer: ['None'] },
    ],
  },
];

export const promPatients: PromPatient[] = [
  {
    id: 'patient-1',
    name: 'Olivia Martin',
    email: 'olivia.martin@example.com',
    phone: '(555) 123-4567',
    dob: '1985-03-12',
    mrn: 'QIVR-1042',
    status: 'active',
    lastPromStatus: 'completed',
    lastPromDate: format(subDays(today, 4), 'PPP'),
    avatarColor: '#F87171',
  },
  {
    id: 'patient-2',
    name: 'Noah Williams',
    email: 'noah.williams@example.com',
    phone: '(555) 987-6543',
    dob: '1979-11-29',
    mrn: 'QIVR-2087',
    status: 'active',
    lastPromStatus: 'in-progress',
    lastPromDate: format(subDays(today, 2), 'PPP'),
    avatarColor: '#60A5FA',
  },
  {
    id: 'patient-3',
    name: 'Ethan Chen',
    email: 'ethan.chen@example.com',
    phone: '(555) 555-0198',
    dob: '1991-06-07',
    mrn: 'QIVR-3110',
    status: 'active',
    lastPromStatus: 'pending',
    lastPromDate: format(today, 'PPP'),
    avatarColor: '#34D399',
  },
  {
    id: 'patient-4',
    name: 'Sophia Patel',
    email: 'sophia.patel@example.com',
    phone: '(555) 890-1234',
    dob: '1988-01-19',
    mrn: 'QIVR-4123',
    status: 'active',
    lastPromStatus: 'expired',
    lastPromDate: format(subDays(today, 9), 'PPP'),
    avatarColor: '#A855F7',
  },
  {
    id: 'patient-5',
    name: 'Mason Wright',
    email: 'mason.wright@example.com',
    phone: '(555) 222-7777',
    dob: '1969-08-23',
    mrn: 'QIVR-5098',
    status: 'inactive',
    lastPromStatus: 'completed',
    lastPromDate: format(subDays(today, 7), 'PPP'),
    avatarColor: '#FB923C',
  },
];

const statusColorMap: Record<PromStatus, string> = {
  completed: '#4CAF50',
  pending: '#FF9800',
  'in-progress': '#2196F3',
  expired: '#F44336',
  cancelled: '#9E9E9E',
};

export const buildStatusChartData = (responses: PromResponseSummary[]): StatusChartDatum[] => {
  const counts: Record<PromStatus, number> = {
    completed: 0,
    pending: 0,
    'in-progress': 0,
    expired: 0,
    cancelled: 0,
  };

  responses.forEach((response) => {
    counts[response.status] += 1;
  });

  return (Object.keys(counts) as PromStatus[]).map((status) => ({
    name: status.replace('-', ' ').replace(/^(\w)/, (char) => char.toUpperCase()),
    value: counts[status],
    color: statusColorMap[status],
  }));
};

export const summarizePromResponses = (responses: PromResponseSummary[]): PromSummaryStats => {
  if (responses.length === 0) {
    return {
      total: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
      expired: 0,
      cancelled: 0,
      averageScore: 0,
      completionRate: 0,
      streak: 0,
    };
  }

  const stats = responses.reduce(
    (acc, response) => {
      acc.total += 1;
      acc[response.status] += 1;
      if (response.status === 'completed' && typeof response.score === 'number') {
        acc.scoreSum += response.score;
        acc.scoreCount += 1;
        if (response.completedAt) {
          const completedDate = new Date(response.completedAt);
          if (!acc.lastCompleted || completedDate > acc.lastCompleted) {
            acc.lastCompleted = completedDate;
          }
        }
      }

      if (response.dueAt) {
        const dueDate = new Date(response.dueAt);
        if (!acc.nextDue || dueDate < acc.nextDue) {
          acc.nextDue = dueDate;
        }
      }

      return acc;
    },
    {
      total: 0,
      completed: 0,
      pending: 0,
      'in-progress': 0,
      expired: 0,
      cancelled: 0,
      scoreSum: 0,
      scoreCount: 0,
      nextDue: undefined as Date | undefined,
      lastCompleted: undefined as Date | undefined,
    },
  );

  const averageScore = stats.scoreCount > 0 ? stats.scoreSum / stats.scoreCount : 0;
  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return {
    total: stats.total,
    completed: stats.completed,
    pending: stats.pending,
    inProgress: stats['in-progress'],
    expired: stats.expired,
    cancelled: stats.cancelled,
    averageScore,
    completionRate,
    nextDue: stats.nextDue ? format(stats.nextDue, 'PPP') : undefined,
    lastCompleted: stats.lastCompleted ? format(stats.lastCompleted, 'PPP') : undefined,
    streak: Math.max(0, stats.completed - stats.expired),
  };
};

export const buildTrendData = (responses: PromResponseSummary[]): TrendChartDatum[] => {
  const buckets = new Map<string, { responses: number; scoreSum: number; scoreCount: number }>();

  responses.forEach((response) => {
    if (!response.completedAt) {
      return;
    }

    const dateKey = format(new Date(response.completedAt), 'MMM d');
    const bucket = buckets.get(dateKey) || { responses: 0, scoreSum: 0, scoreCount: 0 };

    bucket.responses += 1;
    if (typeof response.score === 'number') {
      bucket.scoreSum += response.score;
      bucket.scoreCount += 1;
    }

    buckets.set(dateKey, bucket);
  });

  return Array.from(buckets.entries()).map(([date, bucket]) => ({
    date,
    responses: bucket.responses,
    avgScore: bucket.scoreCount > 0 ? parseFloat((bucket.scoreSum / bucket.scoreCount).toFixed(1)) : 0,
  }));
};

export const promResponseSummaries: PromResponseSummary[] = promResponses.map(({ responses, notes, ...summary }) => summary);

export const findTemplateById = (templateId: string): PromTemplateDetail | undefined =>
  promTemplates.find((template) => template.id === templateId);

export const findResponseById = (responseId: string): PromResponseDetail | undefined =>
  promResponses.find((response) => response.id === responseId);

export const findPatientById = (patientId: string): PromPatient | undefined =>
  promPatients.find((patient) => patient.id === patientId);

