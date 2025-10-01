// Mock data for Patient Portal
import { addDays, subDays, format, addHours } from 'date-fns';

export interface PatientAppointment {
  id: string;
  date: string;
  time: string;
  provider: string;
  providerSpecialty: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  location: string;
  notes?: string;
  telehealth?: boolean;
}

export interface PatientPROM {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  questions: number;
  estimatedTime: number; // in minutes
  category: string;
  priority: 'high' | 'medium' | 'low';
}

export interface PatientDocument {
  id: string;
  name: string;
  type: 'report' | 'prescription' | 'lab-result' | 'imaging' | 'referral' | 'other';
  date: string;
  provider: string;
  size: string;
  important?: boolean;
}

export interface VitalSign {
  id: string;
  date: string;
  type: string;
  value: string | number;
  unit: string;
  trend?: 'improving' | 'stable' | 'concerning';
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'completed' | 'discontinued';
  refillsRemaining?: number;
}

export interface PatientStats {
  upcomingAppointments: number;
  pendingProms: number;
  completedEvaluations: number;
  activeProviders: number;
  documentsAvailable: number;
  medicationsActive: number;
}

export interface TreatmentProgress {
  id: string;
  goal: string;
  progress: number; // percentage
  targetDate: string;
  status: 'on-track' | 'ahead' | 'behind';
  lastUpdated: string;
}

export interface HealthMetric {
  name: string;
  current: number;
  previous: number;
  target: number;
  unit: string;
}

// Generate mock appointments for patient
export const generatePatientAppointments = (): PatientAppointment[] => {
  const providers = [
    { name: 'Dr. Sarah Johnson', specialty: 'Physical Therapy' },
    { name: 'Dr. Michael Chen', specialty: 'Orthopedics' },
    { name: 'Dr. Emily Williams', specialty: 'Pain Management' },
    { name: 'Dr. James Brown', specialty: 'Sports Medicine' },
  ];
  
  const types = ['Initial Evaluation', 'Follow-up', 'Treatment Session', 'Assessment', 'Consultation'];
  const statuses: PatientAppointment['status'][] = ['scheduled', 'completed', 'scheduled', 'completed'];
  
  return Array.from({ length: 8 }, (_, i) => {
    const provider = providers[i % providers.length];
    const isUpcoming = i < 4;
    const baseDate = isUpcoming ? addDays(new Date(), i * 7) : subDays(new Date(), (i - 3) * 7);
    
    return {
      id: `patient-apt-${i + 1}`,
      date: format(baseDate, 'yyyy-MM-dd'),
      time: format(addHours(baseDate.setHours(9, 0, 0, 0), i % 8), 'h:mm a'),
      provider: provider.name,
      providerSpecialty: provider.specialty,
      type: types[i % types.length],
      status: statuses[i % statuses.length],
      location: i % 3 === 0 ? 'Telehealth' : `Suite ${100 + i}`,
      telehealth: i % 3 === 0,
      notes: i % 2 === 0 ? 'Please bring previous X-rays' : undefined,
    };
  });
};

// Generate mock PROMs for patient
export const generatePatientPROMs = (): PatientPROM[] => {
  const promTemplates = [
    { title: 'Pain Assessment Questionnaire', category: 'Pain Management', questions: 15, time: 10 },
    { title: 'Functional Mobility Scale', category: 'Physical Function', questions: 20, time: 15 },
    { title: 'Quality of Life Survey', category: 'Well-being', questions: 25, time: 20 },
    { title: 'Mental Health Screening', category: 'Mental Health', questions: 10, time: 8 },
    { title: 'Sleep Quality Assessment', category: 'Sleep', questions: 12, time: 10 },
    { title: 'Activity Tolerance Index', category: 'Physical Function', questions: 18, time: 12 },
  ];
  
  return promTemplates.map((template, i) => ({
    id: `prom-${i + 1}`,
    title: template.title,
    description: `Please complete this ${template.category.toLowerCase()} assessment to help us track your progress.`,
    dueDate: format(addDays(new Date(), i - 2), 'yyyy-MM-dd'),
    status: i < 2 ? 'overdue' : i < 4 ? 'pending' : 'completed',
    questions: template.questions,
    estimatedTime: template.time,
    category: template.category,
    priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
  }));
};

// Generate mock documents
export const generatePatientDocuments = (): PatientDocument[] => {
  const documents = [
    { name: 'MRI Report - Lumbar Spine', type: 'imaging' as const, provider: 'Dr. Chen' },
    { name: 'Physical Therapy Progress Note', type: 'report' as const, provider: 'Dr. Johnson' },
    { name: 'Prescription - Pain Medication', type: 'prescription' as const, provider: 'Dr. Williams' },
    { name: 'Blood Test Results', type: 'lab-result' as const, provider: 'Lab Corp' },
    { name: 'Referral to Specialist', type: 'referral' as const, provider: 'Dr. Brown' },
    { name: 'X-Ray Report - Right Knee', type: 'imaging' as const, provider: 'Radiology Dept' },
    { name: 'Treatment Summary', type: 'report' as const, provider: 'Dr. Johnson' },
    { name: 'Insurance Authorization', type: 'other' as const, provider: 'Admin Office' },
  ];
  
  return documents.map((doc, i) => ({
    id: `doc-${i + 1}`,
    name: doc.name,
    type: doc.type,
    date: format(subDays(new Date(), i * 5), 'yyyy-MM-dd'),
    provider: doc.provider,
    size: `${Math.floor(Math.random() * 900 + 100)} KB`,
    important: i < 3,
  }));
};

// Generate mock vital signs
export const generateVitalSigns = (): VitalSign[] => {
  const vitals = [
    { type: 'Blood Pressure', unit: 'mmHg', baseValue: 120 },
    { type: 'Heart Rate', unit: 'bpm', baseValue: 72 },
    { type: 'Weight', unit: 'kg', baseValue: 75 },
    { type: 'Pain Level', unit: '/10', baseValue: 4 },
    { type: 'Range of Motion', unit: 'degrees', baseValue: 120 },
  ];
  
  const results: VitalSign[] = [];
  vitals.forEach((vital, vIndex) => {
    for (let i = 0; i < 5; i++) {
      const variation = Math.random() * 10 - 5;
      const value = vital.type === 'Blood Pressure' 
        ? `${Math.floor(vital.baseValue + variation)}/80`
        : Math.floor(vital.baseValue + variation);
      
      results.push({
        id: `vital-${vIndex}-${i}`,
        date: format(subDays(new Date(), i * 7), 'yyyy-MM-dd'),
        type: vital.type,
        value,
        unit: vital.unit,
        trend: i === 0 ? 'improving' : i === 4 ? 'concerning' : 'stable',
      });
    }
  });
  
  return results;
};

// Generate mock medications
export const generateMedications = (): Medication[] => {
  const medications = [
    { name: 'Ibuprofen', dosage: '400mg', frequency: 'Twice daily' },
    { name: 'Gabapentin', dosage: '300mg', frequency: 'Three times daily' },
    { name: 'Vitamin D3', dosage: '1000 IU', frequency: 'Once daily' },
    { name: 'Muscle Relaxant', dosage: '10mg', frequency: 'As needed' },
    { name: 'Calcium Supplement', dosage: '500mg', frequency: 'Once daily' },
  ];
  
  return medications.map((med, i) => ({
    id: `med-${i + 1}`,
    name: med.name,
    dosage: med.dosage,
    frequency: med.frequency,
    startDate: format(subDays(new Date(), i * 30), 'yyyy-MM-dd'),
    endDate: i > 2 ? format(addDays(new Date(), 30), 'yyyy-MM-dd') : undefined,
    prescribedBy: ['Dr. Williams', 'Dr. Chen', 'Dr. Johnson'][i % 3],
    status: i < 3 ? 'active' : i === 3 ? 'discontinued' : 'completed',
    refillsRemaining: i < 3 ? Math.floor(Math.random() * 5) : undefined,
  }));
};

// Generate patient stats
export const mockPatientStats: PatientStats = {
  upcomingAppointments: 3,
  pendingProms: 4,
  completedEvaluations: 12,
  activeProviders: 4,
  documentsAvailable: 8,
  medicationsActive: 3,
};

// Generate treatment progress data
export const generateTreatmentProgress = (): TreatmentProgress[] => {
  const goals = [
    'Reduce lower back pain to 3/10',
    'Increase knee flexion to 130 degrees',
    'Walk 5000 steps daily without pain',
    'Return to recreational sports',
    'Improve core strength by 50%',
    'Complete daily activities independently',
  ];
  
  return goals.map((goal, i) => ({
    id: `progress-${i + 1}`,
    goal,
    progress: 30 + Math.floor(Math.random() * 60),
    targetDate: format(addDays(new Date(), (i + 1) * 30), 'yyyy-MM-dd'),
    status: i < 2 ? 'on-track' : i < 4 ? 'ahead' : 'behind',
    lastUpdated: format(subDays(new Date(), i * 2), 'yyyy-MM-dd'),
  }));
};

// Generate health metrics
export const mockHealthMetrics: HealthMetric[] = [
  { name: 'Pain Level', current: 4, previous: 6, target: 2, unit: '/10' },
  { name: 'Flexibility', current: 75, previous: 60, target: 90, unit: '%' },
  { name: 'Strength', current: 70, previous: 55, target: 85, unit: '%' },
  { name: 'Endurance', current: 65, previous: 50, target: 80, unit: '%' },
  { name: 'Balance', current: 80, previous: 70, target: 95, unit: '%' },
];

// Generate activity data for charts
export const generateActivityData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day) => ({
    day,
    exercises: Math.floor(Math.random() * 60 + 20),
    steps: Math.floor(Math.random() * 5000 + 2000),
    activeMinutes: Math.floor(Math.random() * 90 + 30),
  }));
};

// Generate pain tracking data
export const generatePainData = () => {
  return Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(new Date(), 29 - i), 'MMM d'),
    morning: Math.floor(Math.random() * 4 + 2),
    afternoon: Math.floor(Math.random() * 3 + 3),
    evening: Math.floor(Math.random() * 4 + 1),
  }));
};