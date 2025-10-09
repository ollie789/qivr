import { addDays, subDays, format } from 'date-fns';

type IntakeSeverity = 'critical' | 'high' | 'medium' | 'low';
type IntakeStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'scheduled';

type InsuranceStatus = 'verified' | 'pending' | 'not-provided';

type PreferredVisitType = 'in-person' | 'telehealth' | 'either';

type IntakeNoteSeverity = 'info' | 'warning' | 'critical';

export interface IntakeNote {
  id: string;
  author: string;
  message: string;
  timestamp: string;
  severity: IntakeNoteSeverity;
}

export interface IntakeSubmission {
  id: string;
  patientName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: 'female' | 'male' | 'non-binary' | 'other';
  submittedAt: string;
  conditionType: string;
  symptoms: string;
  severity: IntakeSeverity;
  status: IntakeStatus;
  preferredProvider?: string;
  preferredLocation?: string;
  preferredVisitType: PreferredVisitType;
  insuranceCarrier?: string;
  insuranceStatus: InsuranceStatus;
  referredBy?: string;
  appointmentHistoryCount: number;
  followUpRequired: boolean;
  tags: string[];
  notes: IntakeNote[];
  attachments: Array<{ id: string; name: string; type: string; size: string }>;
}

const today = new Date();

const buildNotes = (entries: Array<{
  author: string;
  message: string;
  daysAgo: number;
  severity: IntakeNoteSeverity;
}>): IntakeNote[] =>
  entries.map((entry, index) => ({
    id: `note-${index + 1}`,
    author: entry.author,
    message: entry.message,
    timestamp: subDays(today, entry.daysAgo).toISOString(),
    severity: entry.severity,
  }));

export const intakeSubmissions: IntakeSubmission[] = [
  {
    id: 'intake-001',
    patientName: 'Olivia Johnson',
    email: 'olivia.johnson@example.com',
    phone: '(555) 123-4567',
    dateOfBirth: '1985-03-12',
    gender: 'female',
    submittedAt: subDays(today, 1).toISOString(),
    conditionType: 'Post-operative knee pain',
    symptoms: 'Persistent swelling and limited range of motion after surgery.',
    severity: 'high',
    status: 'pending',
    preferredProvider: 'Dr. Emily Carter',
    preferredLocation: 'North Clinic',
    preferredVisitType: 'in-person',
    insuranceCarrier: 'Blue Shield',
    insuranceStatus: 'verified',
    referredBy: 'Orthopedic Surgeon',
    appointmentHistoryCount: 4,
    followUpRequired: true,
    tags: ['post-op', 'physical-therapy'],
    notes: buildNotes([
      {
        author: 'Nurse Avery',
        message: 'Patient concerned about swelling. Wants earlier follow-up.',
        daysAgo: 1,
        severity: 'warning',
      },
    ]),
    attachments: [
      { id: 'file-1', name: 'Knee X-Ray.pdf', type: 'Imaging', size: '1.2 MB' },
      { id: 'file-2', name: 'Surgery Summary.pdf', type: 'Report', size: '850 KB' },
    ],
  },
  {
    id: 'intake-002',
    patientName: 'Noah Williams',
    email: 'noah.williams@example.com',
    phone: '(555) 987-6543',
    dateOfBirth: '1979-11-29',
    gender: 'male',
    submittedAt: subDays(today, 3).toISOString(),
    conditionType: 'Chronic lower back pain',
    symptoms: 'Pain worsens after sitting, occasional numbness in right leg.',
    severity: 'medium',
    status: 'reviewing',
    preferredProvider: 'Dr. Michael Chen',
    preferredLocation: 'Downtown Clinic',
    preferredVisitType: 'either',
    insuranceCarrier: 'Aetna',
    insuranceStatus: 'pending',
    referredBy: 'Primary Care Physician',
    appointmentHistoryCount: 2,
    followUpRequired: false,
    tags: ['pain-management'],
    notes: buildNotes([
      {
        author: 'Care Navigator',
        message: 'Waiting on insurance verification prior to scheduling.',
        daysAgo: 2,
        severity: 'info',
      },
      {
        author: 'Billing',
        message: 'Insurance eligibility check initiated.',
        daysAgo: 1,
        severity: 'info',
      },
    ]),
    attachments: [
      { id: 'file-3', name: 'MRI Report.pdf', type: 'Imaging', size: '2.1 MB' },
    ],
  },
  {
    id: 'intake-003',
    patientName: 'Ethan Chen',
    email: 'ethan.chen@example.com',
    phone: '(555) 444-1212',
    dateOfBirth: '1991-06-07',
    gender: 'male',
    submittedAt: addDays(today, -5).toISOString(),
    conditionType: 'Rehabilitation follow-up',
    symptoms: 'Needs reassessment after shoulder rehab program.',
    severity: 'medium',
    status: 'scheduled',
    preferredProvider: 'Dr. Sarah Johnson',
    preferredLocation: 'North Clinic',
    preferredVisitType: 'telehealth',
    insuranceStatus: 'verified',
    appointmentHistoryCount: 6,
    followUpRequired: true,
    tags: ['rehab'],
    notes: buildNotes([
      {
        author: 'Scheduler',
        message: 'Telehealth follow-up scheduled for next Monday.',
        daysAgo: 0,
        severity: 'info',
      },
    ]),
    attachments: [],
  },
  {
    id: 'intake-004',
    patientName: 'Sophia Patel',
    email: 'sophia.patel@example.com',
    phone: '(555) 890-1234',
    dateOfBirth: '1988-01-19',
    gender: 'female',
    submittedAt: subDays(today, 2).toISOString(),
    conditionType: 'Migraine evaluation',
    symptoms: 'Weekly migraines with aura, interested in neurology consult.',
    severity: 'high',
    status: 'pending',
    preferredProvider: 'Dr. Alicia Gomez',
    preferredLocation: 'Downtown Clinic',
    preferredVisitType: 'in-person',
    insuranceCarrier: 'United Healthcare',
    insuranceStatus: 'verified',
    referredBy: 'Self-referral',
    appointmentHistoryCount: 0,
    followUpRequired: true,
    tags: ['neurology'],
    notes: buildNotes([
      {
        author: 'Front Desk',
        message: 'Patient prefers morning appointments. No prior neurology records.',
        daysAgo: 2,
        severity: 'info',
      },
    ]),
    attachments: [],
  },
  {
    id: 'intake-005',
    patientName: 'Mason Wright',
    email: 'mason.wright@example.com',
    phone: '(555) 222-7777',
    dateOfBirth: '1969-08-23',
    gender: 'male',
    submittedAt: subDays(today, 7).toISOString(),
    conditionType: 'Diabetes management',
    symptoms: 'Needs education on insulin pump adjustments, recurring foot pain.',
    severity: 'critical',
    status: 'reviewing',
    preferredProvider: 'Dr. James Brown',
    preferredLocation: 'South Clinic',
    preferredVisitType: 'either',
    insuranceCarrier: 'Medicare',
    insuranceStatus: 'verified',
    referredBy: 'Endocrinologist',
    appointmentHistoryCount: 8,
    followUpRequired: true,
    tags: ['endocrine', 'education'],
    notes: buildNotes([
      {
        author: 'Triage',
        message: 'Flagged as critical due to uncontrolled sugars. Needs urgent follow-up.',
        daysAgo: 1,
        severity: 'critical',
      },
    ]),
    attachments: [
      { id: 'file-4', name: 'A1C Results.pdf', type: 'Lab', size: '320 KB' },
      { id: 'file-5', name: 'Medication List.pdf', type: 'Document', size: '150 KB' },
    ],
  },
  {
    id: 'intake-006',
    patientName: 'Liam Davis',
    email: 'liam.davis@example.com',
    phone: '(555) 678-4321',
    dateOfBirth: '1995-04-28',
    gender: 'male',
    submittedAt: addDays(today, -9).toISOString(),
    conditionType: 'Sports injury follow-up',
    symptoms: 'Returning after ankle sprain rehab, wants clearance to play.',
    severity: 'low',
    status: 'approved',
    preferredProvider: 'Dr. Emily Carter',
    preferredLocation: 'Westside Clinic',
    preferredVisitType: 'in-person',
    insuranceStatus: 'verified',
    appointmentHistoryCount: 3,
    followUpRequired: false,
    tags: ['sports-medicine'],
    notes: buildNotes([
      {
        author: 'PT Team',
        message: 'Completed PT plan, needs physician clearance.',
        daysAgo: 4,
        severity: 'info',
      },
    ]),
    attachments: [
      { id: 'file-6', name: 'Physical Therapy Summary.pdf', type: 'Report', size: '640 KB' },
    ],
  },
];

export interface IntakeStats {
  total: number;
  pending: number;
  reviewing: number;
  processed: number;
  critical: number;
  today: number;
}

export const computeIntakeStats = (records: IntakeSubmission[]): IntakeStats => {
  const todayString = new Date().toDateString();
  const pending = records.filter((item) => item.status === 'pending').length;
  const reviewing = records.filter((item) => item.status === 'reviewing').length;
  const processed = records.filter((item) =>
    item.status === 'approved' || item.status === 'rejected' || item.status === 'scheduled',
  ).length;
  const critical = records.filter((item) => item.severity === 'critical').length;
  const today = records.filter((item) => new Date(item.submittedAt).toDateString() === todayString).length;

  return {
    total: records.length,
    pending,
    reviewing,
    processed,
    critical,
    today,
  };
};

export const formatSubmittedAt = (timestamp: string) => format(new Date(timestamp), 'MMM d, yyyy h:mm a');
