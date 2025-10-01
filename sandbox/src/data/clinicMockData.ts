// Mock data for Clinic Dashboard
import { subDays, format, addHours, addDays } from 'date-fns';

export interface Appointment {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: 'completed' | 'in-progress' | 'scheduled' | 'cancelled';
  duration: number;
  provider?: string;
  notes?: string;
  telehealth?: boolean;
}

export interface Activity {
  id: string;
  type: 'intake' | 'appointment' | 'message' | 'document';
  patientName: string;
  description: string;
  timestamp: Date;
  status: 'urgent' | 'pending' | 'completed' | 'new';
  priority?: 'high' | 'medium' | 'low';
}

export interface ClinicStats {
  todayAppointments: number;
  pendingIntakes: number;
  activePatients: number;
  completedToday: number;
  averageWaitTime: number;
  patientSatisfaction: number;
  weeklyGrowth: number;
  monthlyRevenue: number;
}

export interface ChartData {
  name: string;
  appointments: number;
  completed: number;
  cancellations: number;
  noShows: number;
  newPatients: number;
}

export interface PromData {
  name: string;
  completed: number;
  pending: number;
  completionRate: number;
}

export interface DiagnosisData {
  name: string;
  percentage: number;
  value: number;
  color: string;
}

export interface ProviderPerformance {
  metric: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
}

// Generate mock appointments
export const generateMockAppointments = (): Appointment[] => {
  const statuses: Appointment['status'][] = ['completed', 'in-progress', 'scheduled', 'cancelled'];
  const types = ['Initial Consultation', 'Follow-up', 'Therapy Session', 'Assessment', 'Review'];
  const providers = ['Dr. Smith', 'Dr. Johnson', 'Dr. Williams', 'Dr. Brown', 'Dr. Davis'];
  
  return Array.from({ length: 12 }, (_, i) => ({
    id: `apt-${i + 1}`,
    patientName: `Patient ${String.fromCharCode(65 + i)} ${String.fromCharCode(65 + i)}son`,
    time: format(addHours(new Date().setHours(8, 0, 0, 0), i), 'HH:mm'),
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    duration: [30, 45, 60][i % 3],
    provider: providers[i % providers.length],
    notes: i % 3 === 0 ? 'Requires special attention' : undefined,
    telehealth: i % 3 === 0,
  }));
};

// Generate mock activities
export const generateMockActivities = (): Activity[] => {
  const types: Activity['type'][] = ['intake', 'appointment', 'message', 'document'];
  const statuses: Activity['status'][] = ['urgent', 'pending', 'completed', 'new'];
  const priorities: Activity['priority'][] = ['high', 'medium', 'low'];
  
  return Array.from({ length: 20 }, (_, i) => ({
    id: `activity-${i + 1}`,
    type: types[i % types.length],
    patientName: `Patient ${String.fromCharCode(65 + i)}`,
    description: [
      'New intake form submitted',
      'Appointment rescheduled',
      'New message received',
      'Document uploaded',
    ][i % 4],
    timestamp: subDays(new Date(), Math.floor(i / 4)),
    status: statuses[i % statuses.length],
    priority: i % 3 === 0 ? priorities[0] : priorities[i % 3],
  }));
};

// Generate clinic stats
export const mockClinicStats: ClinicStats = {
  todayAppointments: 24,
  pendingIntakes: 8,
  activePatients: 342,
  completedToday: 18,
  averageWaitTime: 12,
  patientSatisfaction: 4.8,
  weeklyGrowth: 5.2,
  monthlyRevenue: 125000,
};

// Generate chart data for last 7 days
export const generateChartData = (days: number = 7): ChartData[] => {
  return Array.from({ length: days }, (_, i) => {
    const date = subDays(new Date(), days - i - 1);
    const baseAppointments = 20 + Math.floor(Math.random() * 15);
    
    return {
      name: format(date, 'MMM d'),
      appointments: baseAppointments,
      completed: Math.floor(baseAppointments * (0.7 + Math.random() * 0.2)),
      cancellations: Math.floor(Math.random() * 4),
      noShows: Math.floor(Math.random() * 3),
      newPatients: Math.floor(Math.random() * 8),
    };
  });
};

// Generate PROM completion data
export const mockPromData: PromData[] = [
  { name: 'Pain Assessment', completed: 75, pending: 25, completionRate: 75 },
  { name: 'Mobility Questionnaire', completed: 82, pending: 18, completionRate: 82 },
  { name: 'Quality of Life', completed: 68, pending: 32, completionRate: 68 },
  { name: 'Mental Health Screen', completed: 90, pending: 10, completionRate: 90 },
  { name: 'Functional Status', completed: 71, pending: 29, completionRate: 71 },
];

// Generate diagnosis distribution data
export const mockDiagnosisData: DiagnosisData[] = [
  { name: 'Lower Back Pain', percentage: 28, value: 95, color: '#2563eb' },
  { name: 'Neck Pain', percentage: 22, value: 75, color: '#7c3aed' },
  { name: 'Knee Osteoarthritis', percentage: 18, value: 61, color: '#10b981' },
  { name: 'Shoulder Impingement', percentage: 15, value: 51, color: '#f59e0b' },
  { name: 'Post-Surgical Rehab', percentage: 10, value: 34, color: '#ef4444' },
  { name: 'Other', percentage: 7, value: 24, color: '#6b7280' },
];

// Generate provider performance data
export const mockProviderPerformance: ProviderPerformance[] = [
  { metric: 'Patient Volume', value: 85, target: 80, trend: 'up' },
  { metric: 'Satisfaction Score', value: 92, target: 90, trend: 'stable' },
  { metric: 'Documentation', value: 78, target: 85, trend: 'down' },
  { metric: 'On-Time Rate', value: 88, target: 90, trend: 'up' },
  { metric: 'Treatment Outcomes', value: 81, target: 80, trend: 'up' },
];

// Generate weekly trends
export const generateWeeklyTrends = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    morning: 8 + Math.floor(Math.random() * 6),
    afternoon: 10 + Math.floor(Math.random() * 8),
    evening: 4 + Math.floor(Math.random() * 4),
  }));
};

// Generate revenue data
export const generateRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  return months.map((month, i) => ({
    month,
    revenue: 100000 + Math.floor(Math.random() * 50000),
    expenses: 70000 + Math.floor(Math.random() * 20000),
    profit: 30000 + Math.floor(Math.random() * 30000),
  }));
};