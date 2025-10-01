import { api } from './api';
import { fetchPromInstances } from './promsApi';
import type {
  DashboardAppointment,
  DashboardAppointmentStatus,
  DashboardData,
  DashboardStats,
  PendingProm,
} from '../types';

interface PatientDashboardAppointmentDto {
  id: string;
  providerId: string;
  providerName?: string | null;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType: string;
  status: string;
  location?: string | null;
}

interface PatientDashboardPromDto {
  id: string;
  templateName: string;
  completedAt: string;
  score: number;
  status: string;
}

interface PatientDashboardOverviewResponse {
  patientId: string;
  lastUpdated: string;
  upcomingAppointments: PatientDashboardAppointmentDto[];
  recentPromResponses: PatientDashboardPromDto[];
  medicationReminders: Array<{
    id: string;
    medicationName: string;
    nextDose: string;
    instructions?: string | null;
  }>;
  healthMetrics: Array<{
    metricName: string;
    value: number;
    unit: string;
    lastUpdated: string;
    trend: string;
  }>;
  unreadMessagesCount: number;
  nextAppointment?: PatientDashboardAppointmentDto | null;
}

interface PatientHealthSummaryResponse {
  patientId: string;
  patientName: string;
  dateOfBirth?: string | null;
  lastVisit?: string | null;
  activeConditions: string[];
  activeMedications: Array<{
    name: string;
    startDate: string;
    status: string;
  }>;
  recentVitals: Array<{
    type: string;
    value: string;
    unit: string;
    recordedAt: string;
  }>;
}

const APPOINTMENT_LIMIT_DEFAULT = 3;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

const normaliseAppointmentStatus = (status: string): DashboardAppointmentStatus => {
  const value = status.toLowerCase();
  switch (value) {
    case 'confirmed':
      return 'confirmed';
    case 'completed':
      return 'completed';
    case 'cancelled':
    case 'canceled':
      return 'cancelled';
    case 'no-show':
    case 'noshow':
      return 'no-show';
    default:
      return 'scheduled';
  }
};

const mapOverviewAppointment = (appointment: PatientDashboardAppointmentDto): DashboardAppointment => ({
  id: appointment.id,
  providerName: appointment.providerName ?? 'Assigned Provider',
  providerSpecialty: undefined,
  appointmentType: appointment.appointmentType,
  scheduledStart: appointment.scheduledStart,
  scheduledEnd: appointment.scheduledEnd,
  location: appointment.location ?? undefined,
  isVirtual: appointment.location?.toLowerCase().includes('tele') ?? false,
  status: normaliseAppointmentStatus(appointment.status),
});

const mapPendingProm = (id: string, templateName: string, scheduledFor: string, dueDate?: string): PendingProm => {
  const referenceDate = dueDate ?? scheduledFor;
  let daysOverdue: number | undefined;
  if (referenceDate) {
    const due = new Date(referenceDate);
    if (!Number.isNaN(due.getTime())) {
      const diff = Math.floor((Date.now() - due.getTime()) / MS_PER_DAY);
      daysOverdue = diff > 0 ? diff : undefined;
    }
  }

  return {
    id,
    templateName,
    scheduledFor,
    daysOverdue,
  };
};

export async function fetchDashboardOverview(): Promise<PatientDashboardOverviewResponse> {
  return api.get<PatientDashboardOverviewResponse>('/api/patient-dashboard/overview');
}

export async function fetchHealthSummary(): Promise<PatientHealthSummaryResponse> {
  return api.get<PatientHealthSummaryResponse>('/api/patient-dashboard/health-summary');
}

export async function fetchPendingProms(limit = APPOINTMENT_LIMIT_DEFAULT): Promise<PendingProm[]> {
  const instances = await fetchPromInstances('pending');

  const parseOrderDate = (value?: string) => {
    if (!value) {
      return Number.MAX_SAFE_INTEGER;
    }
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? Number.MAX_SAFE_INTEGER : timestamp;
  };

  return instances
    .sort((a, b) => {
      const first = parseOrderDate(a.dueDate ?? a.scheduledFor ?? a.assignedDate);
      const second = parseOrderDate(b.dueDate ?? b.scheduledFor ?? b.assignedDate);
      return first - second;
    })
    .slice(0, limit)
    .map((instance) => {
      const scheduledFor =
        instance.scheduledFor ?? instance.dueDate ?? instance.assignedDate ?? new Date().toISOString();
      return mapPendingProm(instance.id, instance.templateName, scheduledFor, instance.dueDate);
    });
}

export function deriveDashboardStats(
  overview: PatientDashboardOverviewResponse,
  pendingProms: PendingProm[],
  healthSummary?: PatientHealthSummaryResponse,
): DashboardStats {
  return {
    upcomingAppointments: overview.upcomingAppointments?.length ?? 0,
    pendingProms: pendingProms.length,
    completedEvaluations: healthSummary?.activeConditions?.length ?? 0,
    lastVisit: healthSummary?.lastVisit ?? undefined,
  };
}

export function mapUpcomingAppointments(
  overview: PatientDashboardOverviewResponse,
  limit = APPOINTMENT_LIMIT_DEFAULT,
): DashboardAppointment[] {
  return (overview.upcomingAppointments ?? [])
    .slice(0, limit)
    .map(mapOverviewAppointment);
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [overview, pendingProms, healthSummary] = await Promise.all([
    fetchDashboardOverview(),
    fetchPendingProms(),
    fetchHealthSummary().catch(() => undefined),
  ]);

  return deriveDashboardStats(overview, pendingProms, healthSummary);
}

export async function fetchUpcomingAppointments(limit = APPOINTMENT_LIMIT_DEFAULT): Promise<DashboardAppointment[]> {
  const overview = await fetchDashboardOverview();
  return mapUpcomingAppointments(overview, limit);
}

export async function fetchDashboardData(limit = APPOINTMENT_LIMIT_DEFAULT): Promise<DashboardData> {
  const [overview, pendingProms, healthSummary] = await Promise.all([
    fetchDashboardOverview(),
    fetchPendingProms(limit),
    fetchHealthSummary().catch(() => undefined),
  ]);

  return {
    stats: deriveDashboardStats(overview, pendingProms, healthSummary),
    upcomingAppointments: mapUpcomingAppointments(overview, limit),
    pendingProms,
  };
}
